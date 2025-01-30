import { Coffee, Utensils, Beer, Sparkles, MoreHorizontal, Trees } from "lucide-react";
import type { Spot } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";

const categoryIcons = {
  'בית קפה': Coffee,
  'מסעדה': Utensils,
  'בר': Beer,
  'אטרקציה': Sparkles,
  'טבע': Trees,
  'אחר': MoreHorizontal
};

interface SpotCardProps {
  spot: Spot;
  onClick?: () => void;
  isSelected?: boolean;
  distance?: string | null;
  compact?: boolean;
}

export function SpotCard({ spot, onClick, isSelected, distance, compact }: SpotCardProps) {
  const CategoryIcon = categoryIcons[spot.category];

  return (
    <div
      id={`spot-${spot.id}`}
      tabIndex={0}
      className={`
        relative bg-white rounded-lg shadow-sm transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${compact ? 'p-3' : 'p-4'}
        focus:outline-none focus:ring-2 focus:ring-primary
      `}
      onClick={onClick}
    >
      {spot.status === 'under_review' && (
        <Badge 
          variant="outline" 
          className="absolute top-1 left-1 text-[10px] py-0 px-1.5 bg-yellow-50 text-yellow-800 border-yellow-200 z-10"
        >
          בבדיקת מנהלים
        </Badge>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CategoryIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary`} />
          <h3 className={`font-medium ${compact ? 'text-sm' : ''}`}>{spot.name}</h3>
        </div>
        {distance && (
          <span className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
            {distance}
          </span>
        )}
      </div>
      
      <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>{spot.address}</p>
      
      <div className={`flex flex-wrap gap-1.5 ${compact ? 'mt-2' : 'mt-3'}`}>
        {spot.kosher_type && ['מהדרין', 'רבנות'].includes(spot.kosher_type) && (
          <span className={`
            px-2 py-0.5 rounded-full text-white
            ${compact ? 'text-[10px]' : 'text-xs'}
            ${spot.kosher_type === 'מהדרין' ? 'bg-emerald-600' : 'bg-blue-600'}
          `}>
            {spot.kosher_type}
          </span>
        )}
        {spot.suitable_for_first_date && !compact && (
          <span className="text-xs px-2 py-0.5 bg-pink-100 text-pink-800 rounded-full">
            מתאים לדייט ראשון
          </span>
        )}
        <span className={`px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full ${compact ? 'text-[10px]' : 'text-xs'}`}>
          {'₪'.repeat(spot.price_range === 'זול' ? 1 : spot.price_range === 'בינוני' ? 2 : 3)}
        </span>
      </div>
    </div>
  );
}