import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import productService, { type Product } from '../services/productService';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';
import { useCart } from '../contexts/CartContext';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
    
    // Validate color selection if product has colors
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color before adding to cart');
      return;
    }
    
    addToCart(product, quantity, selectedColor);
    
    // Show success message
    alert(`Added ${quantity} ${product.name}${selectedColor ? ` (${selectedColor})` : ''} to cart!`);
  };

  const handleBuyNow = async () => {
    if (!product) return;
    
    // Validate color selection if product has colors
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      alert('Please select a color before purchasing');
      return;
    }
    
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

  // Get all product images (imageUrl + any additional images if they exist)
  const getProductImages = () => {
    const images: string[] = [];
    if (product?.imageUrl) {
      images.push(product.imageUrl);
    }
    // If product has multiple images stored (future enhancement)
    // images.push(...product.images || []);
    return images;
  };

  const productImages = getProductImages();
  const hasMultipleImages = productImages.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
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
    <div className="px-4 py-8 mx-auto max-w-7xl">
      <div className="overflow-hidden bg-[#eff6fb] shadow-xl rounded-2xl">
        <div className="grid grid-cols-1 gap-8 p-8 lg:grid-cols-2 lg:gap-12">
          {/* Product Image Gallery */}
          <div className="space-y-4">
            <div className="relative flex items-center justify-center overflow-hidden bg-gray-50 rounded-xl h-80">
              {productImages.length > 0 ? (
                <>
                  <img 
                    src={productImages[currentImageIndex]} 
                    alt={product.name} 
                    className="object-contain w-full h-full"
                  />
                  {hasMultipleImages && (
                    <>
                      {/* Previous Button */}
                      <button
                        onClick={prevImage}
                        className="absolute p-2 text-gray-800 transition-all -translate-y-1/2 rounded-full shadow-lg left-2 top-1/2 bg-white/90 hover:bg-white hover:scale-110"
                        aria-label="Previous image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      {/* Next Button */}
                      <button
                        onClick={nextImage}
                        className="absolute p-2 text-gray-800 transition-all -translate-y-1/2 rounded-full shadow-lg right-2 top-1/2 bg-white/90 hover:bg-white hover:scale-110"
                        aria-label="Next image"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {/* Image Counter */}
                      <div className="absolute px-3 py-1 text-sm font-medium text-white rounded-full bottom-3 right-3 bg-black/60">
                        {currentImageIndex + 1} / {productImages.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <span className="text-6xl text-gray-300">📦</span>
              )}
            </div>
            
            {/* Thumbnail Navigation */}
            {hasMultipleImages && (
              <div className="flex gap-2 pb-2 overflow-x-auto">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === idx 
                        ? 'border-indigo-600 ring-2 ring-indigo-200' 
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="object-cover w-full h-full" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-5">
            {/* Category Badge */}
            <div>
              <span className="inline-block px-3 py-1 text-xs font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                {product.category}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              {product.name}
            </h1>

            {/* Price & Stock */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-indigo-600">
                ${product.price.toFixed(2)}
              </span>
              {product.stock > 0 ? (
                <span className="text-sm font-semibold text-[#4A7FA7]">
                  ✓ In Stock ({product.stock} available)
                </span>
              ) : (
                <span className="text-sm font-semibold text-red-600">
                  ✗ Out of Stock
                </span>
              )}
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-900 uppercase">
                Description
              </h2>
              <p className="text-sm leading-relaxed text-gray-600">
                {product.description}
              </p>
            </div>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-900 uppercase">
                  Available Colors <span className="text-red-500">*</span>
                </h2>
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className={`w-full px-4 py-2.5 text-sm font-medium bg-white border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${
                    selectedColor ? 'text-gray-700 border-gray-300' : 'text-gray-400 border-red-300'
                  }`}
                >
                  <option value="" disabled>Select a color</option>
                  {product.colors.map((color) => (
                    <option key={color} value={color} className="text-gray-700">
                      {color}
                    </option>
                  ))}
                </select>
                {selectedColor ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Selected: <span className="font-semibold text-indigo-600">{selectedColor}</span>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-red-600">
                    Please select a color to continue
                  </p>
                )}
              </div>
            )}

            {/* Quantity Selector */}
            <div className="pt-4 border-t border-gray-200">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gray-900 uppercase">
                Quantity
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    −
                  </button>
                  <span className="px-4 py-1.5 font-semibold text-gray-900 min-w-[50px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(1)}
                    disabled={!product || quantity >= product.stock}
                    className="px-3 py-1.5 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  {product.stock} available
                </span>
              </div>
            </div>

            {/* Action Buttons - Same Row */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-black transition-all bg-[#B3CFE5] rounded-lg  disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                
                  Add to Cart
                </button>
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock === 0 || processingPayment}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white transition-all bg-[#4A7FA7] rounded-lg  disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    <>
                      
                      Buy Now
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="p-3 space-y-1.5 text-xs rounded-lg bg-gray-50">
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
