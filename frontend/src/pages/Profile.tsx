import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-6 font-medium text-indigo-600 transition-colors hover:text-indigo-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>

        <div className="overflow-hidden bg-white shadow-xl rounded-2xl">
          {/* Header with gradient background */}
          <div className="px-8 py-12 bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="flex items-center justify-center w-24 h-24 bg-white rounded-full shadow-lg ring-4 ring-white/50">
                  <span className="text-4xl font-bold text-indigo-600">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-400 border-4 border-white rounded-full"></div>
              </div>

              {/* User Name and Role */}
              <div className="flex-1">
                <h1 className="mb-2 text-3xl font-bold text-white">{user.name}</h1>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1 text-sm font-semibold text-white rounded-full bg-white/20 backdrop-blur-sm">
                    {user.role === 'admin' ? '👑 Admin' : '👤 Customer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="px-8 py-8">
            <h2 className="mb-6 text-xl font-bold text-gray-900">Profile Information</h2>

            <div className="space-y-6">
              {/* Email */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-indigo-100 rounded-full">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-500">Email Address</p>
                  <p className="text-base font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-500">Phone Number</p>
                  <p className="text-base font-medium text-gray-900">
                    {user.phone || <span className="italic text-gray-400">Not provided</span>}
                  </p>
                </div>
              </div>

              {/* User ID */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-pink-100 rounded-full">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-500">User ID</p>
                  <p className="px-3 py-2 font-mono text-xs text-gray-600 break-all bg-gray-100 rounded">
                    {user.userId}
                  </p>
                </div>
              </div>

              {/* Member Since */}
              <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                <div className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-green-100 rounded-full">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="mb-1 text-sm font-medium text-gray-500">Member Since</p>
                  <p className="text-base font-medium text-gray-900">
                    {new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-8 mt-8 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center flex-1 gap-2 px-6 py-3 font-semibold text-white transition-colors bg-red-600 rounded-lg shadow-md hover:bg-red-700 hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
