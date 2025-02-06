import { type SpotInput } from './types';

export const validateSpotData = (data: SpotInput) => {
  // וולידציה של שם
  if (!data.name?.trim() || data.name.length < 2) {
    throw new Error('שם המקום חייב להכיל לפחות 2 תווים');
  }
  
  // וולידציה של כתובת
  if (!data.address?.trim()) {
    throw new Error('חובה להזין כתובת');
  }
  
  // וולידציה של מיקום - חייב להיות בתחומי ישראל
  if (data.latitude < 29 || data.latitude > 34 || 
      data.longitude < 34 || data.longitude > 36) {
    throw new Error('המיקום חייב להיות בתחומי ישראל');
  }

  // וולידציה של קטגוריה
  if (!['בית קפה', 'מסעדה', 'בר', 'אטרקציה', 'טבע', 'אחר'].includes(data.category)) {
    throw new Error('קטגוריה לא חוקית');
  }

  // וולידציה של טווח מחירים
  if (data.price_range && !['חינם', 'זול', 'בינוני', 'יקר'].includes(data.price_range)) {
    throw new Error('טווח מחירים לא חוקי');
  }

  // וולידציה של סוג כשרות
  if (data.kosher_type && !['לא כשר', 'כשר', 'מהדרין'].includes(data.kosher_type)) {
    throw new Error('סוג כשרות לא חוקי');
  }

  // וולידציה של אזור
  if (data.region && !['צפון', 'מרכז', 'דרום', 'ירושלים'].includes(data.region)) {
    throw new Error('אזור לא חוקי');
  }
}; 