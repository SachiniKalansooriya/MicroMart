import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';

interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  createdAt: string;
}

export default function Orders(): React.ReactElement {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      const data = await paymentService.getOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      setOrders([]); // Ensure orders is always an array
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
        <p className="mt-2 text-gray-600">View your order history and track purchases</p>
      </div>

      {error && (
        <div className="px-6 py-4 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
          <p className="mb-2 font-semibold">Error loading orders:</p>
          <p>{error}</p>
          <button
            onClick={loadOrders}
            className="px-4 py-2 mt-4 text-sm font-semibold text-white transition-colors bg-red-600 rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {!error && orders && orders.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-lg shadow-md">
          <div className="mb-4 text-6xl">📦</div>
          <h2 className="mb-2 text-2xl font-semibold text-gray-900">No orders yet</h2>
          <p className="mb-6 text-gray-600">Start shopping to see your orders here</p>
          <button
            onClick={() => navigate('/customer')}
            className="px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
          >
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order.orderId} className="overflow-hidden bg-white rounded-lg shadow-md">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.orderId.substring(0, 8)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    order.paymentStatus === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : order.paymentStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {order.paymentStatus === 'completed' ? '✓ Paid' : 
                     order.paymentStatus === 'pending' ? '⏳ Pending' : '✗ Failed'}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 py-4 border-t border-gray-200 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-gray-500">Product ID</p>
                    <p className="mt-1 font-mono text-sm text-gray-900">
                      {order.productId.substring(0, 12)}...
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Quantity</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {order.quantity} item{order.quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="mt-1 text-2xl font-bold text-indigo-600">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 mt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigate(`/product/${order.productId}`)}
                    className="flex-1 px-4 py-2 font-medium text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700"
                  >
                    View Product
                  </button>
                  <button
                    className="flex-1 px-4 py-2 font-medium text-gray-700 transition-colors bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Download Invoice
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate('/customer')}
          className="font-medium text-indigo-600 hover:text-indigo-700"
        >
          ← Back to Products
        </button>
      </div>
    </div>
  );
}
