import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const { user } = useAuth();

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md p-8 text-center bg-white rounded-lg shadow-lg">
        <div className="mb-6 text-6xl">🚫</div>
        <h2 className="mb-4 text-3xl font-bold text-gray-900">
          Access Denied
        </h2>
        <p className="mb-6 text-gray-600">
          You don't have permission to access this page.
        </p>
        
        {user && (
          <div className="p-4 mb-6 border border-yellow-200 rounded-lg bg-yellow-50">
            <p className="text-sm text-yellow-800">
              <strong>Current Role:</strong> <span className="font-semibold uppercase">{user.role}</span>
            </p>
            <p className="mt-1 text-xs text-yellow-700">
              This page requires a different role to access.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            to="/dashboard" 
            className="block w-full py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Go to Dashboard
          </Link>
          <Link 
            to="/" 
            className="block w-full py-3 font-semibold text-gray-700 transition-colors bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
