import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { reportsTable, spotsTable, adminTable } from '@/lib/supabase/config';
import type { Report, Spot } from '@/lib/supabase/types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// רשימת IP-ים מורשים
//const ALLOWED_IPS = ['YOUR_IP_HERE']; // החלף עם ה-IP שלך

type ReportWithSpot = Report & { spot: Spot | null };

export default function AdminReports() {
  const [reports, setReports] = useState<ReportWithSpot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      const isAuthorized = await adminTable.checkAccess();
      
      if (!isAuthorized) {
        toast({
          title: "גישה נדחתה",
          description: "אין לך הרשאות לצפות בדף זה",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      loadReports();
    } catch (error) {
      console.error('Error checking authorization:', error);
      toast({
        title: "שגיאה בבדיקת הרשאות",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive"
      });
      navigate('/');
    }
  };

  const loadReports = async () => {
    try {
      const allReports = await reportsTable.getAll();
      
      // טעינת פרטי המקומות עבור כל דיווח
      const reportsWithSpots = await Promise.all(
        allReports.map(async (report) => {
          try {
            const spot = await spotsTable.getById(report.spot_id);
            return { ...report, spot };
          } catch (error) {
            console.error(`Error loading spot ${report.spot_id}:`, error);
            return { ...report, spot: null };
          }
        })
      );

      setReports(reportsWithSpots);
    } catch (error) {
      console.error('Error loading reports:', error);
      toast({
        title: "שגיאה בטעינת הדיווחים",
        description: "אנא נסה לרענן את העמוד",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (reportId: string, newStatus: Report['status']) => {
    try {
      // עדכון סטטוס הדיווח
      await reportsTable.updateStatus(reportId, newStatus, adminNotes[reportId]);
      
      // מציאת הדיווח הנוכחי
      const currentReport = reports.find(r => r.id === reportId);
      if (!currentReport?.spot_id) return;

      // בדיקה אם נשארו דיווחים לא מטופלים על המקום
      const remainingReports = reports.filter(r => 
        r.spot_id === currentReport.spot_id && 
        r.id !== reportId && 
        ['pending', 'in_review'].includes(r.status)
      );

      // רק אם אין יותר דיווחים לא מטופלים, מחזירים את סטטוס המקום ל-active
      if (remainingReports.length === 0) {
        await spotsTable.updateStatus(currentReport.spot_id, 'active');
        toast({
          title: "סטטוס המקום עודכן",
          description: "כל הדיווחים טופלו והמקום חזר לסטטוס רגיל"
        });
      }
      
      toast({
        title: "הדיווח עודכן",
        description: newStatus === 'resolved' ? "הדיווח סומן כטופל" : "הדיווח נדחה"
      });

      // רענון הדיווחים
      loadReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "שגיאה בעדכון הדיווח",
        description: "אנא נסה שוב",
        variant: "destructive"
      });
    }
  };

  const getReportTypeDisplay = (type: Report['report_type']) => {
    const types = {
      spam: 'תוכן זבל/ספאם',
      inappropriate: 'תוכן לא ראוי',
      incorrect: 'מידע שגוי',
      closed: 'מקום סגור',
      duplicate: 'מקום כפול',
      other: 'אחר'
    };
    return types[type];
  };

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">ממתין לטיפול</Badge>;
      case 'in_review':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">בבדיקת מנהלים</Badge>;
      case 'resolved':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">טופל</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">נדחה</Badge>;
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-8 text-center">טוען...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">ניהול דיווחים</h1>
        <div className="flex gap-4 items-center">
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
            {reports.filter(r => r.status === 'pending').length} דיווחים ממתינים
          </Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800">
            {reports.filter(r => r.status === 'in_review').length} דיווחים בבדיקה
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {reports.map((report) => (
          <Card key={report.id} className={`p-6 ${report.status === 'in_review' ? 'border-orange-300 border-2' : ''}`}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-semibold">
                      {report.spot?.name || 'מקום לא נמצא'}
                    </h2>
                    {report.spot?.status === 'under_review' && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800">
                        מקום תחת בדיקה
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2 mb-4">
                    {getStatusBadge(report.status)}
                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                      {getReportTypeDisplay(report.report_type)}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-gray-500 text-left">
                  {new Date(report.created_at).toLocaleString('he-IL')}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="mb-2">
                  <span className="font-medium">תיאור הדיווח:</span>
                  <p className="text-gray-700">{report.description}</p>
                </div>
                {report.reporter_ip && (
                  <div className="text-sm text-gray-500">
                    IP המדווח: {report.reporter_ip}
                  </div>
                )}
              </div>

              {(report.status === 'pending' || report.status === 'in_review') && (
                <div className="space-y-4">
                  <Textarea
                    placeholder="הערות מנהל (אופציונלי)"
                    value={adminNotes[report.id] || ''}
                    onChange={(e) => setAdminNotes(prev => ({ ...prev, [report.id]: e.target.value }))}
                    className="min-h-[80px]"
                  />
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleStatusUpdate(report.id, 'resolved')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      אשר וסמן כטופל
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate(report.id, 'rejected')}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      דחה דיווח
                    </Button>
                  </div>
                </div>
              )}

              {report.admin_notes && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">{report.admin_notes}</p>
                </div>
              )}
            </div>
          </Card>
        ))}

        {reports.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">אין דיווחים במערכת</p>
          </div>
        )}
      </div>
    </div>
  );
} 