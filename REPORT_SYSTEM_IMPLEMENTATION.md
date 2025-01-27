# מימוש מערכת דיווחים וחסימות

## מטרת המערכת
מערכת זו נועדה לאפשר:
- דיווח על תוכן לא ראוי
- טיפול אוטומטי במקומות בעייתיים
- שקיפות בתהליך הדיווח והחסימה
- אפשרות ערעור על חסימות

## שינויים נדרשים במסד הנתונים

### 1. הוספת טבלת דיווחים
```sql
create table reports (
  id uuid default uuid_generate_v4() primary key,
  spot_id uuid references spots(id),
  report_type text not null check (report_type in ('spam', 'offensive', 'incorrect', 'other')),
  description text,
  reporter_ip text,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  status text default 'pending' check (status in ('pending', 'resolved', 'rejected'))
);

-- אינדקס לחיפוש מהיר של דיווחים למקום
create index reports_spot_id_idx on reports(spot_id);
```

### 2. הוספת שדה סטטוס למקומות
```sql
alter table spots 
add column status text default 'active' 
check (status in ('active', 'under_review', 'blocked'));
```

## רכיבי המערכת

### 1. כפתור דיווח
```typescript
// src/components/ReportButton.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { spotsTable } from '@/lib/supabase/config';
import { useToast } from '@/components/ui/use-toast';

export const ReportButton = ({ spotId }: { spotId: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleReport = async (reportType: string) => {
    try {
      const { error } = await spotsTable.reports.insert({
        spot_id: spotId,
        report_type: reportType
      });
      
      if (error) throw error;
      
      toast({
        title: "תודה על הדיווח",
        description: "נבדוק את הדיווח בהקדם"
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "שגיאה בשליחת הדיווח",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button variant="ghost" onClick={() => setIsOpen(true)}>
        דווח על בעיה
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>דיווח על מקום</DialogTitle>
          </DialogHeader>
          <Select onValueChange={handleReport}>
            <SelectTrigger>
              <SelectValue placeholder="בחר סוג דיווח" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="spam">ספאם</SelectItem>
              <SelectItem value="offensive">תוכן פוגעני</SelectItem>
              <SelectItem value="incorrect">מידע שגוי</SelectItem>
              <SelectItem value="other">אחר</SelectItem>
            </SelectContent>
          </Select>
        </DialogContent>
      </Dialog>
    </>
  );
};
```

### 2. דף למקומות חסומים
```typescript
// src/pages/BlockedSpotPage.tsx

import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { spotsTable } from '@/lib/supabase/config';
import { useToast } from '@/components/ui/use-toast';
import type { Spot } from '@/lib/supabase/types';

export default function BlockedSpotPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [spot, setSpot] = useState<Spot | null>(null);
  
  useEffect(() => {
    const loadSpot = async () => {
      const { data, error } = await spotsTable
        .select('*')
        .eq('id', id)
        .single();
        
      if (error || !data) {
        navigate('/');
        return;
      }
      
      setSpot(data);
    };
    
    loadSpot();
  }, [id]);
  
  const handleAppeal = async () => {
    const { error } = await spotsTable.appeals.insert({
      spot_id: id,
      reason: 'appeal_requested'
    });
    
    if (error) {
      toast({
        title: "שגיאה בשליחת הערעור",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
      return;
    }
    
    toast({
      title: "הערעור נשלח בהצלחה",
      description: "נבדוק את הערעור בהקדם"
    });
  };
  
  if (!spot) return null;
  
  return (
    <div className="container mx-auto p-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">מקום זה אינו זמין</h1>
        <p className="mb-4">
          מקום זה הוסר מהאפליקציה בעקבות דיווחי משתמשים על תוכן לא ראוי.
        </p>
        <Button onClick={handleAppeal}>
          ערער על החסימה
        </Button>
      </Card>
    </div>
  );
}
```

### 3. לוגיקת בדיקת דיווחים
```typescript
// src/lib/reports.ts

export const checkReports = async (spotId: string) => {
  const { count } = await spotsTable
    .from('reports')
    .select('*', { count: 'exact' })
    .eq('spot_id', spotId)
    .eq('status', 'pending')
    .gt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));

  if (count > 5) {
    await spotsTable
      .from('spots')
      .update({ status: 'under_review' })
      .eq('id', spotId);
      
    // שליחת התראה למנהלים
    notifyAdmins({
      type: 'spot_under_review',
      spotId,
      reportCount: count
    });
  }
};
```

## שילוב במערכת

### 1. הוספת כפתור דיווח לכרטיס מקום
```typescript
// src/components/SpotCard.tsx

export default function SpotCard({ spot }: { spot: Spot }) {
  return (
    <Card>
      {spot.status === 'under_review' && (
        <Badge variant="warning" className="absolute top-2 right-2">
          בבדיקת מנהלים
        </Badge>
      )}
      <div className="p-4">
        {/* תוכן קיים */}
        <ReportButton spotId={spot.id} />
      </div>
    </Card>
  );
}
```

### 2. עדכון דף הבית
```typescript
// src/pages/HomePage.tsx

const loadSpots = async () => {
  const { data: spots, error } = await spotsTable
    .select('*')
    .eq('status', 'active')
    .or('status.eq.under_review');
    
  if (error) {
    console.error('Error loading spots:', error);
    return;
  }
  
  setSpots(spots);
};
```

## הגדרות נוספות

### 1. הגדרת Edge Function לבדיקת דיווחים
```typescript
// supabase/functions/check-reports/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: spots } = await supabase
    .from('spots')
    .select('id')
    .eq('status', 'active')

  for (const spot of spots) {
    await checkReports(spot.id)
  }

  return new Response(
    JSON.stringify({ message: 'Reports checked successfully' }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### 2. הגדרת Cron Job
```sql
select
  cron.schedule(
    'check-reports',
    '*/30 * * * *', -- כל 30 דקות
    $$
    select net.http_post(
      'https://your-project.supabase.co/functions/v1/check-reports',
      '{}'::jsonb,
      '{}'::jsonb,
      '30s'
    ) as request_id;
    $$
  );
```

## הערות חשובות

1. **אבטחה:**
   - הגבל את מספר הדיווחים מאותה כתובת IP
   - וודא שהדיווחים עוברים וולידציה
   - שמור על פרטיות המדווחים

2. **ביצועים:**
   - הוסף אינדקסים מתאימים לטבלת הדיווחים
   - הגדר TTL לדיווחים ישנים
   - שקול שימוש ב-cache עבור מקומות פופולריים

3. **חווית משתמש:**
   - הצג הודעות ברורות למשתמש
   - אפשר מעקב אחר סטטוס דיווח
   - ספק משוב על טיפול בדיווחים 