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

type SpotFormData = Omit<Spot, 'id' | 'created_at' | 'average_rating'> & {
  phone: string;
  website: string;
  opening_hours: string;
  recommended_time: string;
  notes: string;
};

export default function AddSpot() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [newSpot, setNewSpot] = useState<SpotFormData>({
    name: "",
    address: "",
    phone: "",
    website: "",
    category: "cafe",
    kosher_type: "none",
    noise_level: "moderate",
    region: "center",
    price_range: "medium",
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
    
    try {
      const spotData = {
        ...newSpot,
        phone: newSpot.phone || null,
        website: newSpot.website || null,
        opening_hours: newSpot.opening_hours || null,
        recommended_time: newSpot.recommended_time || null,
        notes: newSpot.notes || null
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
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            חזרה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">שם המקום</Label>
              <Input
                id="name"
                value={newSpot.name}
                onChange={(e) => setNewSpot({ ...newSpot, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">כתובת</Label>
              <Input
                id="address"
                value={newSpot.address}
                onChange={(e) => setNewSpot({ ...newSpot, address: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">טלפון</Label>
              <Input
                id="phone"
                value={newSpot.phone}
                onChange={(e) => setNewSpot({ ...newSpot, phone: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">אתר אינטרנט</Label>
              <Input
                id="website"
                value={newSpot.website}
                onChange={(e) => setNewSpot({ ...newSpot, website: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">קטגוריה</Label>
              <Select
                value={newSpot.category}
                onValueChange={(value: "cafe" | "restaurant" | "bar" | "activity" | "other") => 
                  setNewSpot({ ...newSpot, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cafe">בית קפה</SelectItem>
                  <SelectItem value="restaurant">מסעדה</SelectItem>
                  <SelectItem value="bar">בר</SelectItem>
                  <SelectItem value="activity">אטרקציה</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kosher_type">כשרות</Label>
              <Select
                value={newSpot.kosher_type}
                onValueChange={(value: "mehadrin" | "rabbanut" | "none") => 
                  setNewSpot({ ...newSpot, kosher_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר כשרות" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mehadrin">מהדרין</SelectItem>
                  <SelectItem value="rabbanut">רבנות</SelectItem>
                  <SelectItem value="none">לא כשר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="noise_level">רמת רעש</Label>
              <Select
                value={newSpot.noise_level}
                onValueChange={(value: "quiet" | "moderate" | "loud") => 
                  setNewSpot({ ...newSpot, noise_level: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר רמת רעש" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quiet">שקט</SelectItem>
                  <SelectItem value="moderate">בינוני</SelectItem>
                  <SelectItem value="loud">רועש</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">אזור</Label>
              <Select
                value={newSpot.region}
                onValueChange={(value: "north" | "center" | "south" | "jerusalem") => 
                  setNewSpot({ ...newSpot, region: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר אזור" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jerusalem">ירושלים</SelectItem>
                  <SelectItem value="center">מרכז</SelectItem>
                  <SelectItem value="north">צפון</SelectItem>
                  <SelectItem value="south">דרום</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_range">טווח מחירים</Label>
              <Select
                value={newSpot.price_range}
                onValueChange={(value: "low" | "medium" | "high") => 
                  setNewSpot({ ...newSpot, price_range: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר טווח מחירים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">₪ זול</SelectItem>
                  <SelectItem value="medium">₪₪ בינוני</SelectItem>
                  <SelectItem value="high">₪₪₪ יקר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="opening_hours">שעות פתיחה</Label>
              <Input
                id="opening_hours"
                value={newSpot.opening_hours}
                onChange={(e) => setNewSpot({ ...newSpot, opening_hours: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recommended_time">זמן מומלץ</Label>
              <Input
                id="recommended_time"
                value={newSpot.recommended_time}
                onChange={(e) => setNewSpot({ ...newSpot, recommended_time: e.target.value })}
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
                className="h-32"
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <Button variant="outline" onClick={() => navigate(-1)}>
                ביטול
              </Button>
              <Button type="submit">
                הוספת מקום
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">בחירת מיקום</h2>
            <div className="h-[600px] rounded-lg overflow-hidden">
              <Map
                spots={[newSpot as Spot]}
                center={[newSpot.latitude, newSpot.longitude]}
                zoom={12}
                onMapClick={handleMapClick}
                showSearch={true}
              />
            </div>
            <p className="mt-4 text-sm text-gray-500 text-center">
              לחץ על המפה כדי לבחור מיקום או השתמש בחיפוש למעלה
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
} 