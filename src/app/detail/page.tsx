"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Row, 
  Col, 
  Button, 
  Typography, 
  Tabs, 
  Spin, 
  Rate, 
  List, 
  Card, 
  Tag, 
  Dropdown, 
  Menu, 
  Progress,
  notification,
  Modal
} from 'antd';
import { 
  PlayCircleFilled, 
  ClockCircleOutlined, 
  ShareAltOutlined, 
  HeartOutlined, 
  HeartFilled, 
  StarOutlined, 
  UserOutlined, 
  DownloadOutlined, 
  CommentOutlined,
  LikeOutlined,
  DislikeOutlined,
  CheckCircleFilled,
  ArrowLeftOutlined,
  LogoutOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;

// TypeScript interfaces
interface Anime {
  _id: string;
  name: string;
  image: string;
  cover?: string;
  trailer?: string;
  description?: string;
  category?: string;
  status?: string;
  year?: string;
  episodes?: number;
  duration?: string;
  quality?: string;
  views?: number;
  rating?: number;
  ratingCount?: number;
  studio?: string;
}

interface Episode {
  id: string;
  number: number;
  title: string;
  thumbnail: string;
  duration: string;
  releaseDate: string;
  watched?: boolean;
}

interface Review {
  id: string;
  username: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  dislikes: number;
}

interface RelatedAnime {
  id: string;
  name: string;
  image: string;
  category?: string;
  rating?: number;
}

// Create a wrapper component that uses useSearchParams
function AnimeDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const animeId = searchParams.get('id');
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // State variables
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [relatedAnime, setRelatedAnime] = useState<RelatedAnime[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedEpisode, setSelectedEpisode] = useState<Episode | null>(null);
  const [videoTime, setVideoTime] = useState<number>(0);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState<boolean>(false);
  const [favoriteModalData, setFavoriteModalData] = useState<{action: 'add' | 'remove'}>({action: 'add'});
  const [loginRequiredModalVisible, setLoginRequiredModalVisible] = useState<boolean>(false);
  const [loadingFavorite, setLoadingFavorite] = useState<boolean>(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isRating, setIsRating] = useState<boolean>(false);
  const [showRatingStars, setShowRatingStars] = useState<boolean>(false);
  const [duplicateRatingModalVisible, setDuplicateRatingModalVisible] = useState<boolean>(false);
  const [duplicateRatingValue, setDuplicateRatingValue] = useState<number>(0);
  const [ratingErrorType, setRatingErrorType] = useState<'duplicate' | 'missing_id' | 'validation_error' | 'invalid_rating' | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);

  useEffect(() => {
    // Check login status
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      }
    }

    // Fetch anime details if we have an ID
    if (animeId) {
      const fetchAllData = async () => {
        try {
          setLoading(true);
          
          // Fetch anime details first
          await fetchAnimeDetails(animeId);
          
          // These can run in parallel
          const episodesPromise = fetchEpisodes(animeId);
          const relatedPromise = fetchRelatedAnime(animeId);
          const reviewsPromise = fetchReviews(animeId);
          
          // Wait for all to complete
          await Promise.all([
            episodesPromise,
            relatedPromise,
            reviewsPromise
          ]);
          
          // Check favorite status if logged in
          if (token) {
            try {
              await checkFavoriteStatus(animeId, token);
            } catch (favError) {
              console.error('Error checking favorite status:', favError);
              // Don't throw, continue with rendering
            }
          }
        } catch (err) {
          console.error('Error fetching anime data:', err);
          setError('Failed to load anime details. Please try again later.');
        } finally {
          setLoading(false);
        }
      };
      
      fetchAllData();
      
      // Check if we should resume watching
      const resumeParam = searchParams.get('resume');
      if (resumeParam === 'true') {
        // Get the episode ID to resume
        const resumeEpisodeId = searchParams.get('episodeId') || localStorage.getItem('resumeEpisodeId');
        
        // We'll handle the actual episode playback after episodes are loaded
        if (resumeEpisodeId) {
          // Store for later use after episodes are loaded
          localStorage.setItem('resumeEpisodeId', resumeEpisodeId);
        }
      }
    } else {
      setError('Anime ID not provided');
      setLoading(false);
    }
  }, [animeId, searchParams]);
  
  // Effect to handle episode resuming after episodes are loaded
  useEffect(() => {
    if (!episodes.length || loading) return;
    
    // Check if we should resume watching
    const resumeEpisodeId = localStorage.getItem('resumeEpisodeId');
    if (resumeEpisodeId) {
      // Find the episode to resume
      const episodeToResume = episodes.find(ep => ep.id === resumeEpisodeId);
      
      if (episodeToResume) {
        // Play the episode
        playEpisode(episodeToResume);
        
        // Get and set the resume time
        const resumeTime = localStorage.getItem('resumeTime');
        if (resumeTime && videoRef.current) {
          // Set a timeout to ensure the video has loaded
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.currentTime = parseFloat(resumeTime);
            }
          }, 1000);
        }
        
        // Clear the resume data so it doesn't happen again if the page is refreshed
        localStorage.removeItem('resumeEpisodeId');
        localStorage.removeItem('resumeTime');
      }
    }
  }, [episodes, loading]);
  
  // Fetch anime details
  const fetchAnimeDetails = async (id: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:2000/movies/${id}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setAnime(data);
      setError(null);
      return data;
    } catch (err) {
      console.error('Error fetching anime details:', err);
      
      // Create mock data directly instead of calling another function
      const mockAnime: Anime = {
        _id: id,
        name: 'Demon Slayer: Kimetsu no Yaiba',
        image: '/xemphimhay/img/anime/details-pic.jpg',
        cover: '/xemphimhay/img/anime/details-bg.jpg',
        trailer: 'https://www.youtube.com/watch?v=VQGCKyvzIM4',
        description: 'Tanjiro Kamado\'s life changed forever when his family was slaughtered by demons, and his sister Nezuko was transformed into one. Now, he hunts demons as a member of the Demon Slayer Corps, seeking a way to turn his sister back into a human and avenge his family.',
        category: 'Action, Fantasy, Historical',
        status: 'Ongoing',
        year: '2019',
        episodes: 26,
        duration: '24 min/ep',
        quality: 'HD',
        views: 9480000,
        rating: 4.9,
        ratingCount: 1000,
        studio: 'ufotable'
      };
      
      setAnime(mockAnime);
      return mockAnime;
    }
  };

  // Fetch episodes
  const fetchEpisodes = async (id: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:2000/episodes/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data);
      } else {
        // Use mock data
        setMockEpisodes();
      }
    } catch (err) {
      console.error('Error fetching episodes:', err);
      setMockEpisodes();
    }
  };

  // Fetch related anime
  const fetchRelatedAnime = async (id: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:2000/movies/related/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setRelatedAnime(data);
      } else {
        // Use mock data
        setMockRelatedAnime();
      }
    } catch (err) {
      console.error('Error fetching related anime:', err);
      setMockRelatedAnime();
    }
  };

  // Fetch reviews
  const fetchReviews = async (id: string) => {
    try {
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:2000/reviews/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        // Use mock data
        setMockReviews();
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setMockReviews();
    }
  };

  // Check if anime is in user's favorites
  const checkFavoriteStatus = async (id: string, token: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) return;
      
      // Replace with your actual API endpoint
      const response = await fetch(`http://localhost:2000/favorites/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Check if current anime is in favorites
        const isFav = data.some((fav: any) => 
          fav.movieId === id || fav._id === id
        );
        setIsFavorite(isFav);
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };
  
  // Set mock episodes data
  const setMockEpisodes = () => {
    const mockEpisodes: Episode[] = Array.from({ length: 26 }, (_, i) => ({
      id: `ep-${i + 1}`,
      number: i + 1,
      title: `Episode ${i + 1}: ${i === 0 ? 'Cruelty' : i === 1 ? 'Trainer Sakonji Urokodaki' : i === 2 ? 'Sabito and Makomo' : `Adventure ${i + 1}`}`,
      thumbnail: `/xemphimhay/img/anime/episodes/ep-${(i % 5) + 1}.jpg`,
      duration: '24:15',
      releaseDate: `2019-${Math.floor(i / 4) + 4}-${((i % 4) + 1) * 7}`,
      watched: i < 3
    }));
    
    setEpisodes(mockEpisodes);
    
    // Set the first episode as selected by default
    if (mockEpisodes.length > 0) {
      setSelectedEpisode(mockEpisodes[0]);
    }
  };
  
  // Set mock related anime
  const setMockRelatedAnime = () => {
    const mockRelated: RelatedAnime[] = [
      { id: '1', name: 'Attack on Titan', image: '/xemphimhay/img/anime/related-1.jpg', category: 'Action', rating: 4.8 },
      { id: '2', name: 'My Hero Academia', image: '/xemphimhay/img/anime/related-2.jpg', category: 'Superhero', rating: 4.7 },
      { id: '3', name: 'Jujutsu Kaisen', image: '/xemphimhay/img/anime/related-3.jpg', category: 'Supernatural', rating: 4.9 },
      { id: '4', name: 'Tokyo Revengers', image: '/xemphimhay/img/anime/related-4.jpg', category: 'Action', rating: 4.6 }
    ];
    
    setRelatedAnime(mockRelated);
  };
  
  // Set mock reviews
  const setMockReviews = () => {
    const mockReviews: Review[] = [
      {
        id: '1',
        username: 'animefan42',
        avatar: '/xemphimhay/img/user/avatar-1.jpg',
        rating: 5,
        comment: 'This has to be one of the best anime I\'ve ever watched. The animation quality is breathtaking, especially during the fight scenes. The story is compelling and emotional. Can\'t wait for the next season!',
        date: '2023-04-15',
        likes: 347,
        dislikes: 12
      },
      {
        id: '2',
        username: 'otakulover',
        avatar: '/xemphimhay/img/user/avatar-2.jpg',
        rating: 4.5,
        comment: 'Great character development and beautiful animation. The music score is outstanding and really enhances the emotional impact of scenes. My only criticism is that some episodes feel a bit slow.',
        date: '2023-03-22',
        likes: 215,
        dislikes: 18
      },
      {
        id: '3',
        username: 'samuraid',
        avatar: '/xemphimhay/img/user/avatar-3.jpg',
        rating: 5,
        comment: 'The fight choreography is on another level. Each battle feels unique and the animation is fluid. The story manages to balance action, humor, and emotional moments perfectly.',
        date: '2023-02-10',
        likes: 189,
        dislikes: 5
      }
    ];
    
    setReviews(mockReviews);
  };
  
  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!isLoggedIn) {
      setLoginRequiredModalVisible(true);
      return;
    }
    
    // Set loading state
    setLoadingFavorite(true);
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId || !anime) {
      notification.error({
        message: 'Error',
        description: 'Unable to update favorites. Please try logging in again.',
        placement: 'topRight'
      });
      setLoadingFavorite(false);
      return;
    }
    
    try {
      if (isFavorite) {
        // Remove from favorites
        const response = await fetch(`http://localhost:2000/favorites/${animeId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          setIsFavorite(false);
          setLoadingFavorite(false);
          setFavoriteModalData({ action: 'remove' });
          setFavoriteModalVisible(true);
        } else {
          throw new Error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch('http://localhost:2000/favorites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            userId: userId, 
            movieId: animeId 
          })
        });
        
        if (response.ok) {
          setIsFavorite(true);
          setLoadingFavorite(false);
          setFavoriteModalData({ action: 'add' });
          setFavoriteModalVisible(true);
        } else {
          throw new Error('Failed to add to favorites');
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      notification.error({
        message: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update favorites',
        placement: 'topRight'
      });
      setLoadingFavorite(false);
    }
  };
  
  // Play selected episode
  const playEpisode = (episode: Episode) => {
    setSelectedEpisode(episode);
    setIsPlaying(true);
    
    // Increment view count on the server
    incrementViewCount();
    
    // Save to watch history if user is logged in
    saveWatchHistory(episode);
    
    // Scroll to video player
    setTimeout(() => {
      const videoElement = document.getElementById('video-player');
      if (videoElement) {
        videoElement.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  // Save to watch history
  const saveWatchHistory = async (episode: Episode) => {
    if (!episode) {
      console.log('Cannot save watch history: Episode data is missing');
      return;
    }
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId || !animeId) {
      console.log('Unable to save watch history: User not logged in or missing data');
      return;
    }
    
    try {
      // Prepare watch history data
      const watchHistoryData = {
        userId: userId,
        movieId: animeId,
        episodeId: episode.id,
        episodeNumber: episode.number,
        progress: 0, // Start at 0%
        watched: false, // Mark as not fully watched yet
        timestamp: new Date().toISOString(),
        duration: episode.duration, // For tracking progress
        image: anime?.image, // Add the film's image, not the episode image
        movieName: anime?.name // Also add the film name for reference
      };
      
      // Make API call to save watch history
      const response = await fetch('http://localhost:2000/watch-history', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(watchHistoryData)
      });
      
      if (response.ok) {
        console.log('Watch history saved successfully');
        
        // Mark episode as watched locally
        setEpisodes(prev => 
          prev.map(ep => 
            ep.id === episode.id ? { ...ep, watched: true } : ep
          )
        );
      } else {
        console.error('Failed to save watch history:', await response.text());
      }
    } catch (error) {
      console.error('Error saving watch history:', error);
    }
  };
  
  // Update watch history progress when video is playing
  const updateWatchProgress = async () => {
    if (!videoRef.current || !selectedEpisode || !isPlaying) return;
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId || !animeId) return;
    
    // Calculate progress percentage
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    
    // Handle NaN or infinite values
    if (!currentTime || !duration || isNaN(currentTime) || isNaN(duration) || duration === 0) {
      return;
    }
    
    const progressPercent = Math.round((currentTime / duration) * 100);
    
    // Only update if progress is significant (every 10% or at end)
    if (progressPercent % 10 !== 0 && progressPercent < 90) return;
    
    // Mark as fully watched if 90% complete
    const isFullyWatched = progressPercent >= 90;
    
    try {
      // Prepare update data
      const updateData = {
        progress: progressPercent,
        watched: isFullyWatched,
        timestamp: new Date().toISOString()
      };
      
      // Make API call to update watch history progress
      await fetch(`http://localhost:2000/watch-history/user/${userId}/movie/${animeId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      // If marked as fully watched, update local state
      if (isFullyWatched && selectedEpisode) {
        setEpisodes(prev => 
          prev.map(ep => 
            ep.id === selectedEpisode.id ? { ...ep, watched: true } : ep
          )
        );
      }
    } catch (error) {
      console.error('Error updating watch progress:', error);
    }
  };
  
  // Handle video time update
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setVideoTime(videoRef.current.currentTime);
      setVideoDuration(videoRef.current.duration);
      
      // Update watch progress periodically
      updateWatchProgress();
    }
  };
  
  // Increment view count
  const incrementViewCount = async () => {
    if (!animeId) {
      console.log('Cannot increment view count: animeId is undefined');
      return;
    }
    
    console.log(`Attempting to increment view count for animeId: ${animeId}`);
    
    try {
      // Call the working endpoint based on the test file
      const url = `http://localhost:2000/movies/add-view`;
      console.log(`Sending POST request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movieId: animeId,
          userId: localStorage.getItem('userId') || 'anonymous'
        })
      });
      
      if (response.ok) {
        // If API call successful, update the local state with the response data
        const updatedMovie = await response.json();
        console.log('Success response:', updatedMovie);
        
        setAnime(prev => {
          if (!prev) return null;
          return {
            ...prev,
            views: updatedMovie.views || (prev.views || 0) + 1
          };
        });
        console.log('View count incremented successfully');
      } else {
        console.log(`View increment API failed with status: ${response.status}, updating UI only`);
        // Try to read error message from the response
        try {
          const errorData = await response.text();
          console.log('Error response:', errorData);
        } catch (e) {
          console.log('Could not read error response');
        }
        
        setAnime(prev => {
          if (!prev) return null;
          return {
            ...prev,
            views: (prev.views || 0) + 1
          };
        });
      }
    } catch (error) {
      console.log('Network error when incrementing view count:', error);
      console.log('Updating UI only');
      setAnime(prev => {
        if (!prev) return null;
        return {
          ...prev,
          views: (prev.views || 0) + 1
        };
      });
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    // router.push('/home');
  };
  
  // Get image URL
  const getImageUrl = (image?: string): string => {
    if (!image) {
      // Return a default image if the image is undefined or null
      return '/xemphimhay/img/anime/default-poster.jpg';
    }
    
    if (image.startsWith('http')) {
      return image;
    } else {
      return `/xemphimhay/img/anime/${image}`;
    }
  };

  // User dropdown menu items
  const userMenu = [
    {
      key: 'profile',
      label: 'My Profile',
      onClick: () => router.push('/profile')
    },
    {
      key: 'logout',
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  // Rate movie
  const handleRateMovie = async (value: number) => {
    if (!isLoggedIn) {
      setLoginRequiredModalVisible(true);
      return;
    }

    if (!animeId) {
      notification.error({
        message: 'Error',
        description: 'Unable to rate movie. Missing movie ID.',
        placement: 'topRight'
      });
      return;
    }

    // Check if it's the same rating as before
    if (userRating === value) {
      // Instead of proceeding with the API call, show the duplicate rating modal
      setDuplicateRatingValue(value);
      setRatingErrorType('duplicate');
      setDuplicateRatingModalVisible(true);
      return;
    }

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');
    if (!userId) {
      notification.error({
        message: 'Authentication Error',
        description: 'Unable to identify user. Please try logging in again.',
        placement: 'topRight'
      });
      return;
    }

    setIsRating(true);
    
    try {
      console.log(`Submitting rating ${value} for movie ${animeId} by user ${userId}`);
      
      const response = await fetch('http://localhost:2000/movies/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          movieId: animeId,
          rating: value,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rate movie');
      }

      const data = await response.json();
      console.log('Rating response data:', data);
      
      if (data.success) {
        // Update the local state with the user's rating
        setUserRating(value);
        
        // Update the anime's overall rating and rating count
        setAnime(prev => {
          if (!prev) return null;
          
          const newRating = data.rating !== undefined ? data.rating : prev.rating;
          const newRatingCount = data.ratingCount !== undefined ? data.ratingCount : (prev.ratingCount || 0) + 1;
          
          // Log the update
          console.log(`Updating movie rating display from ${prev.rating} to ${newRating}, count from ${prev.ratingCount || 0} to ${newRatingCount}`);
          
          return {
            ...prev,
            rating: newRating,
            ratingCount: newRatingCount
          };
        });
        
        notification.success({
          message: 'Rating Submitted',
          description: 'Thank you for rating this anime!',
          placement: 'topRight',
          duration: 3
        });
      } else {
        throw new Error(data.message || 'Failed to rate movie');
      }
    } catch (error) {
      console.error('Error rating movie:', error);
      
      // If the user already has a rating, use that for the modal
      const displayRating = userRating || value;
      setDuplicateRatingValue(displayRating);
      
      // Extract error message
      let errorMessage = 'Failed to submit rating';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = error.message as string;
      }
      
      // Check for different error types
      const errorLower = errorMessage.toLowerCase();
      
      if (errorLower.includes('userid') || errorLower.includes('movieid')) {
        // User ID or Movie ID issues
        setRatingErrorType('missing_id');
        notification.error({
          message: 'Authentication Error',
          description: 'User ID or Movie ID is missing or invalid. Please try logging in again.',
          placement: 'topRight',
          duration: 3
        });
      } else if (errorLower.includes('rating')) {
        // Rating validation issues
        setRatingErrorType('invalid_rating');
        notification.error({
          message: 'Invalid Rating',
          description: 'Rating must be between 1 and 5 stars.',
          placement: 'topRight',
          duration: 3
        });
      } else {
        // Other validation errors
        setRatingErrorType('validation_error');
        notification.error({
          message: 'Rating Failed',
          description: errorMessage,
          placement: 'topRight',
          duration: 3
        });
      }
      
      // Show the error modal
      setDuplicateRatingModalVisible(true);
    } finally {
      setIsRating(false);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      {/* Favorite Notification Modal */}
      <Modal
        open={favoriteModalVisible}
        onCancel={() => setFavoriteModalVisible(false)}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => setFavoriteModalVisible(false)}
            style={{ 
              backgroundColor: favoriteModalData.action === 'add' ? '#52c41a' : '#EF4444', 
              borderColor: favoriteModalData.action === 'add' ? '#52c41a' : '#EF4444'
            }}
          >
            OK
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {favoriteModalData.action === 'add' ? (
              <><HeartFilled style={{ color: '#52c41a', marginRight: '8px' }} /> Added to Favorites!</>
            ) : (
              <><HeartOutlined style={{ color: '#EF4444', marginRight: '8px' }} /> Removed from Favorites</>
            )}
          </div>
        }
        centered
        width={{ xs: '90%', sm: 400 }}
        className={favoriteModalData.action === 'add' ? "favorites-modal-add" : "favorites-modal-remove"}
        style={{ top: 100 }}
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
      >
        {anime && (
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(anime.image)}
                alt={anime.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold mb-1">{anime.name}</h3>
              {favoriteModalData.action === 'add' ? (
                <p>Successfully added to your favorites list</p>
              ) : (
                <p>Successfully removed from your favorites list</p>
              )}
              {anime.category && (
                <div className="mt-2 flex justify-center sm:justify-start">
                  <span className="badge badge-category">{anime.category}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Login Required Modal */}
      <Modal
        open={loginRequiredModalVisible}
        onCancel={() => setLoginRequiredModalVisible(false)}
        footer={[
          <Button 
            key="login" 
            type="primary" 
            onClick={() => {
              setLoginRequiredModalVisible(false);
              router.push('/login');
            }}
            style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
          >
            Go to Login
          </Button>,
          <Button 
            key="cancel" 
            onClick={() => setLoginRequiredModalVisible(false)}
          >
            Cancel
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ color: '#EF4444', marginRight: '8px' }} /> Login Required
          </div>
        }
        centered
        width={{ xs: '90%', sm: 400 }}
        className="favorites-modal-remove"
        style={{ top: 100 }}
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start">
          {anime && (
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(anime.image)} 
                alt={anime.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold mb-1">
              {anime ? anime.name : 'This anime'}
            </h3>
            <p>You need to be logged in to add items to your favorites list.</p>
            <p className="mt-2">Would you like to go to the login page?</p>
          </div>
        </div>
      </Modal>

      {/* Duplicate/Error Rating Modal */}
      <Modal
        open={duplicateRatingModalVisible}
        onCancel={() => setDuplicateRatingModalVisible(false)}
        footer={[
          <Button 
            key="ok" 
            type="primary" 
            onClick={() => setDuplicateRatingModalVisible(false)}
            style={{ 
              backgroundColor: '#EF4444', 
              borderColor: '#EF4444'
            }}
          >
            OK
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <StarOutlined style={{ color: '#F59E0B', marginRight: '8px' }} /> Rating Issue
          </div>
        }
        centered
        width={{ xs: '90%', sm: 400 }}
        style={{ top: 100 }}
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
      >
        <div className="text-center">
          <Rate disabled value={duplicateRatingValue} className="mb-4 block mx-auto" />
          
          {ratingErrorType === 'duplicate' ? (
            <>
              <p>You've already rated this movie with {duplicateRatingValue} {duplicateRatingValue === 1 ? 'star' : 'stars'}.</p>
              <p className="mt-2">Please choose a different rating if you want to change your review.</p>
            </>
          ) : ratingErrorType === 'missing_id' ? (
            <>
              <p>There was a problem with your user ID or movie ID when submitting the rating.</p>
              <p className="mt-2">Please try logging out and back in to refresh your session.</p>
            </>
          ) : ratingErrorType === 'invalid_rating' ? (
            <>
              <p>The rating value you submitted was invalid.</p>
              <p className="mt-2">Ratings must be between 1 and 5 stars.</p>
            </>
          ) : ratingErrorType === 'validation_error' ? (
            <>
              <p>You have just rated a movie with a rating of the same value</p>
              {/* <p className="mt-2">Please try again with a valid rating (1-5 stars).</p> */}
            </>
          ) : (
            <>
              <p>An error occurred while submitting your rating.</p>
              <p className="mt-2">Please try again later.</p>
            </>
          )}
          
          
        </div>
      </Modal>

      

      <main>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-500 bg-opacity-20 border border-red-500 text-white p-4 mb-6 rounded">
              {error}
            </div>
            <Button 
              type="primary" 
              onClick={() => router.push('/home')}
              style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
            >
              Back to Home
            </Button>
          </div>
        ) : anime ? (
          <>
            {/* Hero Banner */}
            <div className="relative h-64 md:h-96 overflow-hidden">
              {/* Background Cover Image */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${anime && getImageUrl(anime.cover || anime.image)})` }}
              ></div>
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/80 to-gray-900"></div>
              
              {/* Content */}
              <div className="container mx-auto px-4 relative h-full flex flex-col justify-center z-10">
                <div className="flex flex-col md:flex-row items-center md:items-end">
                  <div className="w-32 h-44 md:w-40 md:h-56 rounded overflow-hidden shadow-xl flex-shrink-0 mb-4 md:mb-0 md:mr-6 border-2 border-gray-700">
                    <img 
                      src={anime && getImageUrl(anime.image)} 
                      alt={anime?.name || "Anime poster"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-center md:text-left md:flex-1">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{anime.name}</h1>
                        <div className="mb-4 flex flex-wrap justify-center md:justify-start gap-2">
                          {anime.category?.split(', ').map((cat, index) => (
                            <Tag 
                              key={index} 
                              color="red" 
                              className="m-0"
                            >
                              {cat}
                            </Tag>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 justify-center md:justify-end mt-4 md:mt-0">
                        <Button
                          type="primary"
                          icon={<PlayCircleFilled />}
                          size="large"
                          onClick={() => {
                            if (episodes.length > 0) {
                              playEpisode(episodes[0]); // Play the first episode (incrementViewCount already called inside)
                            } else {
                              // If no episodes, try to play the trailer or main video
                              setSelectedEpisode({
                                id: 'main',
                                number: 1,
                                title: `${anime.name} - Full Movie`,
                                thumbnail: anime.image,
                                duration: anime.duration || '1:30:00',
                                releaseDate: anime.year || new Date().toISOString()
                              });
                              setIsPlaying(true);
                              incrementViewCount(); // Increment view count for full movie
                            }
                          }}
                          style={{ 
                            backgroundColor: '#EF4444', 
                            borderColor: '#EF4444',
                            height: '40px',
                            minWidth: '130px'
                          }}
                          className="watch-now-btn"
                        >
                          Watch Now
                        </Button>
                        <Button
                          type="primary"
                          icon={loadingFavorite ? 
                            <LoadingOutlined /> : 
                            (isFavorite ? <HeartFilled style={{ color: 'white' }} /> : <HeartOutlined style={{ color: 'white' }} />)}
                          size="large"
                          onClick={toggleFavorite}
                          style={{ 
                            backgroundColor: isFavorite ? '#EF4444' : '#1F2937', 
                            borderColor: isFavorite ? '#EF4444' : '#1F2937',
                            height: '40px',
                            minWidth: '130px'
                          }}
                          className="favorite-btn"
                        >
                          {isFavorite ? 'Favorited' : 'Favorite'}
                        </Button>
                        <Button
                          type="primary"
                          icon={<ShareAltOutlined />}
                          size="large"
                          style={{ 
                            backgroundColor: '#1DA1F2', 
                            borderColor: '#1DA1F2',
                            height: '40px',
                            minWidth: '130px'
                          }}
                        >
                          Share
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-2 mt-4">
                      <div className="flex items-center">
                        <StarOutlined className="text-yellow-500 mr-1" />
                        <span className="text-yellow-500 font-bold mr-1">{anime?.rating?.toFixed(1) || '0.0'}</span>
                        <span className="text-gray-400">/ 5</span>
                        <span className="text-gray-400 ml-1">
                          ({anime?.ratingCount ? (anime.ratingCount > 999 
                            ? `${(anime.ratingCount / 1000).toFixed(1)}k` 
                            : anime.ratingCount) : '0'} {anime?.ratingCount === 1 ? 'rating' : 'user rated'})
                        </span>
                        
                        <div className="ml-4 flex items-center">
                          <div 
                            className="rating-container relative"
                            onMouseEnter={() => setShowRatingStars(true)}
                            onMouseLeave={() => setShowRatingStars(false)}
                          >
                            {(showRatingStars || userRating) ? (
                              // Show full rating component when hovering or when user has already rated
                              <div className={`rating-expand ${showRatingStars ? 'rating-active' : ''}`}>
                                <span className="text-gray-400 mr-2">Your Rating:</span>
                                <Rate 
                                  value={userRating || 0} 
                                  onChange={handleRateMovie} 
                                  allowHalf
                                  disabled={isRating || !isLoggedIn}
                                  className="custom-rate"
                                  tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']}
                                />
                                {isRating && <LoadingOutlined className="ml-2" />}
                              </div>
                            ) : (
                              // Show single star icon when not hovering
                              <div className="rating-collapsed">
                                <StarOutlined className="rating-trigger" />
                                <span className="ml-1 text-sm text-gray-400">Rate this</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {anime.status && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Status</Text>
                          <Text style={{ color: 'white' }}>{anime.status}</Text>
                        </div>
                      )}
                      {anime.year && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Released</Text>
                          <Text style={{ color: 'white' }}>{anime.year}</Text>
                        </div>
                      )}
                      {anime.category && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Genre</Text>
                          <Text style={{ color: 'white' }}>{anime.category}</Text>
                        </div>
                      )}
                      {anime.episodes && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Episodes</Text>
                          <Text style={{ color: 'white' }}>{anime.episodes}</Text>
                        </div>
                      )}
                      {anime.duration && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Duration</Text>
                          <Text style={{ color: 'white' }}>{anime.duration}</Text>
                        </div>
                      )}
                      {anime.studio && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Studio</Text>
                          <Text style={{ color: 'white' }}>{anime.studio}</Text>
                        </div>
                      )}
                      {anime.quality && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Quality</Text>
                          <Text style={{ color: 'white' }}>{anime.quality}</Text>
                        </div>
                      )}
                      {anime.views && (
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Views</Text>
                          <Text style={{ color: 'white' }}>{anime.views.toLocaleString()}</Text>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-8">
                      <Button 
                        type="primary" 
                        icon={<PlayCircleFilled />} 
                        size="large"
                        onClick={() => {
                          if (episodes.length > 0) {
                            playEpisode(episodes[0]); // Play the first episode (incrementViewCount already called inside)
                          } else {
                            // If no episodes, try to play the trailer or main video
                            setSelectedEpisode({
                              id: 'main',
                              number: 1,
                              title: `${anime.name} - Full Movie`,
                              thumbnail: anime.image,
                              duration: anime.duration || '1:30:00',
                              releaseDate: anime.year || new Date().toISOString()
                            });
                            setIsPlaying(true);
                            incrementViewCount(); // Increment view count for full movie
                          }
                        }}
                        style={{ 
                          backgroundColor: '#EF4444', 
                          borderColor: '#EF4444',
                          height: '48px',
                          fontSize: '16px',
                          paddingLeft: '24px',
                          paddingRight: '24px'
                        }}
                      >
                        Start Watching
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Video Player Section (visible when an episode is playing) */}
            {isPlaying && selectedEpisode && (
              <div id="video-player" className="bg-black py-4">
                <div className="container mx-auto px-4">
                  <div className="mb-4">
                    <Button 
                      type="text" 
                      icon={<ArrowLeftOutlined />} 
                      style={{ color: 'white' }}
                      onClick={() => setIsPlaying(false)}
                    >
                      Back to Episodes
                    </Button>
                  </div>
                  <div className="rounded overflow-hidden bg-gray-900">
                    <video
                      ref={videoRef}
                      controls
                      className="w-full aspect-video"
                      poster={selectedEpisode?.thumbnail ? getImageUrl(selectedEpisode.thumbnail) : getImageUrl(anime?.image)}
                      onTimeUpdate={handleTimeUpdate}
                      autoPlay
                    >
                      <source src="/videos/sample.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="text-lg font-semibold">{selectedEpisode.title}</h3>
                          <p className="text-sm text-gray-400">Released: {new Date(selectedEpisode.releaseDate).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            type="text"
                            icon={<DownloadOutlined />}
                            style={{ color: 'white' }}
                          >
                            Download
                          </Button>
                          <Button
                            type="text"
                            icon={loadingFavorite ? 
                              <LoadingOutlined /> : 
                              (isFavorite ? <HeartFilled style={{ color: 'white' }} /> : <HeartOutlined style={{ color: 'white' }} />)}
                            style={{ color: 'white' }}
                            onClick={toggleFavorite}
                          >
                            {isFavorite ? 'Favorited' : 'Favorite'}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-400 mb-4">
                        <span className="mr-2">{formatTime(videoTime)}</span>
                        <Progress 
                          percent={(videoTime / videoDuration) * 100} 
                          showInfo={false}
                          strokeColor="#EF4444"
                          trailColor="#374151"
                          className="flex-1"
                        />
                        <span className="ml-2">{formatTime(videoDuration)}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <div>
                          <p className="text-xs text-gray-400">Next Episode</p>
                          {episodes.find(ep => ep.number === selectedEpisode.number + 1) ? (
                            <Button 
                              type="link" 
                              className="p-0" 
                              onClick={() => playEpisode(episodes.find(ep => ep.number === selectedEpisode.number + 1)!)}
                            >
                              Episode {selectedEpisode.number + 1}
                            </Button>
                          ) : (
                            <span className="text-gray-500">Not Available</span>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Quality</p>
                          <Dropdown
                            menu={{
                              items: [
                                { key: '1080p', label: '1080p HD' },
                                { key: '720p', label: '720p HD' },
                                { key: '480p', label: '480p' },
                                { key: '360p', label: '360p' }
                              ]
                            }}
                          >
                            <Button type="link" className="p-0">
                              1080p HD <span className="text-xs">▼</span>
                            </Button>
                          </Dropdown>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Audio</p>
                          <Dropdown
                            menu={{
                              items: [
                                { key: 'japanese', label: 'Japanese' },
                                { key: 'english', label: 'English' }
                              ]
                            }}
                          >
                            <Button type="link" className="p-0">
                              Japanese <span className="text-xs">▼</span>
                            </Button>
                          </Dropdown>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Subtitles</p>
                          <Dropdown
                            menu={{
                              items: [
                                { key: 'english', label: 'English' },
                                { key: 'spanish', label: 'Spanish' },
                                { key: 'french', label: 'French' },
                                { key: 'off', label: 'Off' }
                              ]
                            }}
                          >
                            <Button type="link" className="p-0">
                              English <span className="text-xs">▼</span>
                            </Button>
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : null}
      </main>

      <style jsx global>{`
        /* Custom styles */
        
        /* Episode badge */
        .episode-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: #EF4444;
          color: white;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          z-index: 5;
        }
        
        /* Watch Now button hover effect */
        .watch-now-btn:hover {
          opacity: 0.9;
          transform: translateY(-2px);
          transition: all 0.2s ease;
        }
        
        /* Favorite button styling */
        .favorite-btn:hover {
          opacity: 0.9;
        }
        
        /* Mobile responsiveness improvements */
        @media (max-width: 640px) {
          /* Adjust hero banner height for mobile */
          .h-64.md\\:h-96 {
            height: 12rem;
          }
          
          /* Stack action buttons on mobile */
          .flex.space-x-2.justify-center.md\\:justify-end {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .flex.space-x-2.justify-center.md\\:justify-end .ant-btn {
            width: 100%;
            margin-left: 0 !important;
            margin-right: 0 !important;
            height: 36px !important;
          }
          
          /* Improve anime info display on mobile */
          .flex.flex-wrap.justify-center.md\\:justify-start.gap-x-6 {
            justify-content: space-between;
          }
          
          .flex.flex-wrap.justify-center.md\\:justify-start.gap-x-6 > div {
            width: 48%;
            margin-bottom: 12px;
          }
          
          /* Make video controls more touch-friendly */
          .ant-btn-text {
            padding: 4px 8px;
          }
          
          /* Adjust video player controls for mobile */
          .grid.grid-cols-2.sm\\:grid-cols-4.gap-4 {
            gap: 8px;
          }
          
          .grid.grid-cols-2.sm\\:grid-cols-4.gap-4 p,
          .grid.grid-cols-2.sm\\:grid-cols-4.gap-4 .ant-btn-link {
            font-size: 0.7rem;
          }
          
          /* Make poster image smaller and centered on mobile */
          .w-32.h-44.md\\:w-40.md\\:h-56 {
            width: 6rem;
            height: 8rem;
            margin: 0 auto;
          }
          
          /* Improve readability of anime title */
          h1.text-2xl.md\\:text-4xl {
            font-size: 1.25rem;
            line-height: 1.75rem;
            text-align: center;
          }
          
          /* Center-align category tags */
          .flex.flex-wrap.justify-center.md\\:justify-start.gap-2 {
            justify-content: center;
          }
          
          /* Make bottom CTA button full width */
          .mt-8 .ant-btn {
            width: 100%;
            height: 40px !important;
          }
        }
        
        /* Custom rating stars styling */
        .custom-rate .ant-rate-star {
          cursor: pointer;
          margin-right: 4px;
          transition: transform 0.2s, color 0.2s;
        }
        
        .custom-rate .ant-rate-star-first,
        .custom-rate .ant-rate-star-second {
          color: rgba(251, 191, 36, 0.4); /* Lighter unfilled color */
        }
        
        /* Fill stars on hover - this fills the entire star */
        .custom-rate .ant-rate-star:hover .ant-rate-star-first,
        .custom-rate .ant-rate-star:hover .ant-rate-star-second {
          color: #F59E0B !important; /* Filled color on hover */
        }
        
        /* Fill stars before the hovered one */
        .custom-rate .ant-rate-star:hover ~ .ant-rate-star .ant-rate-star-first,
        .custom-rate .ant-rate-star:hover ~ .ant-rate-star .ant-rate-star-second {
          color: rgba(251, 191, 36, 0.4) !important; /* Keep them unfilled */
        }
        
        /* Half star hover effect */
        .custom-rate .ant-rate-star:hover .ant-rate-star-first {
          color: #F59E0B !important; /* Fill the first half on hover */
        }
        
        /* Support for half-star rating */
        .custom-rate .ant-rate-star-half:hover .ant-rate-star-first {
          color: #F59E0B !important; /* Fill only the first half */
        }
        
        .custom-rate .ant-rate-star-half:hover .ant-rate-star-second {
          color: rgba(251, 191, 36, 0.4) !important; /* Keep second half unfilled */
        }
        
        /* Keep the selected stars filled */
        .custom-rate .ant-rate-star-full .ant-rate-star-first,
        .custom-rate .ant-rate-star-full .ant-rate-star-second {
          color: #FBBF24 !important; /* Bright gold for filled stars */
        }
        
        /* Half star styling for selected */
        .custom-rate .ant-rate-star-half .ant-rate-star-first {
          color: #FBBF24 !important; /* Keep half stars filled */
        }
        
        /* Enhanced hover effect for star ratings */
        .custom-rate .ant-rate-star:hover {
          transform: scale(1.4);
          transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        
        /* Rating hover effect */
        .rating-container {
          display: inline-block;
        }
        
        .rating-collapsed {
          cursor: pointer;
          padding: 4px 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .rating-collapsed:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .rating-trigger {
          color: #FBBF24;
          font-size: 16px;
          margin-right: 2px;
        }
        
        .rating-expand {
          background-color: rgba(31, 41, 55, 0.8);
          border-radius: 4px;
          padding: 4px 8px;
          transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
          transform-origin: center bottom;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
        }
        
        .rating-active {
          animation: pop-up 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }
        
        @keyframes pop-up {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

// Main component that wraps content in Suspense
export default function DetailPage() {
  return (
    <Suspense 
      fallback={
        <div className="flex justify-center items-center min-h-screen bg-gray-900">
          <Spin size="large" />
        </div>
      }
    >
      <AnimeDetailContent />
    </Suspense>
  );
}
