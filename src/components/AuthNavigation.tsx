"use client";
import { useAuth } from '@/contexts/AuthContext';
import Navigation from './Navigation';
import { Spin } from 'antd';

const AuthNavigation = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-16 bg-gray-900">
        <Spin />
      </div>
    );
  }

  return (
    <Navigation
      isLoggedIn={!!user}
      username={user?.username}
      avatarUrl={user?.avatarUrl}
    />
  );
};

export default AuthNavigation; 