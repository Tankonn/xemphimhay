"use client";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface NavigationProps {
  isLoggedIn: boolean;
  username?: string;
  avatarUrl?: string;
}

const Navigation = ({ isLoggedIn, username, avatarUrl }: NavigationProps) => {
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/home/profile');
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-red-500 font-bold text-2xl">
            ANIME
          </Link>
          <Link href="/categories" className="text-gray-400 hover:text-red-500">
            Categories
          </Link>
          <Link href="/blog" className="text-gray-400 hover:text-red-500">
            Blog
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isLoggedIn ? (
            <Button
              type="text"
              className="text-white hover:text-red-500 flex items-center"
              onClick={handleProfileClick}
            >
              {avatarUrl ? (
                <Avatar src={avatarUrl} className="mr-2" />
              ) : (
                <UserOutlined className="mr-2" />
              )}
              {username || 'Profile'}
            </Button>
          ) : (
            <Button
              type="primary"
              className="bg-red-500 hover:bg-red-600 border-none"
              onClick={handleLoginClick}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 