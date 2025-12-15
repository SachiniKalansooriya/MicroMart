import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { paymentService } from '../services/paymentService';
import productService from '../services/productService';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    processingOrders: 0,
    totalProducts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all orders (admin)
      const orders = await paymentService.getAllOrders();
      const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
      const processingOrders = orders.filter(o => (o.orderStatus || 'processing') === 'processing').length;
      
      // Fetch products
      const products = await productService.getProducts();
      
      setStats({
        totalSales,
        totalOrders: orders.length,
        processingOrders,
        totalProducts: products.length
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, <span className="font-semibold text-indigo-600">{user?.name}</span>
          </p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading statistics...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Sales</h3>
                  <span className="text-3xl">💰</span>
                </div>
                <p className="text-3xl font-bold text-indigo-600">${stats.totalSales.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-2">From {stats.totalOrders} order{stats.totalOrders !== 1 ? 's' : ''}</p>
              </div>

              <div 
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => navigate('/admin/orders')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Total Orders</h3>
                  <span className="text-3xl">📦</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500 mt-2">{stats.processingOrders} processing</p>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Customers</h3>
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">-</p>
                <p className="text-sm text-gray-500 mt-2">Coming soon</p>
              </div>

              <div 
                className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
                onClick={() => navigate('/admin/products')}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Products</h3>
                  <span className="text-3xl">🛍️</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">{stats.totalProducts}</p>
                <p className="text-sm text-gray-500 mt-2">In catalog</p>
              </div>
            </div>
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/products')}
                className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📦</span>
                  <span className="font-medium text-gray-900">Manage Products</span>
                </div>
                <span className="text-indigo-600">→</span>
              </button>
              <button
                onClick={() => navigate('/admin/orders')}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">🛒</span>
                  <span className="font-medium text-gray-900">View Orders</span>
                </div>
                <span className="text-green-600">→</span>
              </button>
              <button
                className="w-full flex items-center justify-between p-4 bg-gray-100 rounded-lg cursor-not-allowed opacity-50"
                disabled
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <span className="font-medium text-gray-900">Customer List</span>
                </div>
                <span className="text-gray-400">Coming soon</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">System Info</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Role</span>
                <span className="font-semibold text-indigo-600 uppercase">{user?.role}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Email</span>
                <span className="font-medium text-gray-900">{user?.email}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Phone</span>
                <span className="font-medium text-gray-900">{user?.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">User ID</span>
                <span className="font-mono text-xs text-gray-500">{user?.userId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔒 Admin-Only Access</h3>
          <p className="text-yellow-800">
            This dashboard is only accessible to users with the <strong>admin</strong> role. 
            You have full access to all management features.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
