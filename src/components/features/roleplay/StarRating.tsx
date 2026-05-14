import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  rating: number;
  max?: number;
  compact?: boolean;
}

export default function StarRating({ rating, max = 5, compact = false }: Props) {
  return (
    <div className={cn('flex items-center gap-0.5', compact && 'gap-px')}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i + 1 <= Math.round(rating);
        const half = !filled && i + 0.5 < rating;
        return (
          <Star
            key={i}
            className={cn(
              compact ? 'w-3.5 h-3.5' : 'w-5 h-5',
              filled || half ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
            )}
          />
        );
      })}
    </div>
  );
}
