export const validateForm = (formData: FormData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  const subject = formData.get('subject') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  if (subject.length < 2) {
    errors.push('נושא חייב להכיל לפחות 2 תווים');
  }

  if (name.length < 2) {
    errors.push('שם חייב להכיל לפחות 2 תווים');
  }

  if (message.length < 10) {
    errors.push('תוכן ההודעה חייב להכיל לפחות 10 תווים');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('כתובת האימייל אינה תקינה');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 