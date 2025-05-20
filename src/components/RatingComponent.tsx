import React, { useState } from 'react';
import { FaStar } from 'react-icons/fa';

interface RatingProps {
  initialRating?: number;
  movieId: string;
  onRatingSubmit: (movieId: string, rating: number) => Promise<void>;
  disabled?: boolean;
}

const RatingComponent: React.FC<RatingProps> = ({ 
  initialRating = 0, 
  movieId, 
  onRatingSubmit,
  disabled = false 
}) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [hover, setHover] = useState<number | null>(null);

  const handleRatingClick = async (selectedRating: number) => {
    if (disabled) return;
    setRating(selectedRating);
    await onRatingSubmit(movieId, selectedRating);
  };

  return (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, index) => {
        const ratingValue = index + 1;
        return (
          <FaStar
            key={index}
            className={`cursor-pointer ${
              disabled ? 'cursor-not-allowed' : 'cursor-pointer'
            } ${
              (hover !== null ? ratingValue <= hover : ratingValue <= rating)
                ? 'text-yellow-400'
                : 'text-gray-300'
            } transition-colors duration-200`}
            size={20}
            onClick={() => handleRatingClick(ratingValue)}
            onMouseEnter={() => !disabled && setHover(ratingValue)}
            onMouseLeave={() => !disabled && setHover(null)}
          />
        );
      })}
    </div>
  );
};

export default RatingComponent;