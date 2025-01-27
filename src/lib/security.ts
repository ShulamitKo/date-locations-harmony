import { type SpotInput } from './types';

export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input
    .replace(/[<>]/g, '')    // מניעת XSS בסיסית
    .replace(/&/g, '&amp;')  // המרת תווים מיוחדים
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, 1000);         // הגבלת אורך
};

export const sanitizeSpotData = (data: SpotInput): SpotInput => {
  return {
    ...data,
    name: sanitizeInput(data.name),
    address: sanitizeInput(data.address),
    notes: data.notes ? sanitizeInput(data.notes) : undefined,
    // שדות מספריים לא צריכים סניטציה
    latitude: data.latitude,
    longitude: data.longitude,
    // שדות enum מוגנים על ידי הטיפוס
    category: data.category,
    price_range: data.price_range,
    kosher_type: data.kosher_type,
    region: data.region,
    suitable_for_first_date: data.suitable_for_first_date
  };
}; 