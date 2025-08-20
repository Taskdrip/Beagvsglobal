import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

export default function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const iconSize = sizeClasses[size];

  const handleStarClick = (starRating: number) => {
    if (readonly || !onRatingChange) return;
    onRatingChange(starRating);
  };

  const handleStarHover = (starRating: number) => {
    if (readonly) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const getStarFill = (starIndex: number) => {
    const currentRating = hoverRating || rating;
    
    if (starIndex <= Math.floor(currentRating)) {
      return "fill-current text-yellow-400";
    } else if (starIndex === Math.ceil(currentRating) && currentRating % 1 !== 0) {
      // Partial star
      return "text-yellow-400";
    } else {
      return "text-slate-300";
    }
  };

  return (
    <div 
      className={cn("flex items-center space-x-1", className)}
      onMouseLeave={handleMouseLeave}
      data-testid="star-rating"
    >
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((starIndex) => (
          <button
            key={starIndex}
            type="button"
            className={cn(
              "relative transition-transform",
              !readonly && "hover:scale-110 cursor-pointer",
              readonly && "cursor-default"
            )}
            onClick={() => handleStarClick(starIndex)}
            onMouseEnter={() => handleStarHover(starIndex)}
            disabled={readonly}
            data-testid={`star-${starIndex}`}
          >
            <Star 
              className={cn(
                iconSize,
                "transition-colors",
                getStarFill(starIndex)
              )}
            />
            
            {/* Partial star overlay for decimal ratings */}
            {starIndex === Math.ceil(rating) && rating % 1 !== 0 && (
              <div 
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${(rating % 1) * 100}%` }}
              >
                <Star 
                  className={cn(iconSize, "fill-current text-yellow-400")}
                />
              </div>
            )}
          </button>
        ))}
      </div>

      {showValue && (
        <span 
          className={cn(
            "font-medium text-slate-600",
            size === "sm" && "text-sm",
            size === "lg" && "text-lg"
          )}
          data-testid="rating-value"
        >
          {rating.toFixed(1)}
        </span>
      )}

      {!readonly && (
        <span 
          className={cn(
            "text-slate-400 ml-2",
            size === "sm" && "text-xs",
            size === "lg" && "text-base"
          )}
          data-testid="rating-hint"
        >
          {hoverRating ? `${hoverRating} star${hoverRating !== 1 ? 's' : ''}` : 'Click to rate'}
        </span>
      )}
    </div>
  );
}
