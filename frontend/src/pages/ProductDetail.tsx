import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService, { type Product } from '../services/productService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (id) {
      loadProduct(id);
    }
  }, [id]);

  const loadProduct = async (productId: string) => {
    try {
      setLoading(true);
      const data = await productService.getProduct(productId);
      setProduct(data);
      // Set default color if available
      if (data.colors && data.colors.length > 0) {
        setSelectedColor(data.colors[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && product && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    // TODO: Implement cart functionality
    alert(`Added ${quantity} ${product.name}${selectedColor ? ` (${selectedColor})` : ''} to cart!`);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // Check if user is logged in
    if (!authService.isAuthenticated()) {
      alert('Please login to purchase');
      navigate('/login');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Create Stripe checkout session
      const result = await paymentService.createCheckoutSession(
        product.productId,
        quantity
      );

      if (result.url) {
        // Redirect to Stripe checkout page
        window.location.href = result.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Buy now error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
      alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-b-2 border-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <div className="px-6 py-4 mb-4 text-red-700 border border-red-200 rounded-lg bg-red-50">
            {error || 'Product not found'}
          </div>
         
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 mx-auto max-w-7xl">
     

      <div className="overflow-hidden bg-white rounded-lg shadow-lg">
        <div className="grid grid-cols-1 gap-8 p-8 md:grid-cols-2">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="flex items-center justify-center overflow-hidden bg-gray-100 rounded-lg aspect-square">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-gray-400 text-9xl">📦</span>
              )}
            </div>
            <div className="flex gap-2">
              {/* Thumbnail images can be added here in the future */}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-4xl font-bold text-gray-900">
              {product.name}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-indigo-600">
                ${product.price.toFixed(2)}
              </span>
              {product.stock > 0 ? (
                <span className="font-semibold text-green-600">
                  ✓ In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="font-semibold text-red-600">
                  ✗ Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Description
              </h2>
              <p className="leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="pt-6 border-t border-gray-200">
                <h2 className="mb-3 text-lg font-semibold text-gray-900">
                  Available Colors
                </h2>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedColor === color
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                {selectedColor && (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-semibold text-indigo-600">{selectedColor}</span>
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="mb-3 text-lg font-semibold text-gray-900">
                Quantity
              </h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="px-6 py-2 font-semibold text-gray-900 min-w-[60px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={!product || quantity >= product.stock}
                    className="px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-sm text-gray-500">
                  {product.stock} available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 space-y-3 border-t border-gray-200">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="w-full px-8 py-4 text-lg font-bold text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                🛒 Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock === 0 || processingPayment}
                className="w-full px-8 py-4 text-lg font-bold text-white transition-colors bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {processingPayment ? '⏳ Processing...' : '⚡ Buy Now'}
              </button>
            </div>

            {/* Additional Info */}
            <div className="p-4 space-y-2 text-sm rounded-lg bg-gray-50">
              <div className="flex justify-between">
                <span className="text-gray-600">Product ID:</span>
                <span className="font-mono text-gray-900">{product.productId}</span>
              </div>
              {product.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed:</span>
                  <span className="text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
