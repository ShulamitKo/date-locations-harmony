import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Globe, Clock } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { getCategoryDisplay, getKosherTypeDisplay, getPriceRangeDisplay } from "@/lib/utils";

interface SpotCardProps {
  spot: Spot;
}

export default function SpotCard({ spot }: SpotCardProps) {
  return (
    <Link to={`/spot/${spot.id}`}>
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">{spot.name}</h3>
              <p className="text-gray-600">{spot.address}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{getCategoryDisplay(spot.category)}</Badge>
              <Badge variant="outline">{getKosherTypeDisplay(spot.kosher_type)}</Badge>
              <Badge variant="outline">{getPriceRangeDisplay(spot.price_range)}</Badge>
              {spot.suitable_for_first_date && (
                <Badge variant="outline" className="bg-green-50">
                  מתאים לדייט ראשון
                </Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              {spot.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{spot.phone}</span>
                </p>
              )}
              
              {spot.website && (
                <p className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="truncate">{spot.website}</span>
                </p>
              )}
              
              {spot.opening_hours && (
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{spot.opening_hours}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-sm text-gray-500">
              {spot.parking_available && <span>✓ חניה זמינה</span>}
              {spot.public_transport && <span>✓ תחבורה ציבורית</span>}
              {spot.reservation_required && <span>✓ נדרשת הזמנה מראש</span>}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}