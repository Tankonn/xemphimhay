'use client'
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Modal, Form, Input, message, Avatar } from 'antd';
import { LogoutOutlined, UserOutlined, LoginOutlined, EditOutlined, UserAddOutlined, MailOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

interface UserProfile {
  username: string;
  email: string;
  bio?: string;
}

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [isEditModalVisible, setIsEditModalVisible] = useState<boolean>(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  // Memoize fetchUserProfile to use in useEffect
  const fetchUserProfile = useCallback(async (token: string) => {
    try {
      const response = await fetch('http://localhost:2000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsername(data.username || 'User');
        localStorage.setItem('username', data.username);
        if (data._id) {
          localStorage.setItem('userId', data._id);
        }
        form.setFieldsValue({
          username: data.username,
          email: data.email,
          bio: data.bio
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUsername('User');
    }
  }, [form]);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) {
        setUsername(storedUsername);
      } else {
        fetchUserProfile(token);
      }
    }
  }, [fetchUserProfile]);

  // Function to handle profile update
  const handleProfileUpdate = async (values: UserProfile) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Please login again');
        return;
      }

      const response = await fetch('http://localhost:2000/users/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          message.success('Profile updated successfully');
          // Clear user data
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userId');
          // Update state
          setIsLoggedIn(false);
          setUsername('');
          setIsEditModalVisible(false);
          // First reload the page
          window.location.href = '/login';
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Function to handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    router.push('/login');
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/home" className="text-red-500 font-bold text-2xl">
              ANIME
            </Link>
            <nav className="hidden md:flex ml-8 space-x-1">
              {/* <Link href="/home" className="text-white hover:text-red-500 px-4 py-2 rounded-md transition-colors duration-200">
                Home
              </Link>
              <Link href="/categories" className="text-gray-400 hover:text-red-500 px-4 py-2 rounded-md transition-colors duration-200">
                Categories
              </Link>
              <Link href="/blog" className="text-gray-400 hover:text-red-500 px-4 py-2 rounded-md transition-colors duration-200">
                Blog
              </Link>
              <Link href="/about" className="text-gray-400 hover:text-red-500 px-4 py-2 rounded-md transition-colors duration-200">
                About
              </Link> */}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <div className="relative group">
                  <Button
                    type="text"
                    className="flex items-center space-x-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-700 group-hover:border-red-500"
                  >
                    <Avatar 
                      icon={<UserOutlined />} 
                      className="bg-red-500 group-hover:scale-110 transition-transform"
                      size="small"
                    />
                    <span className="text-white font-medium group-hover:text-red-500 transition-colors">
                      {username || 'User'}
                    </span>
                    <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                  </Button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-red-500">
                        <UserOutlined className="mr-2" />
                        My Profile
                      </Link>
                      <button 
                        onClick={() => setIsEditModalVisible(true)} 
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 hover:text-red-500"
                      >
                        <EditOutlined className="mr-2" />
                        Edit Profile
                      </button>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-red-500 hover:text-white border-t border-gray-700"
                      >
                        <LogoutOutlined className="mr-2" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  type="text"
                  onClick={() => router.push('/login')}
                  className="flex items-center space-x-2 px-4 py-1.5 text-white hover:text-red-500 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all duration-200 border border-gray-700 hover:border-red-500"
                  icon={<LoginOutlined className="text-lg" />}
                >
                  <span>Sign In</span>
                </Button>
                <Button
                  type="text"
                  onClick={() => router.push('/register')}
                  className="flex items-center space-x-2 px-4 py-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-all duration-200 border-none shadow-md hover:shadow-lg hover:shadow-red-500/30"
                  icon={<UserAddOutlined className="text-lg" />}
                >
                  <span>Sign Up</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        className="edit-profile-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProfileUpdate}
          className="mt-4"
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea placeholder="Tell us about yourself..." rows={4} />
          </Form.Item>
          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setIsEditModalVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Save Changes
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <style jsx global>{`
        .edit-profile-modal .ant-modal-content {
          background-color: #1F2937;
          border: 1px solid #374151;
        }
        .edit-profile-modal .ant-modal-header {
          background-color: #1F2937;
          border-bottom: 1px solid #374151;
        }
        .edit-profile-modal .ant-modal-title {
          color: #F3F4F6;
        }
        .edit-profile-modal .ant-modal-close {
          color: #F3F4F6;
        }
        .edit-profile-modal .ant-form-item-label > label {
          color: #F3F4F6;
        }
        .edit-profile-modal .ant-input,
        .edit-profile-modal .ant-input-textarea {
          background-color: #374151;
          border-color: #4B5563;
          color: #F3F4F6;
        }
        .edit-profile-modal .ant-input:hover,
        .edit-profile-modal .ant-input:focus,
        .edit-profile-modal .ant-input-textarea:hover,
        .edit-profile-modal .ant-input-textarea:focus {
          border-color: #EF4444;
        }
        .edit-profile-modal .ant-btn-primary {
          background-color: #EF4444;
          border-color: #EF4444;
        }
        .edit-profile-modal .ant-btn-primary:hover {
          background-color: #DC2626;
          border-color: #DC2626;
        }
      `}</style>
    </header>
  );
};

export default Header; 