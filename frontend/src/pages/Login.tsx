import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.479z" clipRule="evenodd" />
                      <path d="M15.171 13.576l1.472 1.473a1 1 0 001.414-1.414l14-14a1 1 0 00-1.414-1.414l-14 14zM11.25 10a1.25 1.25 0 10-2.5 0 1.25 1.25 0 002.5 0z" />
                    </svg>
                  )}
                </button>
              </div>
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
