import { supabase } from './supabase/client';

export type RateLimitAction = 'addSpot' | 'editSpot' | 'report' | 'review';

/**
 * הגבלת הקצב נאכפת בבסיס הנתונים (public.rl_hit), לפי כתובת ה-IP שהשרת
 * רואה בפועל - ולא לפי IP שהדפדפן מדווח על עצמו. הפונקציות submit_spot /
 * edit_spot / submit_review / submit_report קוראות לה בעצמן, ולכן אין כאן
 * בדיקה מקדימה: בדיקה כזו הייתה סופרת פעמיים ובכל מקרה ניתנת לדילוג.
 *
 * חריגה ממכסה מוחזרת כשגיאה מהשרת עם הודעה בעברית, והמסכים מציגים אותה.
 * הפונקציה נשארת כאן כדי לא לשנות את אתרי הקריאה הקיימים.
 */
export interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts: number;
}

export async function checkRateLimit(
  _action: RateLimitAction,
  _userIp?: string | null
): Promise<RateLimitCheck> {
  return { allowed: true, remainingAttempts: -1 };
}

/** ההודעה שהשרת מחזיר כשחורגים ממכסה */
export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return message.includes('מכסת הפעולות');
}

export async function cleanupExpiredRateLimits(): Promise<void> {
  try {
    const { error } = await supabase.rpc('cleanup_expired_rate_limits');
    if (error) {
      // הניקוי קורה גם אוטומטית בטריגר - אין טעם להרעיש על שגיאת הרשאה
      console.debug('Rate limit cleanup skipped:', error.message);
    }
  } catch {
    console.debug('Error during rate limits cleanup - will be handled by trigger');
  }
}
