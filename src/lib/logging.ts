import { supabase } from '@/lib/supabase/client';
import { EMAIL_STYLES } from '@/components/email-styles';

export const logTypes = {
  SPOT_ADDED: 'spot_added',
  SPOT_EDITED: 'spot_edited',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  ERROR: 'error'
} as const;

export type LogType = keyof typeof logTypes;
export type LogSeverity = 'info' | 'warning' | 'error';

const getUserIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting IP:', error);
    return 'unknown';
  }
};

export const logEvent = async (
  type: LogType,
  data: any,
  severity: LogSeverity = 'info'
) => {
  try {
    const ip = await getUserIP();
    
    await supabase.from('logs').insert({
      type: logTypes[type],
      data,
      severity,
      timestamp: new Date().toISOString(),
      ip_address: ip,
      user_agent: navigator.userAgent
    });

    // שליחת התראה במקרה של אירוע חשוד
    if (severity === 'warning' || severity === 'error') {
      await notifyAdmin({
        type,
        data,
        severity
      });
    }
  } catch (error) {
    console.error('Error logging event:', error);
  }
};

const notifyAdmin = async (event: {
  type: LogType;
  data: any;
  severity: LogSeverity;
}) => {
  const formData = new FormData();
  
  // כותרת המייל
  formData.append('_subject', `התראת מערכת: ${event.type}`);
  
  // תוכן המייל
  const content = `
    <div dir="rtl">
      <h2>התראת מערכת</h2>
      <p><strong>סוג:</strong> ${event.type}</p>
      <p><strong>חומרה:</strong> ${event.severity}</p>
      <p><strong>זמן:</strong> ${new Date().toLocaleString('he-IL')}</p>
      <p><strong>פרטים:</strong></p>
      <pre>${JSON.stringify(event.data, null, 2)}</pre>
    </div>
  `;
  formData.append('message', content);
  
  // הגדרות נוספות
  formData.append('_template', 'box');
  formData.append('_captcha', 'false');
  formData.append('_style', EMAIL_STYLES);
  
  // שליחה
  try {
    const response = await fetch('https://formsubmit.co/a09aea30b021efbcf8b44ca97295d15f', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to send admin notification');
    }
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
}; 