import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface TermsDialogProps {
  trigger?: React.ReactNode;
}

export function TermsDialog({ trigger }: TermsDialogProps) {
  const [open, setOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenTerms = localStorage.getItem('hasSeenTerms');
    if (!hasSeenTerms) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (agreed) {
      if (dontShowAgain) {
        localStorage.setItem('hasSeenTerms', 'true');
      }
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[90vw] md:max-w-[800px] overflow-y-auto max-h-[90vh] bg-background">
        <DialogHeader className="border-b pb-4 mb-6">
          <DialogTitle className="text-2xl sm:text-3xl font-bold text-center bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent px-2">
            תנאי שימוש
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6 sm:space-y-8 text-right px-2">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-primary">ברוכים הבאים ל-DateSpots!</h2>
            <p className="text-base sm:text-lg leading-relaxed text-muted-foreground">
              אנחנו שמחים שבחרתם להצטרף לקהילת DateSpots. האתר נוצר במטרה לעזור לכולנו למצוא מקומות מתאימים לדייטים, והוא מבוסס על שיתוף מידע קהילתי.
            </p>
          </div>

          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary">על האתר והשימוש בו</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>DateSpots הוא פלטפורמה קהילתית לשיתוף המלצות על מקומות לדייטים</p>
              <p>השימוש באתר הוא חופשי וללא עלות</p>
              <p>המידע באתר מבוסס על המלצות משתמשים</p>
              <p>אין צורך בהרשמה או במסירת פרטים אישיים</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">אחריות ושימוש במידע</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>המידע באתר מסופק "כפי שהוא" (AS IS)</p>
              <p>אנחנו לא יכולים להבטיח את דיוק המידע או התאמתו למטרה מסוימת</p>
              <p>מומלץ לבדוק את פרטי המקומות (כשרות, שעות פתיחה וכדומה) ישירות מול בתי העסק</p>
              <p>האתר ומפתחיו אינם אחראים לכל נזק שעלול להיגרם משימוש במידע המופיע באתר</p>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary">כללי התנהגות בסיסיים</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>יש לשתף מידע אמיתי ומדויק ככל האפשר</p>
              <p>יש לכבד את הפרטיות של אחרים</p>
              <p>אין לפרסם תוכן פוגעני או לא חוקי</p>
              <p>אנו שומרים את הזכות להסיר תוכן לא הולם</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">הצהרה כללית</h3>
            <p className="text-muted-foreground">
              השימוש באתר מהווה הסכמה לתנאים אלה. האתר נוצר בכוונה טובה ומתוך רצון לעזור, אך השימוש בו הוא באחריות המשתמשים בלבד.
            </p>
          </div>

          <p className="text-base sm:text-lg text-center text-primary font-medium px-2">
            תודה על שיתוף הפעולה ועל העזרה בבניית מאגר מידע קהילתי שימושי לכולנו! ❤️
          </p>
        </div>

        <DialogFooter className="flex flex-col items-center gap-3 sm:gap-4 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t px-2 sm:px-4">
          <div className="flex items-start sm:items-center gap-2 w-full">
            <Checkbox 
              id="terms" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-1 sm:mt-0"
            />
            <Label htmlFor="terms" className="text-sm sm:text-base">קראתי והבנתי את תנאי השימוש</Label>
          </div>
          <div className="flex items-start sm:items-center gap-2 w-full">
            <Checkbox 
              id="dontShow" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
              className="mt-1 sm:mt-0"
            />
            <Label htmlFor="dontShow" className="text-sm sm:text-base">אל תציג חלון זה שוב</Label>
          </div>
          <Button 
            variant="outline" 
            className="w-full sm:w-auto mt-2"
            disabled={!agreed}
            onClick={handleClose}
          >
            אישור והמשך לאתר
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 