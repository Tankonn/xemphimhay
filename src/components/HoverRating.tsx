import React, { useState } from 'react';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

interface HoverRatingProps {
  initialRating?: number;
  onRatingChange: (rating: number) => void;
  disabled?: boolean;
}

const HoverRating: React.FC<HoverRatingProps> = ({
  initialRating = 0,
  onRatingChange,
  disabled = false
}) => {
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedRating, setSelectedRating] = useState<number>(initialRating);

  const handleMouseOver = (rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const handleClick = (rating: number) => {
    if (!disabled) {
      setSelectedRating(rating);
      onRatingChange(rating);
    }
  };

  const ratingText = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div 
      className="rating-container flex items-center gap-1"
      onMouseLeave={handleMouseLeave}
    >
      {[1, 2, 3, 4, 5].map((rating) => (
        <Tooltip 
          key={rating} 
          title={ratingText[rating - 1]}
          placement="top"
        >
          <span
            className={`cursor-pointer transition-colors duration-200 ${disabled ? 'cursor-not-allowed' : ''}`}
            onMouseOver={() => handleMouseOver(rating)}
            onClick={() => handleClick(rating)}
          >
            {(hoverRating || selectedRating) >= rating ? (
              <StarFilled className="text-yellow-400 text-xl hover:scale-110 transition-transform" />
            ) : (
              <StarOutlined className="text-yellow-400 text-xl hover:scale-110 transition-transform" />
            )}
          </span>
        </Tooltip>
      ))}
    </div>
  );
};

export default HoverRating;