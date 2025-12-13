import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">
          Welcome to Your Dashboard
        </h2>
        
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="space-y-3">
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Name:</span>{' '}
              <span className="text-gray-600">{user?.name}</span>
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">Email:</span>{' '}
              <span className="text-gray-600">{user?.email}</span>
            </p>
            <p className="text-gray-700">
              <span className="font-semibold text-gray-900">User ID:</span>{' '}
              <span className="text-gray-600">{user?.id}</span>
            </p>
          </div>
        </div>
        
        <div className="text-gray-600 space-y-3 leading-relaxed">
          <p>
            This is a protected page. You can only see this if you're authenticated.
          </p>
          <p>
            Your JWT token is stored in localStorage and automatically attached to API requests.
          </p>
        </div>
      </div>
    </div>
  );
}
