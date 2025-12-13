import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const location = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/products', label: 'Products', icon: '📦' },
    { path: '/admin/orders', label: 'Orders', icon: '🛒' },
    { path: '/admin/customers', label: 'Customers', icon: '👥' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="h-full flex flex-col">
          {/* Admin Profile */}
          <div className="p-6 bg-indigo-600 text-white">
            <h2 className="text-xl font-bold mb-1">Admin Panel</h2>
            <p className="text-sm text-indigo-200">{user?.name}</p>
            <p className="text-xs text-indigo-300">{user?.email}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-100 text-indigo-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t">
            <Link
              to="/"
              className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <span className="text-xl">🚪</span>
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
