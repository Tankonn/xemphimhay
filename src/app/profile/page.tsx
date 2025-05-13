"use client";

// pages/profile.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Card, Row, Col, Button, List, Typography, Spin, Tabs, Avatar, Modal, Form, Input, notification } from 'antd';
import { UserOutlined, EditOutlined, StarOutlined, ClockCircleOutlined, HeartOutlined, HeartFilled, EyeOutlined, LogoutOutlined } from '@ant-design/icons';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';

const { TabPane } = Tabs;
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
  name: string;
  image: string;
  category?: string;
  description?: string;
  episode?: string;
  views?: number;
  isWatched?: boolean;
  isFavorite?: boolean;
  rating?: number;
}

const Profile: NextPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Film[]>([]);
  const [watchHistory, setWatchHistory] = useState<Film[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const router = useRouter();

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

      // Fetch favorite movies and watch history
      // Pass the userId explicitly instead of relying on user state
      await fetchFavorites(token, userId);
      await fetchWatchHistory(token);

      setError(null);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
      
      if (err instanceof Error && err.message.includes('Session expired')) {
        return; // Already handled by pushing to login
      }
      
      // Use mock data as fallback if API fails
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

      // Set mock favorites and watch history
      setMockData();
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
      setMockData(); // Fallback to mock data
    }
  };

  // Function to fetch watch history
  const fetchWatchHistory = async (token: string) => {
    try {
      const response = await fetch('http://localhost:2000/watch-history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setWatchHistory(data);
      } else {
        throw new Error('Failed to fetch watch history');
      }
    } catch (err) {
      console.error('Error fetching watch history:', err);
      // Will use mock data if this fails
    }
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
      { _id: '6', name: 'Tokyo Revengers', image: '/img/anime/recent-1.jpg', category: 'Action', isWatched: true, episode: 'S1:E24' },
      { _id: '7', name: 'Chainsaw Man', image: '/img/anime/recent-2.jpg', category: 'Supernatural', isWatched: true, episode: 'S1:E12' },
      { _id: '8', name: 'Spy x Family', image: '/img/anime/recent-3.jpg', category: 'Comedy', isWatched: true, episode: 'S1:E25' },
      { _id: '4', name: 'Jujutsu Kaisen', image: '/img/anime/trending-4.jpg', category: 'Supernatural', isWatched: true, episode: 'S2:E8' },
      { _id: '9', name: 'Vinland Saga', image: '/img/anime/recent-4.jpg', category: 'Historical', isWatched: true, episode: 'S2:E12' },
      { _id: '10', name: 'Blue Lock', image: '/img/anime/recent-5.jpg', category: 'Sports', isWatched: true, episode: 'S1:E15' },
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
    router.push('/');
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
      const token = localStorage.getItem('token');
      if (!token) {
        notification.error({
          message: 'Authentication Error',
          description: 'Please log in to add favorites.',
          placement: 'topRight',
          duration: 3
        });
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
        return;
      }

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
      
      notification.success({
        message: 'Success',
        description: 'Added to favorites successfully!',
        placement: 'topRight',
        duration: 2
      });
    } catch (err) {
      console.error('Error adding to favorites:', err);
      notification.error({
        message: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add to favorites',
        placement: 'topRight',
        duration: 3
      });
    }
  };

  // Function to remove a film from favorites
  const handleRemoveFavorite = async (filmId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        notification.error({
          message: 'Authentication Error',
          description: 'Please log in to manage favorites.',
          placement: 'topRight',
          duration: 3
        });
        return;
      }

      const response = await fetch(`http://localhost:2000/favorites/${filmId}`, {
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
      setFavorites(favorites.filter(fav => fav._id !== filmId));
      
      // Update favorite count
      setUser(prev => {
        if (!prev) return null;
        return {
          ...prev,
          favoriteCount: prev.favoriteCount - 1
        };
      });

      notification.success({
        message: 'Success',
        description: 'Removed from favorites successfully!',
        placement: 'topRight',
        duration: 2
      });
    } catch (err) {
      console.error('Error removing from favorites:', err);
      notification.error({
        message: 'Error',
        description: err instanceof Error ? err.message : 'Failed to remove from favorites',
        placement: 'topRight',
        duration: 3
      });
    }
  };

  // Function to get image URL
  const getImageUrl = (image: string) => {
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

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <Head>
        <title>My Profile - Anime</title>
        <meta name="description" content="User profile and favorite anime" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/home" className="text-red-500 font-bold text-2xl">
                ANIME
              </Link>
              <nav className="hidden md:flex ml-8">
                <Link href="/home" className="text-gray-400 hover:text-red-500 px-4 py-2">
                  Home
                </Link>
                <Link href="/categories" className="text-gray-400 hover:text-red-500 px-4 py-2">
                  Categories
                </Link>
                <Link href="/blog" className="text-gray-400 hover:text-red-500 px-4 py-2">
                  Blog
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-red-500 px-4 py-2">
                  About
                </Link>
              </nav>
            </div>
            <div className="flex items-center">
              {isLoggedIn ? (
                <>
                  <Link href="/profile">
                    <Button
                      type="text"
                      style={{ color: 'white' }}
                      className="flex items-center"
                    >
                      <UserOutlined className="mr-1" /> {user?.username || 'User'}
                    </Button>
                  </Link>
                  <Button
                    type="primary"
                    className="ml-4 flex items-center"
                    style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                    onClick={handleLogout}
                    icon={<LogoutOutlined />}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    type="primary"
                    className="ml-4"
                    style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                    onClick={() => router.push('/login')}>
                    Sign In
                  </Button>
                  <Button
                    type="primary"
                    className="ml-4"
                    style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                    onClick={() => router.push('/register')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

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
                    <Col span={8} md={6}>
                      <div className="flex items-center">
                        <EyeOutlined style={{ color: '#EF4444', marginRight: '0.5rem' }} />
                        <div>
                          <Text style={{ color: '#9CA3AF', display: 'block' }}>Watched</Text>
                          <Text style={{ color: 'white' }}>{user?.watchedCount || 0} anime</Text>
                        </div>
                      </div>
                    </Col>
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
            <Tabs defaultActiveKey="favorites" className="profile-tabs">
              <TabPane tab={<span className="text-lg"><HeartFilled style={{ marginRight: '0.5rem' }} />Favorites</span>} key="favorites">
                {favorites.length === 0 ? (
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
                                    icon={<HeartOutlined />}
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
                                    icon={<HeartFilled />}
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
                                <div className="rating-badge">
                                  <StarOutlined className="star-icon" />
                                  <span>{film.rating.toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          }
                        >
                          <Link href={`/detail?id=${film._id}`}>
                            <Card.Meta
                              title={<span style={{ color: '#EF4444' }}>{film.name}</span>}
                              description={
                                <div style={{ color: '#9CA3AF' }} className="flex justify-between">
                                  <span>{film.category}</span>
                                  {film.views && (
                                    <span className="flex items-center">
                                      <EyeOutlined className="view-icon" /> {film.views.toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              }
                            />
                          </Link>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </TabPane>
              <TabPane tab={<span className="text-lg"><ClockCircleOutlined style={{ marginRight: '0.5rem' }} />Watch History</span>} key="history">
                {watchHistory.length === 0 ? (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <ClockCircleOutlined style={{ fontSize: '48px', color: '#4B5563', marginBottom: '1rem' }} />
                    <Title level={4} style={{ color: '#9CA3AF' }}>No watch history yet</Title>
                    <Paragraph style={{ color: '#6B7280' }}>
                      Start watching anime to build your history!
                    </Paragraph>
                    <Button
                      type="primary"
                      style={{ backgroundColor: '#EF4444', borderColor: '#EF4444', marginTop: '1rem' }}
                      onClick={() => router.push('/')}
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
                            <Link href={`/detail?id=${film._id}`} className="text-white hover:text-red-500">
                              {film.name}
                            </Link>
                          }
                          description={
                            <div style={{ color: '#9CA3AF' }}>
                              <div className="flex items-center">
                                <span className="mr-4">{film.category}</span>
                                {film.episode && (
                                  <span className="rounded text-xs" style={{ color: '#D1D5DB' }}>
                                    {film.episode}
                                  </span>
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
                          >
                            Resume
                          </Button>
                          {!favorites.some(fav => fav._id === film._id) ? (
                            <Button
                              icon={<HeartOutlined />}
                              style={{ backgroundColor: '#374151', borderColor: '#374151', color: 'white' }}
                              size="small"
                              onClick={() => handleAddToFavorites(film._id)}
                            >
                              Add to Favorites
                            </Button>
                          ) : (
                            <Button
                              icon={<HeartFilled />}
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
                )}
              </TabPane>
            </Tabs>

            {/* Edit Profile Modal */}
            <Modal
              title="Edit Profile"
              open={editModalVisible}
              onCancel={() => setEditModalVisible(false)}
              footer={null}
              className="profile-edit-modal"
            >
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
                initialValues={{
                  username: user?.username,
                  email: user?.email,
                  bio: user?.bio
                }}
              >
                <Form.Item
                  name="username"
                  label="Username"
                  rules={[{ required: true, message: 'Please enter your username' }]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Username" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input type="email" placeholder="Email" />
                </Form.Item>
                <Form.Item
                  name="bio"
                  label="Bio"
                >
                  <Input.TextArea rows={4} placeholder="Tell us about yourself and your anime preferences" />
                </Form.Item>
                <Form.Item>
                  <div className="flex justify-end space-x-2">
                    <Button onClick={() => setEditModalVisible(false)}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" style={{ backgroundColor: '#EF4444', borderColor: '#EF4444' }}>
                      Save Changes
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </Modal>
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-white text-lg font-medium mb-4">About Us</h5>
              <p className="mb-4">
                Anime website with popular and trending anime from around the world.
                Discover your next favorite series!
              </p>
              <div className="flex space-x-2">
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.24 2.013 9.584 2 12 2s2.784.013 3.808.06c1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772 4.902 4.902 0 011.772-1.153c.636-.247 1.363-.416 2.427-.465C9.24 2.013 9.584 2 12 2z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="#" className="text-gray-400 hover:text-white">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
              </div>
            </div>
            <div>
              <h5 className="text-white text-lg font-medium mb-4">Quick Links</h5>
              <ul className="space-y-2">
                <li><Link href="/home" className="hover:text-white">Home</Link></li>
                <li><Link href="/categories" className="hover:text-white">Categories</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white text-lg font-medium mb-4">Categories</h5>
              <ul className="space-y-2">
                <li><Link href="/categories/action" className="hover:text-white">Action</Link></li>
                <li><Link href="/categories/romance" className="hover:text-white">Romance</Link></li>
                <li><Link href="/categories/comedy" className="hover:text-white">Comedy</Link></li>
                <li><Link href="/categories/fantasy" className="hover:text-white">Fantasy</Link></li>
              </ul>
            </div>
            <div>
              <h5 className="text-white text-lg font-medium mb-4">Contact</h5>
              <ul className="space-y-2">
                <li>Email: info@animehub.com</li>
                <li>Phone: (555) 123-4567</li>
                <li>Address: 123 Anime Street</li>
                <li>Tokyo, Japan 100-0001</li>
              </ul>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #374151', marginTop: '2rem', paddingTop: '2rem' }} className="text-center">
            <p>&copy; {new Date().getFullYear()} AnimeHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* Custom styles */
        .profile-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #EF4444 !important;
        }
        .profile-tabs .ant-tabs-ink-bar {
          background: #EF4444 !important;
        }
        .profile-tabs .ant-tabs-tab:hover {
          color: #EF4444;
        }
        .profile-edit-modal .ant-modal-content {
          background-color: #1F2937;
          color: white;
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
        .favorite-card .ant-card-meta-title {
          color: #F3F4F6;
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
          background-color: rgba(0, 0, 0, 0.7);
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
        
        /* Rating badge */
        .rating-badge {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background-color: rgba(0, 0, 0, 0.7);
          padding: 2px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          z-index: 5;
        }
        .rating-badge .star-icon {
          color: #FBBF24;
        }
        .rating-badge span {
          color: #FBBF24;
          font-weight: bold;
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
      `}</style>
    </div>
  );
};

export default Profile;
                    