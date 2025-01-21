import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import type { Spot } from '@/lib/supabase/types'
import { spotsTable } from '@/lib/supabase/config'
import Map from '@/components/Map'
import { ArrowRight } from 'lucide-react'

type SpotFormData = {
  name: string;
  address: string;
  phone: string;
  website: string;
  category: "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר";
  kosher_type: "מהדרין" | "רבנות" | "?";
  kosher_certificate: string;
  noise_level: "שקט" | "בינוני" | "רועש";
  region: "ירושלים" | "מרכז" | "צפון" | "דרום";
  price_range: "נמוך" | "בינוני" | "גבוה";
  suitable_for_first_date: boolean;
  parking_available: boolean;
  public_transport: boolean;
  reservation_required: boolean;
  opening_hours: string;
  recommended_time: string;
  notes: string;
  latitude: number;
  longitude: number;
  images: string[];
};

export default function AddSpot() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [newSpot, setNewSpot] = useState<SpotFormData>({
    name: "",
    address: "",
    phone: "",
    website: "",
    category: "אחר",
    kosher_type: "?",
    kosher_certificate: "",
    noise_level: "בינוני",
    region: "מרכז",
    price_range: "בינוני",
    suitable_for_first_date: false,
    parking_available: false,
    public_transport: false,
    reservation_required: false,
    opening_hours: "",
    recommended_time: "",
    notes: "",
    latitude: 32.0853,
    longitude: 34.7818,
    images: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if location is selected (not default coordinates)
    if (newSpot.latitude === 32.0853 && newSpot.longitude === 34.7818) {
      toast({
        title: "נדרש לבחור מיקום",
        description: "אנא בחר מיקום על המפה",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const spotData = {
        ...newSpot,
        phone: newSpot.phone || null,
        website: newSpot.website || null,
        opening_hours: newSpot.opening_hours || null,
        recommended_time: newSpot.recommended_time || null,
        kosher_certificate: newSpot.kosher_certificate || null,
        notes: newSpot.notes || null,
      };
      
      const createdSpot = await spotsTable.create(spotData);
      toast({
        title: "המקום נוסף בהצלחה",
        description: "הפרטים נשמרו במערכת",
      });
      navigate(`/spot/${createdSpot.id}`);
    } catch (error) {
      console.error("Error creating spot:", error);
      toast({
        title: "שגיאה בהוספת המקום",
        description: "אנא נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    }
  };

  const handleMapClick = (event: { lngLat: { lng: number; lat: number } }) => {
    setNewSpot({
      ...newSpot,
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat
    });
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">הוספת מקום חדש</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            ביטול
          </Button>
          <Button type="submit" form="add-spot-form">
            הוספת מקום
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <form id="add-spot-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המקום</Label>
              <Input
                id="name"
                value={newSpot.name}
                onChange={(e) => setNewSpot({ ...newSpot, name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={newSpot.address}
                onChange={(e) => setNewSpot({ ...newSpot, address: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={newSpot.phone}
                onChange={(e) => setNewSpot({ ...newSpot, phone: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input
                id="website"
                value={newSpot.website}
                onChange={(e) => setNewSpot({ ...newSpot, website: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Select
                value={newSpot.category}
                onValueChange={(value: "בית קפה" | "מסעדה" | "בר" | "אטרקציה" | "טבע" | "אחר") => 
                  setNewSpot({ ...newSpot, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="בית קפה">בית קפה</SelectItem>
                  <SelectItem value="מסעדה">מסעדה</SelectItem>
                  <SelectItem value="בר">בר</SelectItem>
                  <SelectItem value="אטרקציה">אטרקציה</SelectItem>
                  <SelectItem value="טבע">טבע</SelectItem>
                  <SelectItem value="אחר">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kosher_type">רמת כשרות</Label>
              <Select
                value={newSpot.kosher_type}
                onValueChange={(value: "מהדרין" | "רבנות" | "?") => 
                  setNewSpot({ ...newSpot, kosher_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת כשרות" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="מהדרין">מהדרין</SelectItem>
                  <SelectItem value="רבנות">רבנות</SelectItem>
                  <SelectItem value="?">?</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kosher_certificate">שם הכשרות</Label>
              <Input
                id="kosher_certificate"
                value={newSpot.kosher_certificate}
                onChange={(e) => setNewSpot({ ...newSpot, kosher_certificate: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                placeholder="לדוגמה: רבנות ירושלים"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="noise_level">רמת רעש</Label>
              <Select
                value={newSpot.noise_level}
                onValueChange={(value: "שקט" | "בינוני" | "רועש") => 
                  setNewSpot({ ...newSpot, noise_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת רעש" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="שקט">שקט</SelectItem>
                  <SelectItem value="בינוני">בינוני</SelectItem>
                  <SelectItem value="רועש">רועש</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">אזור</Label>
              <Select
                value={newSpot.region}
                onValueChange={(value: "ירושלים" | "מרכז" | "צפון" | "דרום") => 
                  setNewSpot({ ...newSpot, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר אזור" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="ירושלים">ירושלים</SelectItem>
                  <SelectItem value="מרכז">מרכז</SelectItem>
                  <SelectItem value="צפון">צפון</SelectItem>
                  <SelectItem value="דרום">דרום</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_range">טווח מחירים</Label>
              <Select
                value={newSpot.price_range}
                onValueChange={(value: "נמוך" | "בינוני" | "גבוה") => 
                  setNewSpot({ ...newSpot, price_range: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר טווח מחירים" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="נמוך">₪ זול</SelectItem>
                  <SelectItem value="בינוני">₪₪ בינוני</SelectItem>
                  <SelectItem value="גבוה">₪₪₪ יקר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_hours">שעות פתיחה</Label>
              <Input
                id="opening_hours"
                value={newSpot.opening_hours}
                onChange={(e) => setNewSpot({ ...newSpot, opening_hours: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommended_time">זמן מומלץ</Label>
              <Input
                id="recommended_time"
                value={newSpot.recommended_time}
                onChange={(e) => setNewSpot({ ...newSpot, recommended_time: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="suitable_for_first_date"
                  checked={newSpot.suitable_for_first_date}
                  onCheckedChange={(checked) => setNewSpot({ ...newSpot, suitable_for_first_date: checked as boolean })}
                />
                <Label htmlFor="suitable_for_first_date">מתאים לדייט ראשון</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="parking_available"
                  checked={newSpot.parking_available}
                  onCheckedChange={(checked) => setNewSpot({ ...newSpot, parking_available: checked as boolean })}
                />
                <Label htmlFor="parking_available">חניה זמינה</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="public_transport"
                  checked={newSpot.public_transport}
                  onCheckedChange={(checked) => setNewSpot({ ...newSpot, public_transport: checked as boolean })}
                />
                <Label htmlFor="public_transport">תחבורה ציבורית</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="reservation_required"
                  checked={newSpot.reservation_required}
                  onCheckedChange={(checked) => setNewSpot({ ...newSpot, reservation_required: checked as boolean })}
                />
                <Label htmlFor="reservation_required">נדרשת הזמנה מראש</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">הערות</Label>
              <Textarea
                id="notes"
                value={newSpot.notes}
                onChange={(e) => setNewSpot({ ...newSpot, notes: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                className="h-32"
              />
            </div>
          </form>
        </Card>

        <Card className="p-4">
          <div className="space-y-2 mb-4">
            <Label>מיקום על המפה</Label>
            <p className="text-sm text-muted-foreground">* יש לבחור מיקום על המפה</p>
            <p className="text-sm text-muted-foreground">לחץ על המפה כדי לבחור מיקום, או השתמש בחיפוש </p>
          </div>
          <div className="h-[600px] rounded-lg overflow-hidden">
            <Map 
              spots={[newSpot as Spot]} 
              onMapClick={handleMapClick} 
              center={[newSpot.latitude, newSpot.longitude]}
              zoom={12}
              showSearch={true}
            />
          </div>
        </Card>
      </div>
    </div>
  );
} 