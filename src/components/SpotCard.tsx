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
  const isMobile = window.innerWidth < 640;
  const showMinimalInfo = compact && isMobile;

  return (
    <div
      id={`spot-${spot.id}`}
      tabIndex={0}
      className={`
        relative bg-white rounded-lg shadow-sm transition-all duration-300
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}
        ${compact ? 'p-2 w-[200px] h-[90px] flex flex-col' : 'p-4 flex flex-col'}
        focus:outline-none focus:ring-2 focus:ring-primary
      `}
      onClick={onClick}
    >
      {!showMinimalInfo && spot.status === 'under_review' && (
        <Badge 
          variant="outline" 
          className="absolute top-1 left-1 text-[10px] py-0 px-1.5 bg-yellow-50 text-yellow-800 border-yellow-200 z-10"
        >
          בבדיקת מנהלים
        </Badge>
      )}

      <div className="flex items-start justify-between mb-1">
        <div className="flex items-start gap-1.5 min-w-0">
          <CategoryIcon className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-primary flex-shrink-0 mt-0.5`} />
          <h3 className={`font-medium line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>{spot.name}</h3>
        </div>
        {distance && (
          <span className={`text-muted-foreground flex-shrink-0 mr-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            {distance}
          </span>
        )}
      </div>
      
      <p className={`text-muted-foreground line-clamp-2 flex-grow ${compact ? 'text-xs' : 'text-sm'}`}>{spot.address}</p>
      
      {!showMinimalInfo && (
        <div className="flex flex-wrap gap-1.5 mt-2">
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
      )}
    </div>
  );
}