import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../services/paymentService';
import productService, { type Product } from '../services/productService';

interface Order {
  orderId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus?: string;
  createdAt: string;
  productName?: string;
  productImage?: string;
}

export default function Orders(): React.ReactElement {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadOrders(true); // true = silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError(''); // Clear previous errors
      const data = await paymentService.getOrders();
      const ordersArray = Array.isArray(data) ? data : [];
      setOrders(ordersArray);
      
      // Fetch product details for each order
      const productMap: Record<string, Product> = {};
      for (const order of ordersArray) {
        try {
          if (!productMap[order.productId]) {
            const product = await productService.getProduct(order.productId);
            productMap[order.productId] = product;
          }
        } catch (err) {
          console.error(`Failed to load product ${order.productId}:`, err);
        }
      }
      setProducts(productMap);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load orders';
      setError(errorMessage);
      setOrders([]); // Ensure orders is always an array
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="mt-2 text-gray-600">View your order history and track purchases</p>
        </div>
        <div className="flex items-center gap-3">
          {refreshing && (
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Updating...
            </span>
          )}
          <button
            onClick={() => loadOrders()}
            disabled={loading || refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh orders"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
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
          {orders.map((order) => {
            const product = products[order.productId];
            const orderStatus = order.orderStatus || 'processing';
            
            return (
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
                  <div className="flex flex-col items-end gap-2">
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
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      orderStatus === 'delivered' ? 'bg-green-100 text-green-800' :
                      orderStatus === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      orderStatus === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {orderStatus === 'delivered' ? '📦 Delivered' :
                       orderStatus === 'shipped' ? '🚚 Shipped' :
                       orderStatus === 'processing' ? '⏱️ Processing' :
                       '❌ Cancelled'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 py-4 border-t border-gray-200">
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-100 rounded-lg">
                    {product?.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="object-cover w-full h-full transition-opacity cursor-pointer hover:opacity-80"
                        onClick={() => navigate(`/product/${order.productId}`)}
                      />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-3xl text-gray-400">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <p className="text-sm text-gray-500">Product</p>
                      <p className="mt-1 font-semibold text-gray-900">
                        {product?.name || 'Loading...'}
                      </p>
                      {product?.category && (
                        <p className="text-xs text-gray-500 mt-0.5">{product.category}</p>
                      )}
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
                </div>

                
              </div>
            </div>
          )})}
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
