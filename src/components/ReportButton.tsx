import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Flag, Loader2 } from 'lucide-react';
import { reportsTable, spotsTable } from '@/lib/supabase/config';
import { EMAIL_STYLES } from './email-styles';
import { isRateLimitError } from '@/lib/rateLimit';

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

  const sendEmail = async (formData: Record<string, string>) => {
    const tempForm = document.createElement('form');
    tempForm.method = 'POST';
    tempForm.action = 'https://formsubmit.co/a09aea30b021efbcf8b44ca97295d15f';
    tempForm.target = 'submitFrame';

    // הוספת השדות לטופס
    Object.entries(formData).forEach(([key, value]) => {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value.toString();
      tempForm.appendChild(input);
    });

    // שליחת הטופס
    document.body.appendChild(tempForm);
    tempForm.submit();
    document.body.removeChild(tempForm);
  };

  const handleSubmit = async () => {
    if (!reportType) {
      toast({
        title: "שגיאה",
        description: "יש לבחור סוג דיווח",
        variant: "destructive"
      });
      return;
    }

    // הגבלת הקצב נאכפת בשרת (public.submit_report), לפי ה-IP האמיתי של הפנייה

    try {
      setIsSubmitting(true);

      // reporter_ip נקבע בשרת. הלקוח לא שולח אותו ולא קורא את טבלת הדיווחים.
      const report = await reportsTable.create({
        spot_id: spotId,
        report_type: reportType,
        description: description
      });

      // שליחת מייל על הדיווח החדש
      await sendEmail({
        '_subject': `דיווח חדש על המקום: ${spotName}`,
        '_template': 'box',
        '_captcha': 'false',
        '_style': EMAIL_STYLES,
        'מקום': spotName,
        'סוג דיווח': reportType,
        'תיאור': description,
        'מזהה דיווח': report.id
      });

      // מוני הדיווחים הפתוחים מגיעים מהשרת יחד עם הדיווח שנוצר
      if (report.open_total >= 3) {
        const spot = await spotsTable.getById(spotId);
        
        // שליחת מייל על מעבר לסטטוס בדיקת מנהלים
        await sendEmail({
          '_subject': `⚠️ התראה: מקום עבר לסטטוס בדיקת מנהלים: ${spotName}`,
          '_template': 'box',
          '_captcha': 'false',
          '_style': EMAIL_STYLES,
          'שם המקום': spotName,
          'כתובת': spot.address,
          'קטגוריה': spot.category,
          'כמות דיווחים פתוחים': report.open_total.toString(),
          'דיווחים ממתינים': report.open_pending.toString(),
          'דיווחים בבדיקה': report.open_in_review.toString(),
          'לפירוט מלא': 'מסך הניהול /admin/reports'
        });
      }

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
        title: isRateLimitError(error) ? "לא ניתן לשלוח דיווח כרגע" : "שגיאה בשליחת הדיווח",
        description: error instanceof Error && error.message
          ? error.message
          : "אנא נסה שוב מאוחר יותר",
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