import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div 
      className="min-h-[100vh] flex items-center justify-center px-4 py-12 bg-fixed  relative bg-[#d2dde5]" >
     
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl p-8 rounded-lg shadow-2xl bg-[#eef3f6] backdrop-blur-sm">
        <h2 className="mb-8 text-3xl font-bold text-center text-gray-900">
          Create Account
        </h2>
        
        {error && (
          <div className="px-4 py-3 mb-6 text-center text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="name" className="block mb-2 text-sm font-semibold text-gray-700">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="w-full px-4 py-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
            </div>
            
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
                  minLength={6}
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
            
            <div>
              <label htmlFor="phone" className="block mb-2 text-sm font-semibold text-gray-700">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={handleChange}
                required
                placeholder="Enter your phone number"
                className="w-full px-4 py-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
            </div>
            
            <div className="md:col-span-2">
              <label htmlFor="address" className="block mb-2 text-sm font-semibold text-gray-700">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                placeholder="Enter your address"
                rows={3}
                className="w-full px-4 py-3 transition-all border border-gray-300 rounded-lg outline-none resize-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-16 py-3 font-semibold text-white transition-colors bg-[#1A3D63] rounded-lg disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </div>
        </form>
        
        <p className="mt-6 text-center text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold tex-[#1A3D63] ">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
