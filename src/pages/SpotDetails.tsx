import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, Phone, Globe, Clock, Calendar, MapPin, Pencil, UtensilsCrossed, Coffee, Beer, Palmtree, Building2, Gamepad2, Tent, Bike, Store, CircleDollarSign, Map as MapIcon, Volume2, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Spot, Review } from "@/lib/supabase/types";
import { spotsTable, reviewsTable } from "@/lib/supabase/config";
import { getCategoryDisplay, getKosherTypeDisplay, getNoiseLevelDisplay, getRegionDisplay, getPriceRangeDisplay } from "@/lib/utils";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Map from '@/components/Map'

interface ReviewForm {
  reviewer_name: string;
  rating: number;
  content: string;
  visit_date: string;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'מסעדה':
      return <UtensilsCrossed className="h-4 w-4" />;
    case 'בית קפה':
      return <Coffee className="h-4 w-4" />;
    case 'בר':
      return <Beer className="h-4 w-4" />;
    case 'אטרקציה':
      return <Palmtree className="h-4 w-4" />;
    case 'מוזיאון':
      return <Building2 className="h-4 w-4" />;
    case 'משחקייה':
      return <Gamepad2 className="h-4 w-4" />;
    case 'פארק':
      return <Tent className="h-4 w-4" />;
    case 'ספורט':
      return <Bike className="h-4 w-4" />;
    default:
      return <Store className="h-4 w-4" />;
  }
};

export default function SpotDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [spot, setSpot] = useState<Spot | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSpot, setEditedSpot] = useState<Spot | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewForm>({
    reviewer_name: '',
    rating: 5,
    content: '',
    visit_date: ''
  });

  useEffect(() => {
    const loadSpotAndReviews = async () => {
      if (!id) return;
      try {
        const [spotData, reviewsData] = await Promise.all([
          spotsTable.getById(id),
          reviewsTable.getBySpotId(id)
        ]);
        setSpot(spotData);
        setEditedSpot(spotData);
        setReviews(reviewsData);
      } catch (error) {
        console.error('Error loading spot details:', error);
        setError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadSpotAndReviews();
  }, [id]);

  const handleSave = async () => {
    if (!editedSpot) return;
    try {
      console.log('Starting update process');
      console.log('Original editedSpot:', JSON.stringify(editedSpot, null, 2));
      
      const spotToSend = {
        ...editedSpot,
        phone: editedSpot.phone || null,
        website: editedSpot.website || null,
        kosher_type: ['מסעדה', 'בית קפה', 'בר'].includes(editedSpot.category) ? editedSpot.kosher_type : null,
        kosher_certificate: ['מסעדה', 'בית קפה', 'בר'].includes(editedSpot.category) ? (editedSpot.kosher_certificate || null) : null,
        opening_hours: editedSpot.opening_hours || null,
        recommended_time: editedSpot.recommended_time || null,
        notes: editedSpot.notes || null
      };

      console.log('Prepared spotToSend:', JSON.stringify(spotToSend, null, 2));
      console.log('Spot ID:', editedSpot.id);
      
      const updatedSpot = await spotsTable.update(editedSpot.id, spotToSend);
      console.log('Response from server:', JSON.stringify(updatedSpot, null, 2));
      
      if (!updatedSpot) {
        throw new Error('לא התקבל מידע מהשרת אחרי העדכון');
      }

      // עדכון מיידי של המצב המקומי
      setSpot(updatedSpot);
      setEditedSpot(updatedSpot);
      setIsEditing(false);
      
      toast({
        title: 'המקום עודכן בהצלחה',
        description: 'הפרטים נשמרו במערכת',
      });
    } catch (error) {
      console.error('Error details:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      toast({
        title: 'שגיאה בעדכון המקום',
        description: error instanceof Error ? error.message : 'אנא נסה שוב מאוחר יותר',
        variant: 'destructive',
      });
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot || !reviewForm) return;

    try {
      const newReview = await reviewsTable.create({
        spot_id: spot.id,
        reviewer_name: reviewForm.reviewer_name,
        rating: reviewForm.rating,
        content: reviewForm.content,
        visit_date: reviewForm.visit_date || null,
        created_at: new Date().toISOString()
      });
      
      setReviews([newReview, ...reviews]);
      setReviewForm({
        reviewer_name: '',
        rating: 5,
        content: '',
        visit_date: ''
      });
      
      toast({
        title: 'הביקורת נוספה בהצלחה',
        description: 'תודה על השיתוף!'
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: 'שגיאה בהוספת הביקורת',
        description: 'אנא נסה שוב מאוחר יותר',
        variant: 'destructive'
      });
    }
  };

  if (isLoading) return <div className="container mx-auto py-8 text-center">טוען...</div>;
  if (error) return <div className="container mx-auto py-8 text-center text-red-500">שגיאה בטעינת הפרטים</div>;
  if (!spot) return null;

  return (
    <div className="spot-details-container">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">{spot.name}</h1>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  ביטול
                </Button>
                <Button onClick={handleSave} size="sm">
                  שמירה
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/')} size="sm">
                  <ArrowRight className="h-4 w-4 ml-2" />
                  חזרה
                </Button>
                <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                  <Pencil className="h-4 w-4 ml-2" />
                  עריכה
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="spot-details-content">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="space-y-4">
                {isEditing ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">שם המקום</Label>
                      <Input
                        id="name"
                        value={editedSpot?.name}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">כתובת</Label>
                      <Input
                        id="address"
                        value={editedSpot?.address}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, address: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">טלפון</Label>
                      <Input
                        id="phone"
                        value={editedSpot?.phone || ''}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="website">אתר אינטרנט</Label>
                      <Input
                        id="website"
                        value={editedSpot?.website || ''}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, website: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">קטגוריה</Label>
                      <Select
                        value={editedSpot?.category}
                        onValueChange={(value: "מסעדה" | "בית קפה" | "בר" | "אטרקציה" | "טבע" | "אחר") => 
                          setEditedSpot(prev => prev ? { ...prev, category: value } : null)}
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

                    {/* שדות כשרות - מוצגים רק עבור מסעדות, בתי קפה וברים */}
                    {['מסעדה', 'בית קפה', 'בר'].includes(editedSpot?.category || '') && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="kosher_type">רמת כשרות</Label>
                          <Select
                            value={editedSpot?.kosher_type || "?"}
                            onValueChange={(value: "מהדרין" | "רבנות" | "?") => 
                              setEditedSpot(prev => prev ? { ...prev, kosher_type: value } : null)}
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
                            value={editedSpot?.kosher_certificate || ''}
                            onChange={(e) => setEditedSpot(prev => prev ? { ...prev, kosher_certificate: e.target.value } : null)}
                            placeholder="לדוגמה: רבנות ירושלים"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="noise_level">רמת רעש</Label>
                      <Select
                        value={editedSpot?.noise_level}
                        onValueChange={(value: "שקט" | "בינוני" | "רועש") => 
                          setEditedSpot(prev => prev ? { ...prev, noise_level: value } : null)}
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
                        value={editedSpot?.region}
                        onValueChange={(value: "ירושלים" | "מרכז" | "צפון" | "דרום") => 
                          setEditedSpot(prev => prev ? { ...prev, region: value } : null)}
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
                        value={editedSpot?.price_range}
                        onValueChange={(value: "נמוך" | "בינוני" | "גבוה") => 
                          setEditedSpot(prev => prev ? { ...prev, price_range: value } : null)}
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
                        value={editedSpot?.opening_hours || ''}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, opening_hours: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recommended_time">זמן מומלץ</Label>
                      <Input
                        id="recommended_time"
                        value={editedSpot?.recommended_time || ''}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, recommended_time: e.target.value } : null)}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="suitable_for_first_date"
                          checked={editedSpot?.suitable_for_first_date}
                          onCheckedChange={(checked) => setEditedSpot(prev => prev ? { ...prev, suitable_for_first_date: checked as boolean } : null)}
                        />
                        <Label htmlFor="suitable_for_first_date">מתאים לדייט ראשון</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="parking_available"
                          checked={editedSpot?.parking_available}
                          onCheckedChange={(checked) => setEditedSpot(prev => prev ? { ...prev, parking_available: checked as boolean } : null)}
                        />
                        <Label htmlFor="parking_available">חניה זמינה</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="public_transport"
                          checked={editedSpot?.public_transport}
                          onCheckedChange={(checked) => setEditedSpot(prev => prev ? { ...prev, public_transport: checked as boolean } : null)}
                        />
                        <Label htmlFor="public_transport">תחבורה ציבורית</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="reservation_required"
                          checked={editedSpot?.reservation_required}
                          onCheckedChange={(checked) => setEditedSpot(prev => prev ? { ...prev, reservation_required: checked as boolean } : null)}
                        />
                        <Label htmlFor="reservation_required">נדרשת הזמנה מראש</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">הערות</Label>
                      <Textarea
                        id="notes"
                        value={editedSpot?.notes || ''}
                        onChange={(e) => setEditedSpot(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        className="h-32"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">מיקום</Label>
                      <div className="h-64 rounded-lg overflow-hidden">
                        <Map
                          spots={[{
                            ...editedSpot!,
                            name: 'המיקום החדש שנבחר'
                          }]}
                          center={[editedSpot?.latitude || 32.0853, editedSpot?.longitude || 34.7818]}
                          zoom={15}
                          onMapClick={(event) => {
                            setEditedSpot(prev => prev ? {
                              ...prev,
                              latitude: event.lngLat.lat,
                              longitude: event.lngLat.lng
                            } : null);
                            toast({
                              title: "המיקום עודכן",
                              description: "לחץ על שמירה כדי לשמור את השינויים",
                            });
                          }}
                          showSearch={true}
                        />
                      </div>
                      <p className="text-sm text-gray-500">לחץ על המפה כדי לבחור מיקום חדש, או השתמש בחיפוש למעלה</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {/* תגית קטגוריה - צבע סגול */}
                      <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200">
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(spot.category)}
                          {getCategoryDisplay(spot.category)}
                        </div>
                      </Badge>

                      {/* תגית כשרות */}
                      {spot.kosher_type && (
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`
                            ${spot.kosher_type === 'מהדרין' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : 
                              spot.kosher_type === 'רבנות' ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600' : 
                              'bg-red-600 hover:bg-red-700 text-white border-red-600'}
                          `}>
                            רמת כשרות: {getKosherTypeDisplay(spot.kosher_type)}
                          </Badge>
                          {spot.kosher_certificate && (
                            <span className="text-sm text-gray-600">
                              {spot.kosher_certificate}
                            </span>
                          )}
                        </div>
                      )}

                      {/* תגית מחיר - צבע כתום */}
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200">
                        <div className="flex items-center gap-1">
                          <CircleDollarSign className="h-4 w-4" />
                          רמת מחיר: {getPriceRangeDisplay(spot.price_range)}
                        </div>
                      </Badge>

                      {/* תגית אזור - צבע כחול */}
                      <Badge className="bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200">
                        <div className="flex items-center gap-1">
                          <MapIcon className="h-4 w-4" />
                          {getRegionDisplay(spot.region)}
                        </div>
                      </Badge>

                      {/* תגית דייט ראשון - צבע ירוק */}
                      {spot.suitable_for_first_date && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 hover:bg-green-200">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            מתאים לדייט ראשון
                          </div>
                        </Badge>
                      )}

                      {/* תגית רמת רעש - צבע אפור */}
                      <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200">
                        <div className="flex items-center gap-1">
                          <Volume2 className="h-4 w-4" />
                          רמת רעש: {getNoiseLevelDisplay(spot.noise_level)}
                        </div>
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <p className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-gray-600">{spot.address}</span>
                      </p>
                      
                      {spot.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <a href={`tel:${spot.phone}`} className="text-blue-600 hover:underline">
                            {spot.phone}
                          </a>
                        </p>
                      )}
                      
                      {spot.website && (
                        <p className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          <a href={spot.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {spot.website}
                          </a>
                        </p>
                      )}
                      
                      {spot.opening_hours && (
                        <p className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {spot.opening_hours}
                        </p>
                      )}
                      
                      {spot.recommended_time && (
                        <p className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          זמן מומלץ: {spot.recommended_time}
                        </p>
                      )}
                    </div>

                    {spot.latitude && spot.longitude && (
                      <div className="h-64 sm:h-80 mt-4 rounded-lg overflow-hidden">
                        <MapContainer
                          center={[spot.latitude, spot.longitude]}
                          zoom={15}
                          style={{ height: "100%", width: "100%" }}
                          className="z-0"
                          scrollWheelZoom={true}
                        >
                          <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          />
                          <Marker position={[spot.latitude, spot.longitude]}>
                            <Popup>{spot.name}</Popup>
                          </Marker>
                        </MapContainer>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                      {spot.parking_available && <span>✓ חניה זמינה</span>}
                      {spot.public_transport && <span>✓ תחבורה ציבורית</span>}
                      {spot.reservation_required && <span>✓ נדרשת הזמנה מראש</span>}
                    </div>

                    {spot.notes && (
                      <div className="mt-4">
                        <h3 className="font-semibold mb-2">הערות נוספות</h3>
                        <p className="text-gray-600">{spot.notes}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>

            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-semibold mb-4">ביקורות</h2>
                {reviews.length === 0 ? (
                  <p className="text-gray-500">עדיין אין ביקורות למקום זה</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <Card key={review.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{review.reviewer_name}</p>
                            <p className="text-gray-500 text-sm">
                              {review.created_at && new Date(review.created_at).toLocaleDateString('he-IL')}
                              {review.visit_date && ` • ביקר/ה ב-${new Date(review.visit_date).toLocaleDateString('he-IL')}`}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-lg text-yellow-500 bg-yellow-50">
                            {Array.from({ length: review.rating }).map(() => "⭐").join("")}
                          </Badge>
                        </div>
                        <p className="mt-2">{review.content}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <Card className="p-4">
                <h2 className="text-xl font-semibold mb-4">הוספת ביקורת</h2>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <Label htmlFor="reviewer_name">שם</Label>
                    <Input
                      id="reviewer_name"
                      value={reviewForm.reviewer_name}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewer_name: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="rating">דירוג</Label>
                    <Input
                      id="rating"
                      type="number"
                      min="1"
                      max="5"
                      value={reviewForm.rating}
                      onChange={(e) => setReviewForm({ ...reviewForm, rating: parseInt(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">תוכן הביקורת</Label>
                    <Textarea
                      id="content"
                      value={reviewForm.content}
                      onChange={(e) => setReviewForm({ ...reviewForm, content: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="visit_date">תאריך הביקור</Label>
                    <Input
                      id="visit_date"
                      type="date"
                      value={reviewForm.visit_date}
                      onChange={(e) => setReviewForm({ ...reviewForm, visit_date: e.target.value })}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    שליחת ביקורת
                  </Button>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
