// pages/login.js
"use client";
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "antd";
import { LoginOutlined } from '@ant-design/icons';

import BaseButton from "@/components/BaseButton";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // ...


    try {
      const response = await fetch("/api/authenticate/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        router.push(data.redirectUrl);
      } else {
        alert("Login failed!");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("An error occurred!");
    }
  };

  return (
    <>
      

      {/* Page Preloder - You might want to use a loading state in React instead */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center hidden" id="preloder">
        <div className="w-16 h-16 border-4 border-t-red-500 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
      </div>

      {/* Header would be imported from a component */}
      {/* <Header /> */}

      {/* Normal Breadcrumb Begin */}
      <section className="relative py-24 bg-gray-900">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="/img/normal-breadcrumb.jpg"
            alt="Background"
            layout="fill"
            objectFit="cover"
            priority
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-white mb-2">Login</h2>
            <p className="text-gray-300">Welcome to the official Anime blog.</p>
          </div>
        </div>
      </section>
      {/* Normal Breadcrumb End */}

      {/* Login Section Begin */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-8 lg:mb-0">
              <div className="p-6 bg-gray-800 rounded">
                <h3 className="text-2xl font-bold mb-6">Login</h3>
                <form onSubmit={handleSubmit}>
                  <div className="relative mb-6">
                    <input
                      type="text"
                      placeholder="Email address"
                      className="w-full bg-gray-700 text-white px-4 py-3 pl-12 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <span className="absolute left-4 top-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                  </div>
                  <div className="relative mb-6">
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full bg-gray-700 text-white px-4 py-3 pl-12 rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span className="absolute left-4 top-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                  </div>
                  {/* <Button
                    type="primary"
                    danger
                    htmlType="submit"
                    size="large"
                    className="font-bold px-6 h-12" // Giữ lại một số class cần thiết
                  >
                    Login Now
                  </Button> */}
                  <BaseButton
                    type="primary"
                    danger
                    isSubmit
                    onClick={() => console.log("Login clicked")}
                    icon={<LoginOutlined />}
                  >
                    Đăng nhập
                  </BaseButton>
                </form>
                <Link href="/forgot-password" className="block mt-4 text-red-400 hover:text-red-300 transition">
                  Forgot Your Password?
                </Link>
              </div>
            </div>
            <div className="w-full lg:w-1/2 px-4">
              <div className="flex flex-col items-center justify-center h-full">
                <h3 className="text-2xl font-bold mb-6">Don't Have An Account?</h3>
                <Link href="/register" passHref legacyBehavior>
                  <BaseButton
                    type="primary"
                    danger
                    size="large"
                    className="font-bold px-6 h-12"
                  >
                    Register Now
                  </BaseButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Login Section End */}

      {/* Footer would be imported from a component */}
      {/* <Footer /> */}

      {/* Search model - Could be made into a component with state */}
      <div className="fixed inset-0 bg-black bg-opacity-80 z-50 hidden" id="search-model">
        <div className="h-full flex items-center justify-center">
          <div className="relative">
            <button className="absolute top-0 right-0 text-white text-2xl">×</button>
            <form className="mt-8">
              <input
                type="text"
                placeholder="Search here....."
                className="w-64 bg-transparent border-b-2 border-white text-white px-2 py-1 focus:outline-none"
              />
            </form>
          </div>
        </div>
      </div>
    </>
  );
}