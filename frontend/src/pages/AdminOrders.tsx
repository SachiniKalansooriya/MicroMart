import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import { paymentService } from '../services/paymentService';
import productService, { type Product } from '../services/productService';

interface Order {
  orderId: string;
  userId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  paymentStatus: string;
  orderStatus?: string;
  createdAt: string;
}

const ORDER_STATUSES = [
  { value: 'processing', label: 'Processing', color: 'yellow' },
  { value: 'shipped', label: 'Shipped', color: 'blue' },
  { value: 'delivered', label: 'Delivered', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' }
];

export default function AdminOrders(): React.ReactElement {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Use admin endpoint to get all orders
      const data = await paymentService.getAllOrders();
      const ordersArray = Array.isArray(data) ? data : [];
      
      // Sort by creation date (newest first)
      ordersArray.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setOrders(ordersArray);
      
      // Fetch product details
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
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingOrderId(orderId);
      
      console.log(`Updating order ${orderId} to status ${newStatus}`);
      await paymentService.updateOrderStatus(orderId, newStatus);
      console.log(`✅ Order ${orderId} updated successfully`);
      
      // Update local state
      setOrders(orders.map(order => 
        order.orderId === orderId 
          ? { ...order, orderStatus: newStatus }
          : order
      ));
      
      alert(`✅ Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('❌ Update order status error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order status';
      alert(`❌ Error: ${errorMessage}\n\nCheck browser console for details.`);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusColor = (status: string) => {
    const statusObj = ORDER_STATUSES.find(s => s.value === status);
    return statusObj?.color || 'gray';
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-2 text-gray-600">Manage all customer orders and update shipping status</p>
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

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-4">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Total Orders</p>
            <p className="text-3xl font-bold text-indigo-600">{orders.length}</p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Processing</p>
            <p className="text-3xl font-bold text-yellow-600">
              {orders.filter(o => (o.orderStatus || 'processing') === 'processing').length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Shipped</p>
            <p className="text-3xl font-bold text-blue-600">
              {orders.filter(o => o.orderStatus === 'shipped').length}
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <p className="text-sm text-gray-600">Delivered</p>
            <p className="text-3xl font-bold text-green-600">
              {orders.filter(o => o.orderStatus === 'delivered').length}
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-lg shadow-md">
            <div className="mb-4 text-6xl">📦</div>
            <h2 className="mb-2 text-2xl font-semibold text-gray-900">No orders yet</h2>
            <p className="text-gray-600">Orders from customers will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const product = products[order.productId];
              const orderStatus = order.orderStatus || 'processing';
              const color = getStatusColor(orderStatus);
              
              return (
                <div key={order.orderId} className="overflow-hidden bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Order #{order.orderId.substring(0, 8)}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Customer: <span className="font-mono">{order.userId.substring(0, 12)}...</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          order.paymentStatus === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {order.paymentStatus === 'completed' ? '✓ Paid' : '⏳ Pending'}
                        </span>
                        <span className={`px-4 py-2 rounded-full text-sm font-semibold bg-${color}-100 text-${color}-800`}>
                          {ORDER_STATUSES.find(s => s.value === orderStatus)?.label || 'Processing'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-4 py-4 border-t border-gray-200">
                      {/* Product Image */}
                      <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                        {product?.imageUrl ? (
                          <img 
                            src={product.imageUrl} 
                            alt={product.name} 
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => navigate(`/product/${order.productId}`)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                    {/* Status Update Section */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      <p className="mb-2 text-sm font-medium text-gray-700">Update Order Status:</p>
                      <div className="flex gap-2 flex-wrap">
                        {ORDER_STATUSES.map((status) => (
                          <button
                            key={status.value}
                            onClick={() => updateOrderStatus(order.orderId, status.value)}
                            disabled={updatingOrderId === order.orderId || orderStatus === status.value}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                              orderStatus === status.value
                                ? `bg-${status.color}-600 text-white cursor-default`
                                : `bg-${status.color}-50 text-${status.color}-700 hover:bg-${status.color}-100 disabled:opacity-50 disabled:cursor-not-allowed`
                            }`}
                          >
                            {updatingOrderId === order.orderId ? 'Updating...' : status.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
