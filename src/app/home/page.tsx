"use client";

// pages/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Carousel, Tabs, Card, Row, Col, Button, List, Typography, Spin, Dropdown, Menu, notification, Modal, Rate } from 'antd';
import { RightOutlined, EyeOutlined, LogoutOutlined, UserOutlined, StarOutlined, HeartOutlined, HeartFilled, CheckCircleFilled, LoadingOutlined } from '@ant-design/icons';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';

const { TabPane } = Tabs;
const { Title, Paragraph } = Typography;

// TypeScript interfaces
interface Film {
  _id: string;
  name: string;
  image: string;
  category?: string;
  description?: string;
  episode?: string;
  views?: number;
  rating?: number;
  ratingCount?: number;
  userRating?: number;
}

interface HeroItem {
  title: string;
  category: string;
  description: string;
  image: string;
}

const Home: NextPage = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heroFilms, setHeroFilms] = useState<HeroItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteModalVisible, setFavoriteModalVisible] = useState<boolean>(false);
  const [favoriteModalData, setFavoriteModalData] = useState<{film: Film | null, action: 'add' | 'remove'}>({film: null, action: 'add'});
  const [loginRequiredModalVisible, setLoginRequiredModalVisible] = useState<boolean>(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [topViewedFilms, setTopViewedFilms] = useState<Film[]>([]);
  const [confirmRemoveModalVisible, setConfirmRemoveModalVisible] = useState<boolean>(false);
  const [filmToRemove, setFilmToRemove] = useState<{id: string, film: Film | null}>({id: '', film: null});
  const [loadingFavorite, setLoadingFavorite] = useState<string | null>(null);
  const [ratingFilm, setRatingFilm] = useState<string | null>(null);
  const [showRatingFor, setShowRatingFor] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Get username from localStorage if you stored it during login
      // or decode from JWT token if your token contains username
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        // Try to get username from API if you have an endpoint
        fetchUserProfile(token);
      }
      
      // Fetch user favorites - let the API handle user identification via token
      fetchUserFavorites(token);
    }

    // Fetch regular films
    fetchFilms();
    
    // Fetch top viewed films
    fetchTopViewedFilms();
  }, []);

  // Function to fetch user profile
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:2000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || 'User');
        // Optionally store username in localStorage
        localStorage.setItem('username', data.username);
        // Store user ID in localStorage for later use
        if (data._id) {
          localStorage.setItem('userId', data._id);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Set a fallback username if API call fails
      setUsername('User');
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    // Remove token and username from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    // Update state
    setIsLoggedIn(false);
    setUsername('');
    // You can redirect to login page if needed
     router.push('/login');
  };

  // Function to add a film to favorites
  const toggleFavorite = async (e: React.MouseEvent, filmId: string) => {
    e.preventDefault(); // Prevent the Link navigation
    e.stopPropagation(); // Stop event propagation
    
    // Set loading state for this film
    setLoadingFavorite(filmId);
    
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token) {
      // Find the film data to display in the login required modal
      const film = films.find(f => f._id === filmId);
      if (film) {
        setSelectedFilm(film);
        setLoginRequiredModalVisible(true);
      } else {
        notification.open({
          message: 'Login Required',
          description: 'Please log in to add favorites.',
          placement: 'topRight'
        });
      }
      setLoadingFavorite(null); // Clear loading state
      return;
    }
    
    try {
      const isFavorite = favorites.includes(filmId);
      
      // Find the film data to use in the notification
      const film = films.find(f => f._id === filmId);
      console.log('Film data for notification:', film);
      
      if (isFavorite) {
        // Show confirmation dialog for removal
        if (film) {
          setFilmToRemove({id: filmId, film});
          setConfirmRemoveModalVisible(true);
          setLoadingFavorite(null); // Clear loading state when showing modal
        } else {
          notification.error({
            message: 'Error',
            description: 'Could not find film information',
            placement: 'topRight',
            duration: 3
          });
          setLoadingFavorite(null); // Clear loading state
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
            movieId: filmId 
          })
        });
        
        if (response.ok) {
          // Update local state
          setFavorites([...favorites, filmId]);
          
          // Clear loading state
          setLoadingFavorite(null);
          
          // Use modal instead of notification
          if (film) {
            setFavoriteModalData({
              film,
              action: 'add'
            });
            setFavoriteModalVisible(true);
          } else {
            notification.open({
              message: 'Added to Favorites',
              description: 'Anime was successfully added to your favorites list!',
              placement: 'top',
              duration: 6,
              className: 'favorite-success-notification',
              style: { 
                backgroundColor: '#52c41a',
                border: '1px solid #b7eb8f',
                zIndex: 9999,
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              },
              icon: <CheckCircleFilled style={{ color: 'white' }} />
            });
          }
        } else {
          throw new Error('Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      notification.open({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update favorites',
        placement: 'topRight'
      });
      setLoadingFavorite(null); // Clear loading state in case of error
    }
  };

  // Function to confirm remove favorite
  const confirmRemoveFavorite = async () => {
    if (!filmToRemove.id) return;
    
    try {
      const token = localStorage.getItem('token');
      
      // Remove from favorites
      const response = await fetch(`http://localhost:2000/favorites/${filmToRemove.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Update local state
        setFavorites(favorites.filter(id => id !== filmToRemove.id));
        
        // Close confirmation modal
        setConfirmRemoveModalVisible(false);
        
        if (filmToRemove.film) {
          // Show removal success modal
          setFavoriteModalData({
            film: filmToRemove.film,
            action: 'remove'
          });
          setFavoriteModalVisible(true);
        } else {
          notification.open({
            message: 'Success',
            description: 'Removed from favorites',
            placement: 'topRight',
            duration: 2
          });
        }
      } else {
        throw new Error('Failed to remove from favorites');
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      notification.open({
        message: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove from favorites',
        placement: 'topRight'
      });
    }
  };

  // Function to fetch user favorites
  const fetchUserFavorites = async (token: string) => {
    try {
      // Get userId from localStorage
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.log('No user ID available, attempting to fetch from profile first');
        await fetchUserProfile(token);
        // Try again after fetching profile
        const newUserId = localStorage.getItem('userId');
        if (!newUserId) {
          console.log('Still no user ID available, cannot fetch favorites');
          return;
        }
      }

      const currentUserId = localStorage.getItem('userId');
      console.log('Fetching favorites for user ID:', currentUserId);
      
      const response = await fetch(`http://localhost:2000/favorites/user/${currentUserId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch favorites: ${response.status}`);
      }

      const data = await response.json();
      console.log('Favorites data:', data);
      
      // Extract movie IDs from favorites data
      const favoriteIds = data.map((fav: any) => fav.movieId || fav._id);
      setFavorites(favoriteIds);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      // If API fails, initialize with empty array
      setFavorites([]);
    }
  };

  // Function to fetch films from API
  const fetchFilms = async () => {
    try {
      setLoading(true);

      // Replace with your actual API endpoint
      const response = await fetch('http://localhost:2000/movies');

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Process the data
      setFilms(data);

      // Set hero films from the first 3 items with the most complete data
      const heroData = data.slice(0, 3).map((film: Film) => ({
        title: film.name,
        category: film.category || 'Adventure',
        description: film.description || 'Experience the adventure of a lifetime...',
        image: film.image.startsWith('http')
          ? film.image
          : `/xemphimhay/img/hero/hero-1.jpg` // Fallback image
      }));

      setHeroFilms(heroData);
      setError(null);
    } catch (err) {
      console.error('Error fetching films:', err);
      setError('Failed to load films. Please try again later.');

      // Use mock data as fallback if API fails
      const mockFilms: Film[] = [
        { _id: '1', name: 'Fate / Stay Night: Unlimited Blade Works', image: 'details-pic.jpg', category: 'Fantasy', views: 54200, rating: 4.8 },
        { _id: '2', name: 'Attack on Titan', image: 'trending-1.jpg', category: 'Action', views: 78100, rating: 4.9 },
        { _id: '3', name: 'One Punch Man', image: 'trending-2.jpg', category: 'Comedy', views: 63500, rating: 4.7 },
        { _id: '4', name: 'Demon Slayer', image: 'trending-3.jpg', category: 'Adventure', views: 89300, rating: 4.9 },
        { _id: '5', name: 'My Hero Academia', image: 'trending-4.jpg', category: 'Action', views: 67800, rating: 4.6 },
        { _id: '6', name: 'Jujutsu Kaisen', image: 'trending-5.jpg', category: 'Action', views: 72400, rating: 4.8 },
      ];

      setFilms(mockFilms);

      // Set hero films from mock data
      const mockHeroItems: HeroItem[] = [
        {
          title: 'Fate / Stay Night: Unlimited Blade Works',
          category: 'Adventure',
          description: 'After 30 days of travel across the world...',
          image: '/xemphimhay/img/hero/hero-1.jpg'
        },
        {
          title: 'Demon Slayer: Kimetsu no Yaiba',
          category: 'Action',
          description: 'Tanjiro sets out to become a demon slayer to avenge his family...',
          image: '/xemphimhay/img/hero/hero-1.jpg'
        },
        {
          title: 'Attack on Titan: Final Season',
          category: 'Drama',
          description: 'The war for Paradis zeroes in on Shiganshina...',
          image: '/xemphimhay/img/hero/hero-1.jpg'
        }
      ];

      setHeroFilms(mockHeroItems);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch top viewed films
  const fetchTopViewedFilms = async () => {
    try {
      // Call the NestJS endpoint directly using the controller's "top" endpoint
      console.log('Fetching top viewed films...');
      const response = await fetch('http://localhost:2000/movies/top?limit=5');
      
      if (!response.ok) {
        console.error(`API error: ${response.status}`);
        // Fallback to empty array on error
        setTopViewedFilms([]);
        return;
      }
      
      // Get response as text first to check if it's valid
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        console.error('Received empty response from top viewed films API');
        setTopViewedFilms([]);
        return;
      }
      
      try {
        // Parse the text as JSON
        const data = JSON.parse(text);
        console.log('Top viewed films:', data);
        
        if (Array.isArray(data)) {
          setTopViewedFilms(data);
        } else {
          console.error('API returned non-array data for top viewed films');
          setTopViewedFilms([]);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        setTopViewedFilms([]);
      }
    } catch (err) {
      console.error('Error fetching top viewed films:', err);
      // Unable to fetch top viewed films
      setTopViewedFilms([]);
    }
  };

  // Handle image URL to ensure it works with both local and external images
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
      label: <Link href="/profile">My Profile</Link>,
    },
    {
      key: 'settings',
      label: <Link href="/settings">Settings</Link>,
    },
    {
      key: 'logout',
      label: <span>Logout</span>,
      onClick: handleLogout,
    },
  ];

  // Function to handle rating a film
  const handleRateFilm = async (filmId: string, value: number) => {
    if (!isLoggedIn) {
      // Find the film data to display in the login required modal
      const film = films.find(f => f._id === filmId);
      if (film) {
        setSelectedFilm(film);
        setLoginRequiredModalVisible(true);
      } else {
        notification.open({
          message: 'Login Required',
          description: 'Please log in to rate movies.',
          placement: 'topRight'
        });
      }
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
    
    // Set loading state for this film's rating
    setRatingFilm(filmId);
    
    try {
      console.log(`Submitting rating ${value} for film ${filmId} by user ${userId}`);
      
      const response = await fetch('http://localhost:2000/movies/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          movieId: filmId,
          rating: value,
          userId: userId
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to rate movie');
      }
      
      const data = await response.json();
      console.log('Rating response:', data);
      
      if (data.success) {
        // Get the current film from state to calculate appropriate updates
        const currentFilm = films.find(f => f._id === filmId);
        
        // Determine new rating and count values
        const newRating = data.rating !== undefined ? data.rating : (currentFilm?.rating || 0);
        const newRatingCount = data.ratingCount !== undefined ? data.ratingCount : ((currentFilm?.ratingCount || 0) + 1);
        
        console.log(`Updating film rating from ${currentFilm?.rating} to ${newRating}, count from ${currentFilm?.ratingCount || 0} to ${newRatingCount}`);
        
        // Update films array with new rating
        setFilms(prev => 
          prev.map(film => 
            film._id === filmId 
              ? { 
                  ...film, 
                  userRating: value, // Store user's rating
                  rating: newRating, // Update average rating
                  ratingCount: newRatingCount // Update rating count
                } 
              : film
          )
        );
        
        // Also update top viewed films if this film is there
        setTopViewedFilms(prev => 
          prev.map(film => 
            film._id === filmId 
              ? { 
                  ...film, 
                  userRating: value,
                  rating: newRating,
                  ratingCount: newRatingCount
                } 
              : film
          )
        );
        
        notification.success({
          message: 'Rating Submitted',
          description: 'Thank you for rating this film!',
          placement: 'topRight',
          duration: 3
        });
      } else {
        throw new Error(data.message || 'Failed to rate film');
      }
    } catch (error) {
      console.error('Error rating film:', error);
      notification.error({
        message: 'Rating Failed',
        description: error instanceof Error ? error.message : 'Failed to submit rating',
        placement: 'topRight',
        duration: 3
      });
    } finally {
      setRatingFilm(null);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <Head>
        <title>Anime - Next.js</title>
        <meta name="description" content="Anime streaming platform built with Next.js" />
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
          {filmToRemove.film && (
            <div className="w-20 h-20 mx-auto sm:mx-0 sm:mr-4 mb-4 sm:mb-0 overflow-hidden rounded">
              <img 
                src={getImageUrl(filmToRemove.film.image)} 
                alt={filmToRemove.film.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold mb-1">
              {filmToRemove.film ? filmToRemove.film.name : 'This anime'}
            </h3>
            <p>Are you sure you want to remove this anime from your favorites?</p>
            <p className="mt-2">This action cannot be undone.</p>
          </div>
        </div>
      </Modal>

      <main>
        {/* Hero Section */}
        <section className="py-8 bg-gray-900">
          <div className="container mx-auto px-4">
            {loading ? (
              <div className="flex justify-center items-center h-96">
                <Spin size="large" />
              </div>
            ) : (
              <Carousel autoplay className="hero-carousel">
                {heroFilms.map((item, index) => (
                  <div key={index} className="relative h-96">
                    <div className="absolute inset-0 bg-black opacity-70 z-10"></div>
                    <div
                      className="absolute inset-0 bg-cover bg-center z-0"
                      style={{ backgroundImage: `url(${item.image})` }}
                    ></div>
                    <div className="relative z-20 h-full flex items-center">
                      <div className="container mx-auto px-4">
                        <div className="md:w-1/2">
                          <span className="inline-block px-4 py-1 bg-red-500 text-white text-sm mb-4">
                            {item.category}
                          </span>
                          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{item.title}</h2>
                          <p className="text-gray-300 mb-6">{item.description}</p>
                          <Link
                            href="#"
                            className="inline-flex items-center px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-sm transition"
                          >
                            <span>Watch Now</span>
                            <RightOutlined className="ml-2" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Carousel>
            )}
          </div>
        </section>

        {/* Product Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Row gutter={24}>
              <Col lg={16} md={24}>
                <div className="mb-12">
                  <div className="flex justify-between items-center mb-6">
                    <Title level={4} style={{ color: 'white', margin: 0 }}>Popular Anime</Title>
                    <Link href="/all-anime" className="text-red-500 hover:text-red-600 flex items-center">
                      View All <RightOutlined className="ml-1" />
                    </Link>
                  </div>
                  {error && (
                    <div className="bg-red-500 bg-opacity-20 border border-red-500 text-white p-4 mb-6 rounded">
                      {error}
                    </div>
                  )}
                  <Row gutter={[16, 24]}>
                    {loading ? (
                      // Loading placeholders
                      Array(6).fill(null).map((_, index) => (
                        <Col lg={8} md={12} sm={12} xs={12} key={index}>
                          <Card
                            loading={true}
                            className="anime-card"
                            style={{ backgroundColor: '#1F2937', borderColor: '#374151', height: '16rem' }}
                          />
                        </Col>
                      ))
                    ) : (
                      // Actual content
                      films.map(film => (
                        <Col lg={8} md={12} sm={12} xs={12} key={film._id}>
                          <Link href={`/detail?id=${film._id}`}>
                            <Card
                              hoverable
                              className="overflow-hidden anime-card"
                              style={{ backgroundColor: '#1F2937', borderColor: '#374151' }}
                              cover={
                                <div className="relative">
                                  <div
                                    className="h-48 bg-cover bg-center"
                                    style={{ backgroundImage: `url(${getImageUrl(film.image)})` }}
                                  ></div>
                                  {/* Category badge */}
                                  {film.category && (
                                    <div 
                                      className="category-badge"
                                    >
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
                                  {/* Heart icon on the left - now matches profile page style */}
                                  <div 
                                    className="absolute bottom-2 left-2 favorite-btn"
                                    onClick={(e) => toggleFavorite(e, film._id)}
                                  >
                                    <Button
                                      type="primary"
                                      danger={favorites.includes(film._id)}
                                      icon={favorites.includes(film._id) ? 
                                        (loadingFavorite === film._id ? <LoadingOutlined /> : <HeartFilled />) : 
                                        (loadingFavorite === film._id ? <LoadingOutlined /> : <HeartOutlined />)}
                                      className="rounded-full heart-btn"
                                      style={{
                                        backgroundColor: favorites.includes(film._id) ? '#EF4444' : 'rgba(0, 0, 0, 0.7)',
                                        borderColor: favorites.includes(film._id) ? '#EF4444' : 'transparent'
                                      }}
                                    />
                                  </div>
                                  {/* Rating badge - on the right */}
                                  <div className="rating-badge" title={`${film.rating?.toFixed(1) || '0.0'}/5 from ${film.ratingCount || 0} ratings`}>
                                    <StarOutlined className="star-icon" />
                                    <span>{film.rating?.toFixed(1) || '0.0'}</span>
                                    <span className="text-xs ml-1">
                                      ({film.ratingCount ? (film.ratingCount > 999 ? `${(film.ratingCount / 1000).toFixed(1)}k` : film.ratingCount) : '0'})
                                    </span>
                                  </div>
                                </div>
                              }
                            >
                              <Card.Meta
                                title={<span style={{ color: 'white' }}>{film.name}</span>}
                                className="text-center"
                                description={
                                  <div>
                                    <div className="flex justify-between items-center mt-1" style={{ color: '#9CA3AF' }}>
                                      <span>{film.category || 'Action'}</span>
                                      {film.views && (
                                        <span className="flex items-center">
                                          <EyeOutlined style={{ marginRight: '4px' }} /> {film.views.toLocaleString()}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Add rating component with hover effect
                                    <div className="mt-2 text-center" onClick={(e) => e.stopPropagation()}>
                                      <Rate 
                                        value={film.userRating || 0}
                                        onChange={(value) => handleRateFilm(film._id, value)}
                                        allowHalf
                                        disabled={ratingFilm === film._id}
                                        className="custom-rate home-rate"
                                        style={{ fontSize: '14px' }}
                                        tooltips={['Poor', 'Fair', 'Good', 'Very Good', 'Excellent']}
                                      />
                                      {ratingFilm === film._id && <LoadingOutlined className="ml-1" />}
                                      {film.userRating && (
                                        <div className="text-xs text-gray-400 mt-1">
                                          Your rating: {film.userRating}
                                        </div>
                                      )}
                                    </div> */}
                                  </div>
                                }
                              />
                            </Card>
                          </Link>
                        </Col>
                      ))
                    )}
                  </Row>
                </div>
              </Col>

              <Col lg={8} md={24}>
                <div className="p-4 rounded topview-section" style={{ backgroundColor: '#1F2937' }}>
                  <Title level={5} style={{ color: 'white', marginBottom: '1rem' }}>Top Views</Title>
                  <Tabs 
                    defaultActiveKey="all" 
                    className="text-gray-300"
                    items={[
                      {
                        key: 'all',
                        label: 'All Time',
                        children: (
                          <List
                            itemLayout="horizontal"
                            dataSource={topViewedFilms}
                            renderItem={item => (
                              <List.Item className="py-2" style={{ borderBottom: '1px solid #374151' }}>
                                <div className="relative w-full">
                                  <div
                                    className="h-32 w-full bg-cover bg-center rounded"
                                    style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}
                                  >
                                    {item.episode && (
                                      <div className="episode-badge">
                                        {item.episode}
                                      </div>
                                    )}
                                    <div className="views-badge">
                                      <EyeOutlined className="view-icon" /> {item.views?.toLocaleString() || '0'}
                                    </div>
                                  </div>
                                  <h5 className="text-white mt-2 hover:text-red-500">
                                    <Link href={`/detail?id=${item._id}`} style={{ color: 'white' }} className="hover:text-red-500">{item.name}</Link>
                                  </h5>
                                </div>
                              </List.Item>
                            )}
                          />
                        )
                      },
                      {
                        key: 'week',
                        label: 'Week',
                        children: (
                          <List
                            itemLayout="horizontal"
                            dataSource={topViewedFilms.slice(0, 3)} // Just showing first 3 for weekly
                            renderItem={item => (
                              <List.Item className="py-2" style={{ borderBottom: '1px solid #374151' }}>
                                <div className="relative w-full">
                                  <div
                                    className="h-32 w-full bg-cover bg-center rounded"
                                    style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}
                                  >
                                    {item.episode && (
                                      <div className="episode-badge">
                                        {item.episode}
                                      </div>
                                    )}
                                    <div className="views-badge">
                                      <EyeOutlined className="view-icon" /> {item.views?.toLocaleString() || '0'}
                                    </div>
                                  </div>
                                  <h5 className="text-white mt-2 hover:text-red-500">
                                    <Link href={`/detail?id=${item._id}`} style={{ color: 'white' }} className="hover:text-red-500">{item.name}</Link>
                                  </h5>
                                </div>
                              </List.Item>
                            )}
                          />
                        )
                      },
                      {
                        key: 'month',
                        label: 'Month',
                        children: (
                          <List
                            itemLayout="horizontal"
                            dataSource={topViewedFilms.slice(0, 3)} // Just showing first 3 for monthly
                            renderItem={item => (
                              <List.Item className="py-2" style={{ borderBottom: '1px solid #374151' }}>
                                <div className="relative w-full">
                                  <div
                                    className="h-32 w-full bg-cover bg-center rounded"
                                    style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}
                                  >
                                    {item.episode && (
                                      <div className="episode-badge">
                                        {item.episode}
                                      </div>
                                    )}
                                    <div className="views-badge">
                                      <EyeOutlined className="view-icon" /> {item.views?.toLocaleString() || '0'}
                                    </div>
                                  </div>
                                  <h5 className="text-white mt-2 hover:text-red-500">
                                    <Link href={`/detail?id=${item._id}`} style={{ color: 'white' }} className="hover:text-red-500">{item.name}</Link>
                                  </h5>
                                </div>
                              </List.Item>
                            )}
                          />
                        )
                      },
                      {
                        key: 'years',
                        label: 'Years',
                        children: (
                          <List
                            itemLayout="horizontal"
                            dataSource={topViewedFilms.slice(0, 3)} // Just showing first 3 for yearly
                            renderItem={item => (
                              <List.Item className="py-2" style={{ borderBottom: '1px solid #374151' }}>
                                <div className="relative w-full">
                                  <div
                                    className="h-32 w-full bg-cover bg-center rounded"
                                    style={{ backgroundImage: `url(${getImageUrl(item.image)})` }}
                                  >
                                    {item.episode && (
                                      <div className="episode-badge">
                                        {item.episode}
                                      </div>
                                    )}
                                    <div className="views-badge">
                                      <EyeOutlined className="view-icon" /> {item.views?.toLocaleString() || '0'}
                                    </div>
                                  </div>
                                  <h5 className="text-white mt-2 hover:text-red-500">
                                    <Link href={`/detail?id=${item._id}`} style={{ color: 'white' }} className="hover:text-red-500">{item.name}</Link>
                                  </h5>
                                </div>
                              </List.Item>
                            )}
                          />
                        )
                      }
                    ]}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </section>
      </main>

      <style jsx global>{`
        /* Custom styles */
        .hero-carousel .slick-dots {
          bottom: 20px;
        }
        .hero-carousel .slick-dots li button:before {
          color: white;
        }
        .ant-tabs-tab:hover {
          color: #f56565;
        }
        .ant-tabs-tab {
          color: white !important; /* Make tab text white before clicking */
        }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #f56565 !important;
        }
        .ant-tabs-ink-bar {
          background: #f56565 !important;
        }
        .ant-list-item {
          border-color: #374151;
        }
        .ant-card-meta-title {
          color: #F3F4F6 !important;
        }
        .ant-dropdown-menu {
          background-color: #1F2937;
          border: 1px solid #374151;
        }
        .ant-dropdown-menu-item {
          color: #F3F4F6;
        }
        .ant-dropdown-menu-item:hover {
          background-color: #374151;
        }
        .ant-spin-dot-item {
          background-color: #EF4444;
        }
        .ant-card {
          background-color: #1F2937 !important;
          border-color: #374151 !important;
        }
        .ant-card-meta-description {
          color: #9CA3AF !important;
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
        }
        .ant-rate-star:not(:last-child) {
          margin-right: 4px;
        }
        .ant-rate-disabled .ant-rate-star {
          cursor: default;
        }
        .ant-rate-star-first, .ant-rate-star-second {
          color: #FBBF24;
        }
        .ant-rate-star-half .ant-rate-star-first, .ant-rate-star-full .ant-rate-star-second {
          color: #FBBF24;
        }
        .rating-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 2px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          min-width: 60px; /* Ensure enough space for count */
          z-index: 5;
        }
        .rating-badge .star-icon {
          color: #FBBF24;
          margin-right: 4px;
          flex-shrink: 0;
        }
        .rating-badge span {
          color: #FBBF24;
          font-weight: bold;
          white-space: nowrap;
        }
        .rating-badge .text-xs {
          font-size: 0.75rem;
          color: #D1D5DB;
          font-weight: normal;
        }
        
        /* Heart button styles */
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
        .anime-card:hover .favorite-btn .ant-btn {
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
        }
        
        /* Rating styles for home page */
        .home-rate {
          display: inline-flex !important;
        }
        
        .home-rate .ant-rate-star {
          margin-right: 4px;
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
        
        /* Ensure rating count is always visible */
        .rating-badge span.text-xs {
          display: inline-block;
          font-size: 0.75rem;
          color: #D1D5DB;
          font-weight: normal;
          margin-left: 3px;
        }
        
        /* Style for the home page rating component */
        .home-rate {
          display: inline-flex !important;
        }
        
        /* Add tooltip style */
        .ant-tooltip-inner {
          background-color: #1F2937;
          color: white;
          border: 1px solid #374151;
          font-size: 12px;
        }
        
        /* Rating hover effect */
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
          background-color: #1F2937;
          border-radius: 4px;
          padding: 4px 8px;
          transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28);
          transform-origin: center bottom;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
};

export default Home;