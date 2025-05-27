"use client";

// pages/profile.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Row, Col, Button, List, Typography, Spin, Tabs, Avatar, Modal, Form, Input, notification, Rate } from 'antd';
import { UserOutlined, EditOutlined, StarOutlined, ClockCircleOutlined, HeartOutlined, HeartFilled, EyeOutlined, LogoutOutlined, LoadingOutlined } from '@ant-design/icons';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

// TypeScript interfaces
interface User {
  _id: string;
  username: string;
  email: string;
  profileImage?: string;
  bio?: string;
  joinDate: string;
  watchedCount: number;
  favoriteCount: number;
}

interface Film {
  _id: string;
  movieId?: string;
  name: string;
  image: string;
  category?: string;
  description?: string;
  episode?: string;
  views?: number;
  isWatched?: boolean;
  isFavorite?: boolean;
  rating?: number;
  ratingCount?: number;
  userRating?: number; // Added to track user's rating
  progress?: number;
  timestamp?: string;
  episodeId?: string;
  duration?: string;
}

interface RatingResponse {
  success: boolean;
  message: string;
  rating: number;
}

// Add a new interface for user ratings
interface UserRating {
  _id: string;
  movieId: {
    _id: string;
    name: string;
    image: string;
    category?: string;
  };
  rating: number;
  createdAt: string;
}

const Profile: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Film[]>([]);
  const [watchHistory, setWatchHistory] = useState<Film[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState<boolean>(false);
  const [favoriteModalData, setFavoriteModalData] = useState<{film: Film | null, action: 'add' | 'remove'}>({film: null, action: 'add'});
  const [loginRequiredModalVisible, setLoginRequiredModalVisible] = useState<boolean>(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [confirmRemoveModalVisible, setConfirmRemoveModalVisible] = useState<boolean>(false);
  const [filmToRemove, setFilmToRemove] = useState<Film | null>(null);
  const [loadingFavorite, setLoadingFavorite] = useState<string | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();
  const [userRatings, setUserRatings] = useState<UserRating[]>([]);
  const [loadingRatings, setLoadingRatings] = useState<boolean>(false);
  const [ratingSortBy, setRatingSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not logged in
      router.push('/login');
      return;
    }

    setIsLoggedIn(true);
    fetchUserData(token);
  }, [router]);

  // Function to fetch user profile data
  const fetchUserData = async (token: string) => {
    try {
      setLoading(true);
      console.log('Fetching user data with token:', token); // Debug log

      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:2000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          router.push('/login');
          throw new Error('Session expired. Please login again.');
        }
        const errorData = await response.json();
        console.error('Profile fetch error:', errorData); // Debug log
        throw new Error(errorData.message || `API error: ${response.status}`);
      }

      const userData = await response.json();
      console.log('User data received:', userData); // Debug log

      if (!userData || !userData._id) {
        console.error('Invalid user data received:', userData);
        throw new Error('Invalid user data received');
      }

      const userId = userData._id;

      // Set user data
      setUser({
        _id: userId,
        username: userData.username || 'anime_lover',
        email: userData.email || 'user@example.com',
        profileImage: userData.profileImage || '/img/user/default-avatar.jpg',
        bio: userData.bio || 'Anime enthusiast and collector. I love watching fantasy and action anime!',
        joinDate: userData.createdAt || new Date().toISOString(),
        watchedCount: userData.watchedCount || 0,
        favoriteCount: userData.favoriteCount || 0
      });

      // Fetch favorite movies and watch history - but only if we have a valid userId
      if (userId) {
        try {
          await fetchFavorites(token, userId);
        } catch (favError) {
          console.error('Error in fetchFavorites:', favError);
          // Don't throw, continue with other fetches
        }
        
        try {
          await fetchWatchHistory(token);
        } catch (histError) {
          console.error('Error in fetchWatchHistory:', histError);
          // Don't throw, continue with rendering
        }
      }

      // Add function to fetch user ratings
      try {
        await fetchUserRatings(token, userId);
      } catch (ratingError) {
        console.error('Error in fetchUserRatings:', ratingError);
        // Don't throw, continue with other operations
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      
      if (err instanceof Error && err.message.includes('Session expired')) {
        return; // Already handled by pushing to login
      }
      
      // Use mock data as fallback if API fails - directly set states instead of calling another function
      setUser({
        _id: '1',
        username: 'anime_lover',
        email: 'user@example.com',
        profileImage: '/img/user/default-avatar.jpg',
        bio: 'Anime enthusiast and collector. I love watching fantasy and action anime!',
        joinDate: '2023-05-15',
        watchedCount: 45,
        favoriteCount: 12
      });

      // Set empty arrays instead of mock data to prevent loops
      setFavorites([]);
      setWatchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch favorites
  const fetchFavorites = async (token: string, userId?: string) => {
    try {
      // If userId is not provided, get it from localStorage
      if (!userId && !user?._id) {
        const storedUserId = localStorage.getItem('userId');
        if (!storedUserId) {
          console.log('No user ID available for fetching favorites');
          return; // Exit early if no user ID is available
        }
        userId = storedUserId;
      }

      const id = userId || user?._id;
      console.log('Fetching favorites for user ID:', id);

      const response = await fetch(`http://localhost:2000/favorites/user/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch favorites: ${response.status}`);
      }

      const data = await response.json();
      console.log('Favorites data:', data); // Debug log
      setFavorites(data);
      // Update favorite count
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          favoriteCount: data.length
        };
      });
    } catch (err) {
      console.error('Error fetching favorites:', err);
      // Don't call setMockData() here to avoid potential infinite loops
      // Just set empty favorites array if there's an error
      setFavorites([]);
    }
  };

  // Function to fetch watch history
  const fetchWatchHistory = async (token: string) => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        console.error('No user ID available for fetching watch history');
        setWatchHistory([]);
        return;
      }

      const response = await fetch(`http://localhost:2000/watch-history/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Watch history data:', data);
        
        // Process the watch history data into our Film format
        const processedHistory = data.map((item: any) => {
          // Handle case where movieId is an object with nested data
          const movieData = item.movieId && typeof item.movieId === 'object' ? item.movieId : {};
          const movieId = movieData._id || item.movieId;
          
          // Determine watched status - check multiple potential fields
          const isWatched = 
            item.completed === true || 
            item.watched === true || 
            (typeof item.watchTime === 'number' && item.watchTime > 0) ||
            (typeof item.progress === 'number' && item.progress >= 90);
          
          return {
            _id: movieId, // Use the movie ID for linking
            movieId: movieId, // Store the actual movie ID
            name: movieData.name || item.movieName || 'Unknown Title',
            image: movieData.image || item.image || '/img/anime/default-poster.jpg',
            category: movieData.category || item.category || '',
            episode: `Episode ${item.episodeNumber || '?'}`,
            isWatched: isWatched,
            progress: item.progress || item.watchTime || 0,
            timestamp: item.updatedAt || item.timestamp || new Date().toISOString(),
            episodeId: item.episodeId || '',
            duration: movieData.duration || item.duration || '0:00'
          };
        });
        
        // Sort by most recent first
        processedHistory.sort((a: Film, b: Film) => {
          return new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime();
        });
        
        setWatchHistory(processedHistory);
        
        // Count unique movies that have been watched
        const uniqueWatchedMovies = new Set();
        processedHistory.forEach((item: Film) => {
          if (item.isWatched) {
            uniqueWatchedMovies.add(item._id);
          }
        });
        
        // Update the watched count in user profile
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            watchedCount: uniqueWatchedMovies.size
          };
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch watch history:', errorText);
        throw new Error('Failed to fetch watch history');
      }
    } catch (err) {
      console.error('Error fetching watch history:', err);
      // Set empty watch history instead of calling setMockData
      setWatchHistory([]);
    }
  };

  // Function to fetch user ratings
  const fetchUserRatings = async (token: string, userId: string) => {
    try {
      setLoadingRatings(true);
      const response = await fetch(`http://localhost:2000/movies/ratings/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log('User ratings data:', responseData);
        
        // Extract the ratings array from the response
        // The API returns { success: true, count: n, data: [...ratings] }
        const ratingsArray = responseData.data || [];
        
        // Process the data to handle the API's response format
        let processedRatings: UserRating[] = [];
        
        if (Array.isArray(ratingsArray)) {
          processedRatings = ratingsArray.map(item => {
            // Use the movie property which contains all movie details
            const movieData = item.movie || {};
            
            return {
              _id: item.ratingId || item._id,
              movieId: {              _id: movieData._id || item.movieId,              name: movieData.name || 'Unknown Title',              image: movieData.image || 'default-poster.jpg',              category: movieData.category || ''            },
              rating: item.rating,
              createdAt: item.createdAt || new Date().toISOString()
            };
          });
        }
        
        console.log('Processed ratings:', processedRatings);
        setUserRatings(processedRatings);
      } else {
        console.error('Failed to fetch user ratings:', await response.text());
        setUserRatings([]);
      }
    } catch (err) {
      console.error('Error fetching user ratings:', err);
      setUserRatings([]);
    } finally {
      setLoadingRatings(false);
    }
  };

  // Function to resume watching a video
  const resumeWatching = (film: Film) => {
    if (!film._id) {
      notification.error({
        message: 'Error',
        description: 'Unable to resume. Missing movie information.',
        placement: 'topRight'
      });
      return;
    }
    
    // Calculate time to resume from (in seconds)
    let resumeTime = 0;
    if (film.progress && film.progress > 0 && film.progress < 100) {
      // If we have progress data, use it
      resumeTime = film.progress;
    }
    
    // Save resumeTime in localStorage to be used on the detail page
    localStorage.setItem('resumeTime', resumeTime.toString());
    
    // Save episodeId if available
    if (film.episodeId) {
      localStorage.setItem('resumeEpisodeId', film.episodeId);
    }
    
    // Navigate to the detail page with query params
    const queryParams = film.episodeId 
      ? `id=${film._id}&resume=true&episodeId=${film.episodeId}`
      : `id=${film._id}&resume=true`;
      
    router.push(`/detail?${queryParams}`);
  };

  // Set mock data if API fails
  const setMockData = () => {
    // Mock favorite movies
    const mockFavorites: Film[] = [
      { _id: '1', name: 'Demon Slayer', image: '/img/anime/trending-1.jpg', category: 'Action', views: 12500, isFavorite: true, rating: 4.9 },
      { _id: '2', name: 'Attack on Titan', image: '/img/anime/trending-2.jpg', category: 'Action', views: 9800, isFavorite: true, rating: 4.8 },
      { _id: '3', name: 'My Hero Academia', image: '/img/anime/trending-3.jpg', category: 'Superhero', views: 8700, isFavorite: true, rating: 4.7 },
      { _id: '4', name: 'Jujutsu Kaisen', image: '/img/anime/trending-4.jpg', category: 'Supernatural', views: 7600, isFavorite: true, rating: 4.9 },
      { _id: '5', name: 'One Punch Man', image: '/img/anime/trending-5.jpg', category: 'Comedy', views: 6500, isFavorite: true, rating: 4.6 },
    ];

    // Mock watch history
    const mockWatchHistory: Film[] = [
      { 
        _id: '6', 
        movieId: '6',
        name: 'Tokyo Revengers', 
        image: '/img/anime/trending-6.jpg', 
        category: 'Action', 
        isWatched: true, 
        episode: 'S1:E24',
        progress: 75,
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        episodeId: 'ep-24',
        duration: '24:15'
      },
      { 
        _id: '7', 
        movieId: '7',
        name: 'Chainsaw Man', 
        image: '/img/anime/trending-7.jpg', 
        category: 'Supernatural', 
        isWatched: true, 
        episode: 'S1:E12',
        progress: 100,
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        episodeId: 'ep-12',
        duration: '23:45'
      },
      { 
        _id: '8', 
        movieId: '8',
        name: 'Spy x Family', 
        image: '/img/anime/trending-8.jpg', 
        category: 'Comedy', 
        isWatched: false, 
        episode: 'S1:E25',
        progress: 45,
        timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        episodeId: 'ep-25',
        duration: '24:00'
      },
      { 
        _id: '4', 
        movieId: '4',
        name: 'Jujutsu Kaisen', 
        image: '/img/anime/trending-4.jpg', 
        category: 'Supernatural', 
        isWatched: true, 
        episode: 'S2:E8',
        progress: 100,
        timestamp: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        episodeId: 'ep-33',
        duration: '24:30'
      },
      { 
        _id: '9', 
        movieId: '9',
        name: 'Vinland Saga', 
        image: '/img/anime/trending-9.jpg', 
        category: 'Historical', 
        isWatched: false, 
        episode: 'S2:E12',
        progress: 30,
        timestamp: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
        episodeId: 'ep-37',
        duration: '25:00'
      },
      { 
        _id: '10', 
        movieId: '10',
        name: 'Blue Lock', 
        image: '/img/anime/trending-10.jpg', 
        category: 'Sports', 
        isWatched: true, 
        episode: 'S1:E15',
        progress: 100,
        timestamp: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
        episodeId: 'ep-15',
        duration: '23:30'
      },
    ];

    setFavorites(mockFavorites);
    setWatchHistory(mockWatchHistory);
  };

  // Function to handle logout
  const handleLogout = () => {
    // Remove token and username from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // Update state
    setIsLoggedIn(false);
    setUser(null);
    // Redirect to home page
    router.push('/home');
  };

  // Function to handle profile update
  const handleProfileUpdate = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        notification.error({
          message: 'Authentication Error',
          description: 'You need to be logged in to update your profile.',
        });
        return;
      }

      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:2000/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        notification.success({
          message: 'Success',
          description: 'Profile updated successfully!',
        });
        
        // Update user state with new values
        setUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            username: values.username || prev.username,
            bio: values.bio || prev.bio,
            email: values.email || prev.email
          };
        });
        
        setEditModalVisible(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      notification.error({
        message: 'Update Failed',
        description: 'There was an error updating your profile. Please try again.',
      });
      
      // For demo purposes, pretend it worked anyway
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          username: form.getFieldValue('username') || prev.username,
          bio: form.getFieldValue('bio') || prev.bio,
          email: form.getFieldValue('email') || prev.email
        };
      });
      
      setEditModalVisible(false);
    }
  };

  // Function to add a film to favorites
  const handleAddToFavorites = async (movieId: string) => {
    try {
      // Set loading state for this specific movie
      setLoadingFavorite(movieId);
      
      const token = localStorage.getItem('token');
      if (!token) {
        // Find the film data to display in the login required modal
        const film = watchHistory.find(f => f._id === movieId);
        if (film) {
          setSelectedFilm(film);
          setLoginRequiredModalVisible(true);
        } else {
          notification.error({
            message: 'Authentication Error',
            description: 'Please log in to add favorites.',
            placement: 'topRight',
            duration: 3
          });
        }
        setLoadingFavorite(null); // Clear loading state
        return;
      }

      const userId = user?._id || localStorage.getItem('userId');
      if (!userId) {
        notification.error({
          message: 'User ID Error',
          description: 'User ID not found. Please try logging in again.',
          placement: 'topRight',
          duration: 3
        });
        setLoadingFavorite(null); // Clear loading state
        return;
      }

      // Check if already favorited
      const isAlreadyFavorite = favorites.some(fav => fav._id === movieId);
      if (isAlreadyFavorite) {
        notification.info({
          message: 'Already Favorite',
          description: 'This anime is already in your favorites.',
          placement: 'topRight',
          duration: 2
        });
        setLoadingFavorite(null); // Clear loading state
        return;
      }

      // Find the film data from watchHistory
      const filmToAdd = watchHistory.find(f => f._id === movieId);
      console.log('Film data for add favorite:', filmToAdd);

      const response = await fetch('http://localhost:2000/favorites', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          movieId: movieId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add to favorites');
      }

      const data = await response.json();
      console.log('Added to favorites:', data);

      // Refresh favorites list
      await fetchFavorites(token, userId.toString());
      
      // Clear loading state
      setLoadingFavorite(null);
      
      // Show modal if film data exists
      if (filmToAdd) {
        setFavoriteModalData({
          film: filmToAdd,
          action: 'add'
        });
        setFavoriteModalVisible(true);
      } else {
        notification.success({
          message: 'Success',
          description: 'Added to favorites successfully!',
          placement: 'topRight',
          duration: 2
        });
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      notification.error({
        message: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add to favorites',
        placement: 'topRight',
        duration: 3
      });
      setLoadingFavorite(null); // Clear loading state in case of error
    }
  };

  // Function to remove a film from favorites
  const handleRemoveFavorite = async (filmId: string) => {
    // Set loading state for this specific film
    setLoadingFavorite(filmId);
    
    // Find the film data to use in the notification before removing
    const film = favorites.find(f => f._id === filmId);
    console.log('Film data for remove favorite:', film);
    
    if (film) {
      setFilmToRemove(film);
      setConfirmRemoveModalVisible(true);
    } else {
      notification.error({
        message: 'Error',
        description: 'Could not find film information',
        placement: 'topRight',
        duration: 3
      });
    }
    
    // Clear loading state when modal is shown
    setLoadingFavorite(null);
  };
  
  // Function to confirm removal of a film from favorites
  const confirmRemoveFavorite = async () => {
    if (!filmToRemove) return;
    
    try {
      // Set loading state for this film
      setLoadingFavorite(filmToRemove._id);
      
      const token = localStorage.getItem('token');
      if (!token) {
        notification.error({
          message: 'Authentication Error',
          description: 'Please log in to manage favorites.',
          placement: 'topRight',
          duration: 3
        });
        setLoadingFavorite(null); // Clear loading state
        return;
      }

      const response = await fetch(`http://localhost:2000/favorites/${filmToRemove._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to remove from favorites');
      }

      // Update local state by removing the deleted favorite
      setFavorites(favorites.filter(fav => fav._id !== filmToRemove._id));
      
      // Update favorite count
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          favoriteCount: prev.favoriteCount - 1
        };
      });

      // Close confirmation modal
      setConfirmRemoveModalVisible(false);
      
      // Clear loading state
      setLoadingFavorite(null);
      
      // Show success modal
      setFavoriteModalData({
        film: filmToRemove,
        action: 'remove'
      });
      setFavoriteModalVisible(true);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      notification.error({
        message: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove from favorites',
        placement: 'topRight',
        duration: 3
      });
      setLoadingFavorite(null); // Clear loading state in case of error
    }
  };

  // Function to get image URL
  const getImageUrl = (image?: string): string => {
    if (!image) {
      // Return a default image if the image is undefined or null
      return '/img/anime/default-poster.jpg';
    }
    
    if (image.startsWith('http')) {
      return image;
    } else {
      return `/img/anime/${image}`;
    }
  };

  // Function to get user avatar
  const getUserAvatar = () => {
    if (user?.profileImage) {
      if (user.profileImage.startsWith('http')) {
        return user.profileImage;
      } else {
        return `/img/user/${user.profileImage}`;
      }
    }
    return '/img/user/default-avatar.jpg';
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Function to format time since
  const formatTimeSince = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)} minutes ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)} hours ago`;
    } else if (diff < 2592000) {
      return `${Math.floor(diff / 86400)} days ago`;
    } else {
      return formatDate(timestamp);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <Head>
        <title>My Profile - Anime</title>
        <meta name="description" content="User profile and favorite anime" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

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
        {favoriteModalData.film && (
          <div className="flex flex-col sm:flex-row items-center sm:items-start">
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(favoriteModalData.film.image)} 
                alt={favoriteModalData.film.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold mb-1">{favoriteModalData.film.name}</h3>
              {favoriteModalData.action === 'add' ? (
                <p>Successfully added to your favorites list</p>
              ) : (
                <p>Successfully removed from your favorites list</p>
              )}
              {favoriteModalData.film.category && (
                <div className="mt-2 flex justify-center sm:justify-start">
                  <span className="badge badge-category">{favoriteModalData.film.category}</span>
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
          {selectedFilm && (
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(selectedFilm.image)} 
                alt={selectedFilm.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold mb-1">
              {selectedFilm ? selectedFilm.name : 'This anime'}
            </h3>
            <p>You need to be logged in to add items to your favorites list.</p>
            <p className="mt-2">Would you like to go to the login page?</p>
          </div>
        </div>
      </Modal>

      {/* Confirm Remove Favorite Modal */}
      <Modal
        open={confirmRemoveModalVisible}
        onCancel={() => setConfirmRemoveModalVisible(false)}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => setConfirmRemoveModalVisible(false)}
          >
            Cancel
          </Button>,
          <Button 
            key="remove" 
            type="primary" 
            danger
            onClick={confirmRemoveFavorite}
          >
            Remove
          </Button>
        ]}
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HeartOutlined style={{ color: '#EF4444', marginRight: '8px' }} /> Remove from Favorites
          </div>
        }
        centered
        width={{ xs: '90%', sm: 400 }}
        className="favorites-modal-remove"
        style={{ top: 100 }}
        styles={{ mask: { backgroundColor: 'rgba(0, 0, 0, 0.7)' } }}
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start">
          {filmToRemove && (
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(filmToRemove.image)} 
                alt={filmToRemove.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold mb-1">
              {filmToRemove ? filmToRemove.name : 'This anime'}
            </h3>
            <p>Are you sure you want to remove this anime from your favorites?</p>
            <p className="mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>



      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Spin size="large" />
          </div>
        ) : error ? (
          <div className="bg-red-500 bg-opacity-20 border border-red-500 text-white p-4 mb-6 rounded">
            {error}
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <Row gutter={24} align="middle">
                <Col md={6} sm={24} className="text-center mb-4 md:mb-0">
                  <div className="relative inline-block">
                    <Avatar 
                      size={128}
                      src={getUserAvatar()}
                      icon={<UserOutlined />}
                      style={{ border: '4px solid #EF4444' }}
                    />
                  </div>
                </Col>
                <Col md={18} sm={24}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                    <Title level={2} style={{ color: 'white', margin: 0 }}>
                      {user?.username}
                    </Title>
                    <Button 
                      type="primary" 
                      icon={<EditOutlined />} 
                      style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                      className="mt-2 md:mt-0"
                      onClick={() => {
                        // Pre-fill form with current values
                        form.setFieldsValue({
                          username: user?.username,
                          email: user?.email,
                          bio: user?.bio
                        });
                        setEditModalVisible(true);
                      }}
                    >
                      Edit Profile
                    </Button>
                  </div>
                  <Paragraph style={{ color: '#D1D5DB', marginBottom: '1rem' }}>
                    {user?.bio}
                  </Paragraph>
                  <Row gutter={16}>
                    <Col span={8} md={6}>
                      <div className="flex items-center">
                        <ClockCircleOutlined style={{ color: '#EF4444', marginRight: '0.5rem' }} />
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Joined</Text>
                          <Text style={{ color: 'white' }}>{user?.joinDate ? formatDate(user.joinDate) : 'N/A'}</Text>
                        </div>
                      </div>
                    </Col>
                    {/* <Col span={8} md={6}>
                      <div className="flex items-center">
                        <EyeOutlined style={{ color: '#EF4444', marginRight: '0.5rem' }} />
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Watched</Text>
                          <Text style={{ color: 'white' }}>{user?.watchedCount || 0} anime</Text>
                        </div>
                      </div>
                    </Col> */}
                    <Col span={8} md={6}>
                      <div className="flex items-center">
                        <HeartFilled style={{ color: '#EF4444', marginRight: '0.5rem' }} />
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Favorites</Text>
                          <Text style={{ color: 'white' }}>{user?.favoriteCount || 0} anime</Text>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </div>

            {/* Tabs Section */}
            <Tabs 
              defaultActiveKey="favorites" 
              className="profile-tabs"
              items={[
                {
                  key: 'favorites',
                  label: <span className="text-lg"><HeartFilled style={{ marginRight: '0.5rem' }} />Favorites</span>,
                  children: (
                    favorites.length === 0 ? (
                      <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <HeartOutlined style={{ fontSize: '48px', color: '#4B5563', marginBottom: '1rem' }} />
                        <Title level={4} style={{ color: '#9CA3AF' }}>No favorites yet</Title>
                        <Paragraph style={{ color: '#6B7280' }}>
                          Start adding anime to your favorites list!
                        </Paragraph>
                        <Button
                          type="primary"
                          style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', marginTop: '1rem' }}
                          onClick={() => router.push('/home')}
                        >
                          Browse Anime
                        </Button>
                      </div>
                    ) : (
                      <Row gutter={[16, 24]}>
                        {favorites.map(film => (
                          <Col lg={6} md={8} sm={12} xs={24} key={film._id}>
                            <Card
                              hoverable
                              className="bg-gray-800 border-gray-700 overflow-hidden favorite-card"
                              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                              cover={
                                <div className="relative">
                                  <div
                                    className="h-48 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${getImageUrl(film.image)})` }}
                                  ></div>
                                  {/* Category badge */}
                                  {film.category && (
                                    <div className="category-badge">
                                      {film.category}
                                    </div>
                                  )}
                                  {/* Episode badge - if available */}
                                  {film.episode && (
                                    <div className="episode-badge">
                                      <span>{film.episode}</span>
                                    </div>
                                  )}
                                  {/* Views counter */}
                                  {/* {film.views && (
                                    <div className="views-badge">
                                      <EyeOutlined className="view-icon" /> 
                                      <span>{film.views.toLocaleString()}</span>
                                    </div>
                                  )} */}
                                  {/* Heart button - on the left */}
                                  <div className="absolute bottom-2 left-2 favorite-btn">
                                    {!favorites.some(fav => fav._id === film._id) ? (
                                      <Button
                                        type="primary"
                                        danger
                                        icon={loadingFavorite === film._id ? <LoadingOutlined /> : <HeartOutlined />}
                                        className="rounded-full heart-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddToFavorites(film._id);
                                        }}
                                      />
                                    ) : (
                                      <Button
                                        type="primary"
                                        danger
                                        icon={loadingFavorite === film._id ? <LoadingOutlined /> : <HeartFilled />}
                                        className="rounded-full heart-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRemoveFavorite(film._id);
                                        }}
                                      />
                                    )}
                                  </div>
                                  {/* Rating badge - on the right */}
                                  {film.rating && (
                                    <div className="rating-badge" title={`${film.rating.toFixed(1)}/5 from ${film.ratingCount || 0} ratings`}>
                                      <StarOutlined className="star-icon" />
                                      <span>{film.rating.toFixed(1)}</span>
                                      <span className="text-xs ml-1">
                                        ({film.ratingCount ? (film.ratingCount > 999 ? `${(film.ratingCount / 1000).toFixed(1)}k` : film.ratingCount) : '0'})
                                      </span>
                                    </div>
                                  )}
                                </div>
                              }
                            >
                              <Link href={`/detail?id=${film._id}`}>
                                <Card.Meta
                                  title={<span style={{ color: 'white' }}>{film.name}</span>}
                                  description={
                                    <div style={{ color: '#9CA3AF' }}>
                                      <div className="flex flex-col">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="mr-4">{film.category}</span>
                                          {film.episode && (
                                            <span className="rounded text-xs" style={{ color: '#D1D5DB' }}>
                                              {film.episode}
                                            </span>
                                          )}
                                        </div>
                                        {film.progress !== undefined && (
                                          <div className="mt-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs">{film.isWatched ? 'Watched' : 'In progress'}</span>
                                              <span className="text-xs">{film.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                              <div 
                                                className="bg-red-500 h-1.5 rounded-full" 
                                                style={{ width: `${film.progress}%` }}
                                              ></div>
                                            </div>
                                            {film.timestamp && (
                                              <div className="text-xs mt-1 text-gray-500">
                                                {formatTimeSince(film.timestamp)}
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  }
                                />
                              </Link>
                            </Card>
                          </Col>
                        ))}
                      </Row>
                    )
                  )
                },
                {
                  key: 'history',
                  label: <span className="text-lg"><ClockCircleOutlined style={{ marginRight: '0.5rem' }} />Watch History</span>,
                  children: (
                    watchHistory.length === 0 ? (
                      <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <ClockCircleOutlined style={{ fontSize: '48px', color: '#4B5563', marginBottom: '1rem' }} />
                        <Title level={4} style={{ color: '#9CA3AF' }}>No watch history yet</Title>
                        <Paragraph style={{ color: '#6B7280' }}>
                          Start watching anime to build your history!
                        </Paragraph>
                        <Button
                          type="primary"
                          style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', marginTop: '1rem' }}
                          onClick={() => router.push('/home')}
                        >
                          Browse Anime
                        </Button>
                      </div>
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={watchHistory}
                        renderItem={film => (
                          <List.Item style={{ borderBottom: '1px solid #374151' }}>
                            <List.Item.Meta
                              avatar={
                                <div className="w-24 h-16 overflow-hidden rounded relative">
                                  <div
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(${getImageUrl(film.image)})` }}
                                  ></div>
                                  {film.episode && (
                                    <div className="episode-badge" style={{ top: '2px', left: '2px', fontSize: '0.65rem' }}>
                                      {film.episode}
                                    </div>
                                  )}
                                </div>
                              }
                              title={
                                <Link href={`/detail?id=${film._id}`} className="text-white hover:text-red-500 list-item-title">
                                  {film.name}
                                </Link>
                              }
                              description={
                                <div style={{ color: '#9CA3AF' }}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="mr-4">{film.category}</span>
                                      {film.episode && (
                                        <span className="rounded text-xs" style={{ color: '#D1D5DB' }}>
                                          {film.episode}
                                        </span>
                                      )}
                                    </div>
                                    {film.progress !== undefined && (
                                      <div className="mt-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs">{film.isWatched ? 'Watched' : 'In progress'}</span>
                                          <span className="text-xs">{film.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
                                          <div 
                                            className="bg-red-500 h-1.5 rounded-full" 
                                            style={{ width: `${film.progress}%` }}
                                          ></div>
                                        </div>
                                        {film.timestamp && (
                                          <div className="text-xs mt-1 text-gray-500">
                                            {formatTimeSince(film.timestamp)}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              }
                            />
                            <div className="flex space-x-2">
                              <Button
                                type="primary"
                                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                                size="small"
                                onClick={() => resumeWatching(film)}
                              >
                                Resume
                              </Button>
                              {!favorites.some(fav => fav._id === film._id) ? (
                                <Button
                                  icon={loadingFavorite === film._id ? <LoadingOutlined /> : <HeartOutlined />}
                                  style={{ backgroundColor: '#374151', borderColor: '#374151', color: 'white' }}
                                  size="small"
                                  onClick={() => handleAddToFavorites(film._id)}
                                >
                                  Add to Favorites
                                </Button>
                              ) : (
                                <Button
                                  icon={loadingFavorite === film._id ? <LoadingOutlined /> : <HeartFilled />}
                                  danger
                                  size="small"
                                  onClick={() => handleRemoveFavorite(film._id)}
                                >
                                  Remove from Favorites
                                </Button>
                              )}
                            </div>
                          </List.Item>
                        )}
                      />
                    )
                  )
                },
                {
                  key: 'ratings',
                  label: <span className="text-lg"><StarOutlined style={{ marginRight: '0.5rem' }} />My Ratings</span>,
                  children: (
                    loadingRatings ? (
                      <div className="flex justify-center py-12">
                        <Spin size="large" />
                      </div>
                    ) : userRatings.length === 0 ? (
                      <div className="text-center py-12 bg-gray-800 rounded-lg">
                        <StarOutlined style={{ fontSize: '48px', color: '#4B5563', marginBottom: '1rem' }} />
                        <Title level={4} style={{ color: '#9CA3AF' }}>No ratings yet</Title>
                        <Paragraph style={{ color: '#6B7280' }}>
                          Start rating anime to build your ratings collection!
                        </Paragraph>
                        <Button
                          type="primary"
                          style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', marginTop: '1rem' }}
                          onClick={() => router.push('/home')}
                        >
                          Browse Anime
                        </Button>
                      </div>
                    ) : (
                      <List
                        itemLayout="horizontal"
                        dataSource={userRatings}
                        renderItem={rating => (
                          <List.Item style={{ borderBottom: '1px solid #374151' }}>
                            <List.Item.Meta
                              avatar={
                                <div className="w-24 h-16 overflow-hidden rounded relative">
                                  <div
                                    className="h-full w-full bg-cover bg-center"
                                    style={{ backgroundImage: `url(/img/anime/${rating.movieId.image})` }}
                                  ></div>
                                  <div className="absolute bottom-0 right-0 bg-black bg-opacity-75 px-1 py-0.5 text-yellow-400 text-xs font-bold">
                                    ★ {rating.rating.toFixed(1)}
                                  </div>
                                </div>
                              }
                              title={
                                <Link href={`/detail?id=${rating.movieId._id}`} className="text-white hover:text-red-500 list-item-title">
                                  {rating.movieId.name}
                                </Link>
                              }
                              description={
                                <div style={{ color: '#9CA3AF' }}>
                                  <div className="flex flex-col">
                                    <div className="flex items-center mb-1">
                                      <Rate 
                                        disabled 
                                        value={rating.rating} 
                                        allowHalf 
                                        className="custom-rate text-sm"
                                      />
                                      <span className="ml-2 text-yellow-500 font-bold">{rating.rating.toFixed(1)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span>{rating.movieId.category || 'Anime'}</span>
                                      <span>Rated on {new Date(rating.createdAt).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              }
                            />
                            <div className="flex space-x-2">
                              <Button
                                type="primary"
                                style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                                size="small"
                                onClick={() => router.push(`/detail?id=${rating.movieId._id}`)}
                              >
                                View Details
                              </Button>
                            </div>
                          </List.Item>
                        )}
                      />
                    )
                  )
                },
              ]}
            />
          </>
        )}
      </main>

      

      <style jsx global>{`
        /* Custom styles */
        .profile-tabs .ant-tabs-tab {
          color: white !important; /* Make tab text white before clicking */
        }
        .profile-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #EF4444 !important;
        }
        .profile-tabs .ant-tabs-ink-bar {
         
        }
        .profile-edit-modal .ant-modal-header {
          background-color: #1F2937;
          border-bottom: 1px solid #374151;
        }
        .profile-edit-modal .ant-modal-title {
          color: white;
        }
        .profile-edit-modal .ant-modal-close-x {
          color: white;
        }
        .profile-edit-modal .ant-form-item-label > label {
          color: #D1D5DB;
        }
        .favorite-card .ant-card-meta-title,
        .list-item-title {
          color: white !important;
        }
        
        /* Badge styles */
        .category-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          color: #EF4444;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          z-index: 5;
        }
        
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
        
        .views-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          color: white;
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          z-index: 5;
        }
        
        .views-badge .view-icon,
        .rating-badge .star-icon {
          margin-right: 4px;
        }
        
        /* Rating styles */
        .ant-rate {
          color: #FBBF24;
          font-size: 1rem;
        }
        .ant-rate-star {
          margin-right: 4px;
        }
        .ant-rate-star-first, 
        .ant-rate-star-second {
          color: #FBBF24;
        }
                /* Half-star styling */        .ant-rate-star-half .ant-rate-star-first {          color: #FBBF24;          /* Add a subtle glow effect to half stars */          filter: drop-shadow(0 0 1px rgba(251, 191, 36, 0.5));        }                .ant-rate-star-full .ant-rate-star-second {          color: #FBBF24;        }
        .ant-rate-star-zero .ant-rate-star-first,
        .ant-rate-star-zero .ant-rate-star-second {
          color: rgba(251, 191, 36, 0.3);
        }
        
        /* Star sizes for custom-rate */
        .custom-rate .ant-rate-star {
          font-size: 16px;
        }
        
        /* Favorite button styles */
        .favorite-btn {
          z-index: 10; /* Ensure it's above the card for clicking */
        }
        .favorite-btn .ant-btn {
          min-width: 32px;
          min-height: 32px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .favorite-btn .ant-btn:hover {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .favorite-btn .anticon {
          font-size: 16px;
        }
        .favorite-card:hover .favorite-btn .ant-btn {
          transform: scale(1.1);
          transition: transform 0.2s ease;
        }
        .heart-btn {
          width: 32px !important;
          height: 32px !important;
          padding: 0 !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
          background-color: #EF4444 !important;
          border-color: #EF4444 !important;
        }
        
        /* Watch history anime name styling */
        .ant-list-item .ant-list-item-meta-title a {
          color: white !important;
        }

        /* Custom rating stars styling */
        .custom-rate .ant-rate-star:not(.ant-rate-star-full):hover {
          transform: scale(1.4);
          transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
        }

        .custom-rate .ant-rate-star-first:hover,
        .custom-rate .ant-rate-star-second:hover {
          color: #F59E0B;
          filter: drop-shadow(0 0 2px rgba(245, 158, 11, 0.5));
        }

        /* Ensure rating badge displays properly */
        .rating-badge span.text-xs {
          display: inline-block;
          font-size: 0.75rem;
          color: #D1D5DB;
          font-weight: normal;
          margin-left: 3px;
        }
      `}</style>
    </div>
  );
};

export default Profile;
                    