// pages/login.js
"use client";
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Form, Input, Button, message } from 'antd';
import { LoginOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';

import BaseButton from "@/components/BaseButton";
import 'antd/dist/reset.css';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Kiểm tra nếu username hoặc password bị bỏ trống
    if (!username) {
      setUsernameError('Tên đăng nhập không được để trống!');
      return;
    } else {
      setUsernameError('');
    }

    if (!password) {
      setPasswordError('Mật khẩu không được để trống!');
      return;
    } else {
      setPasswordError('');
    }

    try {
      const response = await fetch("http://localhost:2000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.access_token) {
        // Đăng nhập thành công
        localStorage.setItem("token", data.access_token);
        // alert("login susccess!");
        // message.success('Login successful!');
        router.push('/home');
      } else {
        alert('Username or password is incorrect!');
      }
    } catch (err) {
      console.error("Error:", err);
      message.error("have a error!");
    }
  };

  return (
    <>
    
      {/* Page Preloder */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden" id="preloder">
        <div className="w-16 h-16 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>

      {/* Login Section with Grid Layout */}
      <section className="h-screen bg-gray-900 text-white">
        <div className="grid grid-cols-1 md:grid-cols-2 h-full">
          {/* Left side - Banner Image */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0">
              <Image
                src="/xemphimhay/img/loginbanner.png" 
                alt="Anime Banner"
                layout="fill"
                objectFit="cover"
                priority
              />
              <div className="absolute inset-0  flex items-center justify-center">
                <div className="text-center px-8">
                  <h2 className="text-4xl font-bold text-black mb-4">Anime Blog</h2>
                  <p className="text-xl text-black">Welcome to the official Anime blog.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex items-center justify-center p-8">
            <div className="w-full max-w-md">
              <div className="p-8 bg-gray-800 rounded shadow-lg">
                <h3 className="text-2xl font-bold mb-6 text-center">Login</h3>
                <form onSubmit={handleSubmit} className="ant-form">
                  <div className="mb-6">
                  
                    <Input
                      size="large"
                      placeholder="Username"
                      prefix={<UserOutlined className="site-form-item-icon" />}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-gray-700 text-white border-gray-600"
                    />
                  </div>
                  <div className="mb-6">
                    <Input.Password
                      size="large"
                      placeholder="Password"
                      prefix={<LockOutlined className="site-form-item-icon" />}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-700 text-white border-gray-600"
                    />
                  </div>
                  <BaseButton
                    type="primary"
                    danger
                    isSubmit
                    onClick={() => console.log("Login clicked")}
                    icon={<LoginOutlined />}
                    className="w-full"
                  >
                    Login now
                  </BaseButton>
                </form>
                <Link href="/forgot-password" className="block mt-4 text-center text-red-400 hover:text-red-300 transition">
                  Forgot Your Password?
                </Link>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-center text-lg font-medium mb-4">Don't Have An Account?</h3>
                  <Link href="/register">
                    <BaseButton
                      type="primary"
                      danger
                      className="w-full"
                    >
                      Register Now
                    </BaseButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}