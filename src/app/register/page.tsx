"use client";
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Form, Input, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import BaseButton from "@/components/BaseButton";

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!username || !email || !password) {
      message.warning("Vui lòng điền đầy đủ thông tin.");
      return;
    }

    try {
      const response = await fetch("http://localhost:2000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (data && data._id) {
        alert("register success!");
        router.push("/login");
      } else {
        message.error("register failed!");
      }
    } catch (err) {
      console.error("Error:", err);
      message.error("failed to connect server!");
    }
  };

  return (
    <section className="h-screen bg-gray-900 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 h-full">
        <div className="relative hidden md:block">
          <div className="absolute inset-0">
            <Image
              src="/img/loginbanner.png"
              alt="Banner"
              layout="fill"
              objectFit="cover"
              priority
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-8">
                <h2 className="text-4xl font-bold text-black mb-4">Anime Blog</h2>
                <p className="text-xl text-black">Create your account now!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="p-8 bg-gray-800 rounded shadow-lg">
              <h3 className="text-2xl font-bold mb-6 text-center">Register</h3>
              <form onSubmit={handleSubmit} className="ant-form">
                <div className="mb-4">
                  <Input
                    size="large"
                    placeholder="Username"
                    prefix={<UserOutlined />}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <Input
                    size="large"
                    placeholder="Email"
                    prefix={<MailOutlined />}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>
                <div className="mb-6">
                  <Input.Password
                    size="large"
                    placeholder="Password"
                    prefix={<LockOutlined />}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600"
                  />
                </div>
                <BaseButton
                  type="primary"
                  danger
                  isSubmit
                  className="w-full"
                >
                  Register now
                </BaseButton>
              </form>
              <Link href="/login" className="block mt-4 text-center text-red-400 hover:text-red-300 transition">
                Already have an account? Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
