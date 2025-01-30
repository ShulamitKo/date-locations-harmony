import { createClient } from '@supabase/supabase-js';
import { supabase } from './supabase/config';

export type RateLimitAction = 'addSpot' | 'editSpot' | 'report';

const RATE_LIMITS = {
  addSpot: {
    maxPerDay: 3,
    maxPerHour: 1,
    ttl: 60 * 60 // שעה בשניות
  },
  editSpot: {
    maxPerDay: 10,
    maxPerHour: 5,
    ttl: 60 * 60
  },
  report: {
    maxPerDay: 5,
    maxPerHour: 2,
    ttl: 60 * 60
  }
} as const;

export async function checkRateLimit(
  action: RateLimitAction,
  userIp: string
): Promise<{ allowed: boolean; remainingAttempts: number }> {
  const key = `${action}:${userIp}`;
  const now = Math.floor(Date.now() / 1000);

  try {
    // בדיקת מגבלת שעה
    const { data: hourlyData, error: hourlyError } = await supabase
      .from('rate_limits')
      .select('attempts')
      .eq('key', `${key}:hourly`)
      .single();

    if (hourlyError && hourlyError.code !== 'PGRST116') {
      console.error('Rate limit check failed:', hourlyError);
      return { allowed: false, remainingAttempts: 0 };
    }

    const hourlyAttempts = hourlyData?.attempts || 0;
    const hourlyLimit = RATE_LIMITS[action].maxPerHour;

    if (hourlyAttempts >= hourlyLimit) {
      return {
        allowed: false,
        remainingAttempts: hourlyLimit - hourlyAttempts
      };
    }

    // עדכון מונה שעתי
    await supabase.from('rate_limits').upsert({
      key: `${key}:hourly`,
      attempts: hourlyAttempts + 1,
      expires_at: new Date(now * 1000 + RATE_LIMITS[action].ttl * 1000)
    });

    return {
      allowed: true,
      remainingAttempts: hourlyLimit - (hourlyAttempts + 1)
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: false, remainingAttempts: 0 };
  }
}

export async function incrementRateLimit(
  action: RateLimitAction,
  userIp: string
): Promise<void> {
  const key = `${action}:${userIp}`;
  
  try {
    await supabase.from('rate_limits').upsert({
      key: `${key}:hourly`,
      attempts: 1,
      expires_at: new Date(Date.now() + RATE_LIMITS[action].ttl * 1000)
    });
  } catch (error) {
    console.error('Failed to increment rate limit:', error);
  }
} 