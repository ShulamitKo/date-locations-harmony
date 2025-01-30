import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Flag, Loader2 } from 'lucide-react';
import { reportsTable } from '@/lib/supabase/config';
import { EMAIL_STYLES } from './email-styles';

const REPORT_TYPES = [
  { value: 'spam', label: 'תוכן זבל/ספאם' },
  { value: 'inappropriate', label: 'תוכן לא ראוי' },
  { value: 'closed', label: 'מקום סגור' },
  { value: 'duplicate', label: 'מקום כפול' },
  { value: 'other', label: 'אחר' }
] as const;

type ReportType = typeof REPORT_TYPES[number]['value'];

interface ReportButtonProps {
  spotId: string;
  spotName: string;
  className?: string;
  onReportSubmitted?: () => void;
}

export function ReportButton({ spotId, spotName, className, onReportSubmitted }: ReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportType, setReportType] = useState<ReportType | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!reportType) {
      toast({
        title: "שגיאה",
        description: "יש לבחור סוג דיווח",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // קבלת IP של המשתמש
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const userIp = data.ip;

      const report = await reportsTable.create({
        spot_id: spotId,
        report_type: reportType,
        description: description,
        reporter_ip: userIp
      });

      // בדיקת מספר הדיווחים הפתוחים למקום זה
      const { count } = await reportsTable.getOpenReportsCount(spotId);
      const isUnderReview = count >= 3;

      // שליחת מייל באמצעות FormSubmit
      const tempForm = document.createElement('form');
      tempForm.method = 'POST';
      tempForm.action = 'https://formsubmit.co/a09aea30b021efbcf8b44ca97295d15f';
      tempForm.target = 'submitFrame';

      // הוספת שדות נסתרים לעיצוב והגדרות
      const hiddenFields = {
        '_subject': `דיווח חדש על המקום: ${spotName}${isUnderReview ? ' - עבר לסטטוס בדיקה!' : ''}`,
        '_template': 'box',
        '_captcha': 'false',
        '_style': EMAIL_STYLES,
        'מקום': spotName,
        'סוג דיווח': reportType,
        'תיאור': description,
        'IP המדווח': userIp,
        'מזהה דיווח': report.id,
        'סטטוס': isUnderReview ? '⚠️ המקום עבר לסטטוס בדיקה!' : 'ממתין לבדיקה',
        'קישור לניהול': 'https://datespots.co.il/admin/reports',
        'מספר דיווחים פתוחים': count.toString()
      };

      // הוספת השדות לטופס
      Object.entries(hiddenFields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value.toString();
        tempForm.appendChild(input);
      });

      // הוספת iframe נסתר
      const iframe = document.createElement('iframe');
      iframe.name = 'submitFrame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // שליחת הטופס
      document.body.appendChild(tempForm);
      tempForm.submit();
      document.body.removeChild(tempForm);

      toast({
        title: "תודה על הדיווח",
        description: "הדיווח שלך התקבל ויטופל בהקדם"
      });

      onReportSubmitted?.();

      setIsOpen(false);
      setReportType('');
      setDescription('');

    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "שגיאה בשליחת הדיווח",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <iframe
        name="submitFrame"
        style={{ display: 'none' }}
      />
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${className}`}
      >
        <Flag className="h-4 w-4 ml-2" />
        דווח על בעיה
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>דיווח על {spotName}</DialogTitle>
            <DialogDescription>
              אנא בחר את סוג הבעיה ותאר אותה בקצרה
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-3">
              <Label>סוג הדיווח</Label>
              <RadioGroup
                value={reportType}
                onValueChange={(value) => setReportType(value as ReportType)}
                className="flex flex-col gap-3"
              >
                {REPORT_TYPES.map(({ value, label }) => (
                  <div key={value} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={value} id={value} />
                    <Label htmlFor={value} className="font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>תיאור הבעיה</Label>
              <Textarea
                placeholder="תאר את הבעיה..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            <Button 
              onClick={handleSubmit}
              disabled={!reportType || !description || isSubmitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>שולח...</span>
                </div>
              ) : (
                'שלח דיווח'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 