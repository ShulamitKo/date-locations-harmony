import { supabase } from './supabase/client';
import type { Database } from './supabase/database.types';

export type RateLimitAction = 'addSpot' | 'editSpot' | 'report' | 'review';

const RATE_LIMITS = {
  addSpot: {
    maxPerDay: 6,
    maxPerHour: 3,
    ttl: 60 * 60 // שעה בשניות
  },
  editSpot: {
    maxPerDay: 5,
    maxPerHour: 3,
    ttl: 60 * 60
  },
  report: {
    maxPerDay: 5,
    maxPerHour: 2,
    ttl: 60 * 60
  },
  review: {
    maxPerDay: 6,
    maxPerHour: 3,
    ttl: 60 * 60
  }
} as const;

interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts: number;
}

async function getRateLimitRecord(key: string): Promise<Database['public']['Tables']['rate_limits']['Row'] | null> {
  try {
    console.log('Fetching rate limit record for key:', key);
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select()
      .eq('key', key)
      .maybeSingle();

    console.log('Fetch result:', { data, error });

    if (error) {
      console.error('Error fetching rate limit:', error);
      return null;
    }

    // בדיקה אם הרשומה פגה תוקף
    if (data && new Date(data.expires_at) < new Date()) {
      console.log('Record expired:', { key, expires_at: data.expires_at });
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getRateLimitRecord:', error);
    return null;
  }
}

async function updateRateLimit(key: string, attempts: number, expires_at: string): Promise<boolean> {
  try {
    console.log('Trying to update rate limit:', { key, attempts, expires_at });
    
    // קודם ננסה לעדכן רשומה קיימת
    const { data: updateData, error: updateError } = await supabase
      .from('rate_limits')
      .update({ attempts, expires_at })
      .eq('key', key)
      .select();

    console.log('Update attempt result:', { updateData, updateError });

    // אם אין שגיאה אבל לא התעדכנו שורות, או אם קיבלנו שגיאה שהרשומה לא קיימת
    if ((updateData && updateData.length === 0) || updateError?.code === 'PGRST116') {
      console.log('Record not found, trying to insert new one');
      const { data: insertData, error: insertError } = await supabase
        .from('rate_limits')
        .insert([{ key, attempts, expires_at }]);

      console.log('Insert attempt result:', { insertData, insertError });

      if (insertError) {
        console.error('Failed to insert rate limit:', insertError);
        
        // אם נכשל ביצירה, ננסה לעדכן שוב (למקרה שנוצרה בינתיים)
        const { error: finalUpdateError } = await supabase
          .from('rate_limits')
          .update({ attempts, expires_at })
          .eq('key', key);

        if (finalUpdateError) {
          console.error('Error in final update attempt:', finalUpdateError);
          return false;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error in updateRateLimit:', error);
    return false;
  }
}

export async function checkRateLimit(
  action: RateLimitAction,
  userIp: string
): Promise<RateLimitCheck> {
  const hourlyKey = `${action}:${userIp}:hourly`;
  const dailyKey = `${action}:${userIp}:daily`;
  const now = new Date();

  try {
    // בדיקת מגבלה שעתית
    const hourlyRecord = await getRateLimitRecord(hourlyKey);
    const hourlyAttempts = hourlyRecord?.attempts || 0;
    const hourlyLimit = RATE_LIMITS[action].maxPerHour;

    // בדיקת מגבלה יומית
    const dailyRecord = await getRateLimitRecord(dailyKey);
    const dailyAttempts = dailyRecord?.attempts || 0;
    const dailyLimit = RATE_LIMITS[action].maxPerDay;

    console.log('Rate Limit Check:', {
      action,
      userIp,
      hourly: { attempts: hourlyAttempts, limit: hourlyLimit },
      daily: { attempts: dailyAttempts, limit: dailyLimit },
      hourlyRecord,
      dailyRecord
    });

    // בדיקה אם הגענו למגבלה
    if (hourlyAttempts >= hourlyLimit || dailyAttempts >= dailyLimit) {
      console.log('Rate limit exceeded:', {
        hourlyExceeded: hourlyAttempts >= hourlyLimit,
        dailyExceeded: dailyAttempts >= dailyLimit
      });
      return {
        allowed: false,
        remainingAttempts: 0
      };
    }

    // עדכון מונים רק אם לא הגענו למגבלה
    const hourlyExpiry = new Date(now.getTime() + RATE_LIMITS[action].ttl * 1000);
    const dailyExpiry = new Date(now);
    dailyExpiry.setHours(23, 59, 59, 999);

    // עדכון בו-זמני של שני המונים
    const [hourlySuccess, dailySuccess] = await Promise.all([
      updateRateLimit(hourlyKey, hourlyAttempts + 1, hourlyExpiry.toISOString()),
      updateRateLimit(dailyKey, dailyAttempts + 1, dailyExpiry.toISOString())
    ]);

    // בדיקת שגיאות בעדכון
    if (!hourlySuccess || !dailySuccess) {
      console.error('Error updating rate limits');
      return { allowed: false, remainingAttempts: 0 };
    }

    return {
      allowed: true,
      remainingAttempts: Math.min(
        hourlyLimit - (hourlyAttempts + 1),
        dailyLimit - (dailyAttempts + 1)
      )
    };
  } catch (error) {
    console.error('Rate limit error:', error);
    return { allowed: false, remainingAttempts: 0 };
  }
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const { error } = await supabase.rpc('cleanup_expired_rate_limits');
    if (error) {
      // נתעלם משגיאות הרשאה כי הניקוי יקרה אוטומטית על ידי הטריגר
      if (error.code === 'PGRST301') {
        return;
      }
      console.error('Failed to cleanup rate limits:', error.message);
    }
  } catch (error) {
    // נתעלם משגיאות כי הניקוי יקרה אוטומטית על ידי הטריגר
    console.debug('Error during rate limits cleanup - will be handled by trigger');
  }
}

// פונקציה לבדיקת סטטוס המגבלות הנוכחי
export async function getRateLimitStatus(
  action: RateLimitAction,
  userIp: string
): Promise<{
  hourly: { used: number; limit: number; resetsAt?: string };
  daily: { used: number; limit: number; resetsAt?: string };
}> {
  const hourlyKey = `${action}:${userIp}:hourly`;
  const dailyKey = `${action}:${userIp}:daily`;

  const [hourlyRecord, dailyRecord] = await Promise.all([
    getRateLimitRecord(hourlyKey),
    getRateLimitRecord(dailyKey)
  ]);

  return {
    hourly: {
      used: hourlyRecord?.attempts || 0,
      limit: RATE_LIMITS[action].maxPerHour,
      resetsAt: hourlyRecord?.expires_at
    },
    daily: {
      used: dailyRecord?.attempts || 0,
      limit: RATE_LIMITS[action].maxPerDay,
      resetsAt: dailyRecord?.expires_at
    }
  };
} 