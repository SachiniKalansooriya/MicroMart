import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div 
      className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-fixed bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className="grid items-center w-full max-w-6xl grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left side - Login Form */}
        <div className="w-full p-8 rounded-lg shadow-2xl bg-white/95 backdrop-blur-sm">
          <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">
            Login to MicroMart
          </h2>
          
          {error && (
            <div className="px-4 py-3 mb-6 text-center text-red-700 border border-red-200 rounded-lg bg-red-50">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-semibold text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
                className="w-full px-4 py-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-semibold text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                className="w-full px-4 py-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-semibold text-white transition-colors bg-[#1A3D63] rounded-lg  disabled:bg-[#4A7FA7] disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-[#1A3D63]">
              Register here
            </Link>
          </p>
        </div>

        {/* Right side - Girl Image */}
        <div className="items-center justify-center hidden lg:flex">
          <img 
            src="/girl.png" 
            alt="Welcome" 
            className="object-contain w-full h-auto max-w-lg rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
