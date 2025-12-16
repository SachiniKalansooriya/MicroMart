import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import productService, { type Product } from '../services/productService';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { addToCart, getCartCount } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getProducts();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-12 mx-auto max-w-7xl">
      <div className="p-8 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">
              Customer Dashboard
            </h2>
            <p className="text-gray-600">
              Welcome, <span className="font-semibold text-indigo-600">{user?.name}</span>!
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-green-600 rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              My Cart
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center ring-2 ring-white">
                  {getCartCount()}
                </span>
              )}
            </button>
            
            <button
              onClick={() => navigate('/orders')}
              className="flex items-center gap-2 px-6 py-3 font-semibold text-white transition-colors bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              My Orders
            </button>
            
           
          </div>
        </div>

        

        <div className="mb-6">
          <h3 className="mb-4 text-2xl font-bold text-gray-900">Available Products</h3>
        </div>

        {error && (
          <div className="px-4 py-3 mb-6 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-8 text-center">
            <div className="inline-block w-8 h-8 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
            <p className="mt-2 text-gray-600">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {products.length === 0 ? (
              <div className="py-8 text-center text-gray-500 col-span-full">
                No products available at the moment.
              </div>
            ) : (
              products.map((product) => (
                <div 
                  key={product.productId} 
                  className="overflow-hidden transition-all duration-200 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-xl group"
                  onClick={() => navigate(`/product/${product.productId}`)}
                >
                  <div className="relative flex items-center justify-center overflow-hidden bg-gray-100 aspect-square">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="object-cover w-full h-full transition-transform duration-200 group-hover:scale-105" />
                    ) : (
                      <span className="text-5xl text-gray-400">📦</span>
                    )}
                    {product.stock > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product, 1);
                          // Optional: Show a brief notification
                          const btn = e.currentTarget;
                          const originalHTML = btn.innerHTML;
                          btn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                          setTimeout(() => {
                            btn.innerHTML = originalHTML;
                          }, 1000);
                        }}
                        className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                        title="Add to cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <span className="px-3 py-1 text-sm font-semibold text-white bg-red-600 rounded-full">Out of Stock</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">{product.name}</h4>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-lg font-bold text-red-600">${product.price.toFixed(2)}</span>
                    </div>
                    {product.colors && product.colors.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {product.colors.slice(0, 4).map((color) => (
                          <div 
                            key={color}
                            className="w-4 h-4 border border-gray-300 rounded-full"
                            style={{ backgroundColor: color.toLowerCase() }}
                            title={color}
                          />
                        ))}
                        {product.colors.length > 4 && (
                          <span className="self-center text-xs text-gray-500">+{product.colors.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="p-6 mt-8 border border-blue-200 rounded-lg bg-blue-50">
          <h3 className="mb-2 text-lg font-semibold text-blue-900">👤 Customer Access</h3>
          <p className="text-blue-800">
            This is your customer dashboard. You can browse products and place orders. 
            Admin features are not available for customer accounts.
          </p>
        </div>
      </div>
    </div>
  );
}
