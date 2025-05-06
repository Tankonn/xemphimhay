"use client";

// pages/index.tsx
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Carousel, Tabs, Card, Row, Col, Button, List, Typography, Spin, Dropdown, Menu } from 'antd';
import { RightOutlined, EyeOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons';
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
}

interface HeroItem {
  title: string;
  category: string;
  description: string;
  image: string;
}

interface TopViewItem {
  title: string;
  episode: string;
  views: string;
  image: string;
  categories: string[];
}

interface CommentItem {
  title: string;
  status: string;
  category: string;
  views: string;
  image: string;
}

const Home: NextPage = () => {
  const [films, setFilms] = useState<Film[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [heroFilms, setHeroFilms] = useState<HeroItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
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
    }

    // Fetch films from API
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
            : `/img/hero/hero-1.jpg` // Fallback image
        }));

        setHeroFilms(heroData);
        setError(null);
      } catch (err) {
        console.error('Error fetching films:', err);
        setError('Failed to load films. Please try again later.');

        // Use mock data as fallback if API fails
        const mockFilms: Film[] = [
          { _id: '1', name: 'Fate / Stay Night: Unlimited Blade Works', image: 'details-pic.jpg', category: 'Fantasy' },
          { _id: '2', name: 'Attack on Titan', image: 'trending-1.jpg', category: 'Action' },
          { _id: '3', name: 'One Punch Man', image: 'trending-2.jpg', category: 'Comedy' },
          { _id: '4', name: 'Demon Slayer', image: 'trending-3.jpg', category: 'Adventure' },
          { _id: '5', name: 'My Hero Academia', image: 'trending-4.jpg', category: 'Action' },
          { _id: '6', name: 'Jujutsu Kaisen', image: 'trending-5.jpg', category: 'Action' },
        ];

        setFilms(mockFilms);

        // Set hero films from mock data
        const mockHeroItems: HeroItem[] = [
          {
            title: 'Fate / Stay Night: Unlimited Blade Works',
            category: 'Adventure',
            description: 'After 30 days of travel across the world...',
            image: '/img/hero/hero-1.jpg'
          },
          {
            title: 'Demon Slayer: Kimetsu no Yaiba',
            category: 'Action',
            description: 'Tanjiro sets out to become a demon slayer to avenge his family...',
            image: '/img/hero/hero-1.jpg'
          },
          {
            title: 'Attack on Titan: Final Season',
            category: 'Drama',
            description: 'The war for Paradis zeroes in on Shiganshina...',
            image: '/img/hero/hero-1.jpg'
          }
        ];

        setHeroFilms(mockHeroItems);
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
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
    // router.push('/login');
  };

  // Mocked data for other sections - in a real app, these would also come from the API
  const topViewItems: TopViewItem[] = [
    {
      title: 'Boruto: Naruto next generations',
      episode: '18 / ?',
      views: '9141',
      image: '/img/sidebar/tv-1.jpg',
      categories: ['day', 'years']
    },
    {
      title: 'The Seven Deadly Sins: Wrath of the Gods',
      episode: '18 / ?',
      views: '9141',
      image: '/img/sidebar/tv-2.jpg',
      categories: ['month', 'week']
    },
    {
      title: 'Sword art online alicization war of underworld',
      episode: '18 / ?',
      views: '9141',
      image: '/img/sidebar/tv-3.jpg',
      categories: ['week', 'years']
    },
    {
      title: 'Fate/stay night: Heaven\'s Feel I. presage flower',
      episode: '18 / ?',
      views: '9141',
      image: '/img/sidebar/tv-4.jpg',
      categories: ['years', 'month']
    },
    {
      title: 'Fate stay night unlimited blade works',
      episode: '18 / ?',
      views: '9141',
      image: '/img/sidebar/tv-5.jpg',
      categories: ['day']
    }
  ];

  const commentItems: CommentItem[] = [
    {
      title: 'The Seven Deadly Sins: Wrath of the Gods',
      status: 'Active',
      category: 'Movie',
      views: '19,141',
      image: '/img/sidebar/comment-1.jpg'
    },
    {
      title: 'Shirogane Tamashii hen Kouhan sen',
      status: 'Active',
      category: 'Movie',
      views: '19,141',
      image: '/img/sidebar/comment-2.jpg'
    },
    {
      title: 'Kizumonogatari III: Reiket su-hen',
      status: 'Active',
      category: 'Movie',
      views: '19,141',
      image: '/img/sidebar/comment-3.jpg'
    },
    {
      title: 'Monogatari Series: Second Season',
      status: 'Active',
      category: 'Movie',
      views: '19,141',
      image: '/img/sidebar/comment-4.jpg'
    }
  ];

  // Handle image URL to ensure it works with both local and external images
  const getImageUrl = (image: string) => {
    if (image.startsWith('http')) {
      return image;
    } else {
      return `/img/anime/${image}`;
    }
  };

  // User dropdown menu items
  const userMenu = (
    <Menu>
      <Menu.Item key="profile">
        <Link href="/profile">My Profile</Link>
      </Menu.Item>
      <Menu.Item key="settings">
        <Link href="/settings">Settings</Link>
      </Menu.Item>
      <Menu.Item key="logout" onClick={handleLogout}>
        <span>Logout</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <div className="bg-gray-900 text-gray-200 min-h-screen">
      <Head>
        <title>Anime - Next.js</title>
        <meta name="description" content="Anime streaming platform built with Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="text-red-500 font-bold text-2xl">
                ANIME
              </Link>
              <nav className="hidden md:flex ml-8">
                <Link href="/" className="text-white hover:text-red-500 px-4 py-2">
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
                  <Dropdown overlay={userMenu} placement="bottomRight">
                    <Button
                      type="text"
                      className="text-white hover:text-white flex items-center"
                    >
                      <UserOutlined className="mr-1" /> {username || 'User'}
                    </Button>
                  </Dropdown>
                  <Button
                    type="primary"
                    className="ml-4 bg-red-500 hover:bg-red-600 border-none flex items-center"
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
                    className="ml-4 bg-red-500 hover:bg-red-600 border-none"
                    onClick={() => router.push('/login')}>
                    Sign In
                  </Button>
                  <Button
                    type="primary"
                    className="ml-4 bg-red-500 hover:bg-red-600 border-none"
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
                    <Title level={4} className="text-white m-0">Popular Anime</Title>
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
                        <Col lg={8} md={12} sm={12} xs={24} key={index}>
                          <Card
                            loading={true}
                            className="bg-gray-800 border-gray-700 h-64"
                          />
                        </Col>
                      ))
                    ) : (
                      // Actual content
                      films.map(film => (
                        <Col lg={8} md={12} sm={12} xs={24} key={film._id}>
                          <Link href={`/detail?id=${film._id}`}>
                            <Card
                              hoverable
                              className="bg-gray-800 border-gray-700 overflow-hidden anime-card"
                              cover={
                                <div
                                  className="h-48 bg-cover bg-center"
                                  style={{ backgroundImage: `url(${getImageUrl(film.image)})` }}
                                ></div>
                              }
                            >
                              <Card.Meta
                                title={<span className="text-red-500">{film.name}</span>}
                                className="text-center"
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
                <div className="bg-gray-800 p-4 mb-8 rounded">
                  <Title level={5} className="text-white mb-4">Top Views</Title>
                  <Tabs defaultActiveKey="day" className="text-gray-300">
                    <TabPane tab="Day" key="day">
                      <List
                        itemLayout="horizontal"
                        dataSource={topViewItems.filter(item => item.categories.includes('day'))}
                        renderItem={item => (
                          <List.Item className="border-b border-gray-700 py-2">
                            <div className="relative w-full">
                              <div
                                className="h-32 w-full bg-cover bg-center rounded"
                                style={{ backgroundImage: `url(${item.image})` }}
                              >
                                <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-xs">
                                  {item.episode}
                                </div>
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 text-xs flex items-center">
                                  <EyeOutlined className="mr-1" /> {item.views}
                                </div>
                              </div>
                              <h5 className="text-white mt-2 hover:text-red-500">
                                <Link href="#">{item.title}</Link>
                              </h5>
                            </div>
                          </List.Item>
                        )}
                      />
                    </TabPane>
                    {/* Other tab panes remain the same */}
                    <TabPane tab="Week" key="week">
                      <List
                        itemLayout="horizontal"
                        dataSource={topViewItems.filter(item => item.categories.includes('week'))}
                        renderItem={item => (
                          <List.Item className="border-b border-gray-700 py-2">
                            <div className="relative w-full">
                              <div
                                className="h-32 w-full bg-cover bg-center rounded"
                                style={{ backgroundImage: `url(${item.image})` }}
                              >
                                <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-xs">
                                  {item.episode}
                                </div>
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 text-xs flex items-center">
                                  <EyeOutlined className="mr-1" /> {item.views}
                                </div>
                              </div>
                              <h5 className="text-white mt-2 hover:text-red-500">
                                <Link href="#">{item.title}</Link>
                              </h5>
                            </div>
                          </List.Item>
                        )}
                      />
                    </TabPane>
                    <TabPane tab="Month" key="month">
                      <List
                        itemLayout="horizontal"
                        dataSource={topViewItems.filter(item => item.categories.includes('month'))}
                        renderItem={item => (
                          <List.Item className="border-b border-gray-700 py-2">
                            <div className="relative w-full">
                              <div
                                className="h-32 w-full bg-cover bg-center rounded"
                                style={{ backgroundImage: `url(${item.image})` }}
                              >
                                <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-xs">
                                  {item.episode}
                                </div>
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 text-xs flex items-center">
                                  <EyeOutlined className="mr-1" /> {item.views}
                                </div>
                              </div>
                              <h5 className="text-white mt-2 hover:text-red-500">
                                <Link href="#">{item.title}</Link>
                              </h5>
                            </div>
                          </List.Item>
                        )}
                      />
                    </TabPane>
                    <TabPane tab="Years" key="years">
                      <List
                        itemLayout="horizontal"
                        dataSource={topViewItems.filter(item => item.categories.includes('years'))}
                        renderItem={item => (
                          <List.Item className="border-b border-gray-700 py-2">
                            <div className="relative w-full">
                              <div
                                className="h-32 w-full bg-cover bg-center rounded"
                                style={{ backgroundImage: `url(${item.image})` }}
                              >
                                <div className="absolute top-2 left-2 bg-black bg-opacity-70 px-2 py-1 text-xs">
                                  {item.episode}
                                </div>
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 px-2 py-1 text-xs flex items-center">
                                  <EyeOutlined className="mr-1" /> {item.views}
                                </div>
                              </div>
                              <h5 className="text-white mt-2 hover:text-red-500">
                                <Link href="#">{item.title}</Link>
                              </h5>
                            </div>
                          </List.Item>
                        )}
                      />
                    </TabPane>
                  </Tabs>
                </div>

                <div className="bg-gray-800 p-4 rounded">
                  <Title level={5} className="text-white mb-4">New Comments</Title>
                  <List
                    itemLayout="horizontal"
                    dataSource={commentItems}
                    renderItem={item => (
                      <List.Item className="border-b border-gray-700 py-3">
                        <List.Item.Meta
                          avatar={
                            <div className="w-16 h-16 overflow-hidden rounded">
                              <div
                                className="h-full w-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${item.image})` }}
                              ></div>
                            </div>
                          }
                          title={
                            <div>
                              <div className="mb-1">
                                <span className="text-xs text-red-500 mr-2">{item.status}</span>
                                <span className="text-xs text-gray-400">{item.category}</span>
                              </div>
                              <Link href="#" className="text-white hover:text-red-500">
                                {item.title}
                              </Link>
                            </div>
                          }
                          description={
                            <div className="text-gray-400 flex items-center text-xs">
                              <EyeOutlined className="mr-1" /> {item.views} Views
                            </div>
                          }
                        />
                      </List.Item>
                    )}
                  />
                </div>
              </Col>
            </Row>
          </div>
        </section>
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
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.565 1.15.747.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
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
              <h5 className="text-white text-lg font-medium mb-4">Categories</h5>
              <nav className="flex flex-col space-y-2">
                <Link href="#" className="text-gray-400 hover:text-white">Action</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Adventure</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Comedy</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Drama</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Fantasy</Link>
              </nav>
            </div>
            <div>
              <h5 className="text-white text-lg font-medium mb-4">Quick Links</h5>
              <nav className="flex flex-col space-y-2">
                <Link href="#" className="text-gray-400 hover:text-white">About Us</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Blog</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Contact</Link>
                <Link href="#" className="text-gray-400 hover:text-white">FAQ</Link>
                <Link href="#" className="text-gray-400 hover:text-white">Privacy Policy</Link>
              </nav>
            </div>
            <div>
              <h5 className="text-white text-lg font-medium mb-4">Subscribe</h5>
              <p className="mb-4">Subscribe to our newsletter for latest updates</p>
              <form className="flex">
                <input
                  type="email"
                  placeholder="Email"
                  className="px-4 py-2 bg-gray-700 text-white rounded-l focus:outline-none w-full"
                />
                <button
                  type="submit"
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-r"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center">
            <p>© 2025 Anime. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        /* Custom styles */
        .hero-carousel .slick-dots {
          bottom: 20px;
        }
        .hero-carousel .slick-dots li button:before {
          color: white;
        }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #f56565 !important;
        }
        .ant-tabs-ink-bar {
          background: #f56565 !important;
        }
        .ant-tabs-tab:hover {
          color: #f56565;
        }
        .ant-list-item {
          border-color: #374151;
        }
      `}</style>
    </div>
  );
};

export default Home;