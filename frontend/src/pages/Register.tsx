import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const { register, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? value.replace(/\D+/g, '') : value;
    setForm({ ...form, [name]: nextValue });
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
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                minLength={6}
                className="w-full px-4 py-3 transition-all border border-gray-400 rounded-lg outline-none focus:ring-2 focus:ring-[#B3CFE5] focus:border-transparent"
              />
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
                inputMode="numeric"
                pattern="[0-9]*"
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
