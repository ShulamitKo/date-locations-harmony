import React, { useEffect, useState } from 'react';
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

interface AboutDialogProps {
  trigger?: React.ReactNode;
}

export function AboutDialog({ trigger }: AboutDialogProps) {
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const hasSeenAbout = localStorage.getItem('hasSeenAbout');
    if (!hasSeenAbout) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hasSeenAbout', 'true');
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-[90vw] md:max-w-[800px] overflow-y-auto max-h-[90vh] bg-background">
        <DialogHeader className="border-b pb-4 mb-6">
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-primary/90 to-primary bg-clip-text text-transparent">
            ברוכים הבאים ל-DateSpots! 👋
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-8 text-right px-2">
          <p className="text-lg leading-relaxed text-muted-foreground">
            שמחים שהגעתם! אנחנו מאמינים שלכל דייט מגיע את המקום המושלם, ושיחד נוכל ליצור את המדריך הטוב ביותר למקומות דייטים מותאמים במיוחד עבורנו.
          </p>

          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary">מה תמצאו כאן? 🤔</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>מפה אינטראקטיבית עם מגוון מקומות לדייטים</p>
              <p>מידע חיוני על כל מקום - כשרות, אווירה, מחירים ועוד</p>
              <p>ביקורות והמלצות אמיתיות מאנשים כמוכם</p>
              <p>מערכת חיפוש וסינון חכמה שתעזור לכם למצוא בדיוק את מה שאתם מחפשים</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">איך זה עובד? 💡</h3>
            <p className="mb-3 text-muted-foreground">פשוט מאוד! אין צורך בהרשמה או בפרטים מזהים. אתם יכולים:</p>
            <div className="space-y-2 text-muted-foreground">
              <p>לחפש מקומות לפי קטגוריות: בתי קפה, מסעדות, ברים ופעילויות</p>
              <p>לסנן לפי אזור, כשרות, טווח מחירים ועוד</p>
              <p>לראות את המקומות על המפה ולמצוא מקומות קרובים אליכם</p>
              <p>להוסיף מקומות חדשים ולשתף עם הקהילה</p>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary">גלו מקומות חדשים! 🗺️</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>מצאו מקומות לפי הטעם והסגנון שלכם</p>
              <p>גלו אפשרויות חדשות באזור שלכם</p>
              <p>קבלו המלצות מותאמות אישית</p>
              <p>חסכו זמן בחיפוש אחר המקום המושלם</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-3 text-primary">בואו נעשה את זה יחד! 🤝</h3>
            <p className="text-muted-foreground">האפליקציה הזו מתבססת על החוכמה המשותפת של כולנו. ככל שיותר אנשים ישתפו את ההמלצות והחוויות שלהם, כך כולנו נרוויח ממידע טוב יותר על מקומות מתאימים לדייטים.</p>
          </div>

          <div className="bg-primary/5 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3 text-primary">הצטרפו אלינו! 🌟</h3>
            <div className="space-y-2 text-muted-foreground">
              <p>מצאתם מקום נחמד? לחצו על הוסף מקום וככה כולם ידעו ויהנו</p>
              <p>ביקרתם באחד המקומות? שתפו את החוויה שלכם</p>
              <p>יש לכם טיפ שווה? אל תשמרו אותו לעצמכם</p>
            </div>
          </div>

          <p className="text-xl font-semibold text-center text-primary">יחד נוכל ליצור את המדריך הטוב ביותר למקומות דייטים! ❤️</p>
        </div>

        <DialogFooter className="flex-col items-center gap-4 mt-8 pt-6 border-t">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label htmlFor="dontShowAgain" className="text-muted-foreground">אל תציג הודעה זו שוב</Label>
          </div>
          <Button onClick={handleClose} className="w-full sm:w-auto bg-gradient-to-r from-primary/90 to-primary hover:from-primary hover:to-primary/90">
            התחילו לגלות מקומות!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 