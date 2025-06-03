import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notification } from 'antd';
import FavoriteButton from './FavoriteButton';
import HoverRating from './HoverRating';

interface FilmProps {
  film: {
    _id: string;
    name: string;
    image: string;
    rating?: number;
    userRating?: number;
  };
  onFavoriteToggle?: (id: string) => void;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
  onRatingUpdate?: (filmId: string, newRating: number) => void;
}

const Film: React.FC<FilmProps> = ({ 
  film, 
  onFavoriteToggle, 
  isFavorite = false, 
  isLoggedIn,
  onRatingUpdate 
}) => {
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [localRating, setLocalRating] = useState<number | undefined>(film.userRating);

  const handleRateFilm = async (rating: number) => {
    if (!isLoggedIn) {
      notification.info({
        message: 'Login Required',
        description: 'Please login to rate this anime',
        placement: 'top'
      });
      return;
    }

    setIsRatingLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://webxemphim-4vr4.onrender.com//movies/rate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ movieId: film._id, rating }),
      });

      if (response.ok) {
        const data = await response.json();
        setLocalRating(rating);
        onRatingUpdate?.(film._id, data.rating);
        notification.success({
          message: 'Rating Submitted',
          description: 'Thank you for rating this anime!',
          placement: 'top',
        });
      } else {
        throw new Error('Failed to submit rating');
      }
    } catch (error) {
      console.error('Error rating film:', error);
      notification.error({
        message: 'Rating Failed',
        description: 'Unable to submit your rating. Please try again.',
        placement: 'top',
      });
    } finally {
      setIsRatingLoading(false);
    }
  };

  return (
    <div className="relative group">
      <div className="block rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
        <div className="relative h-[300px] w-full">
          <Image
            src={film.image}
            alt={film.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
            <div className="flex justify-between">
              <FavoriteButton
                isFavorite={isFavorite}
                onClick={() => onFavoriteToggle?.(film._id)}
              />
            </div>
            <div className="text-white">
              <div className="rating-badge group relative">
                <div className="flex items-center justify-end">
                  <div className="opacity-0 group-hover:opacity-100 absolute bottom-full right-0 mb-2 bg-black bg-opacity-90 p-2 rounded-lg transition-opacity duration-200">
                    <HoverRating
                      initialRating={localRating}
                      onRatingChange={handleRateFilm}
                      disabled={isRatingLoading}
                    />
                  </div>
                  <span className="text-sm font-semibold bg-black bg-opacity-50 px-2 py-1 rounded">
                    ★ {film.rating?.toFixed(1) || '0.0'}
                  </span>
                </div>
              </div>
              <Link href={`/detail/${film._id}`}>
                <h3 className="text-lg font-semibold mt-2">{film.name}</h3>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Film;