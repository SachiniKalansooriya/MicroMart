import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(cart.map(item => item.productId)));
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(cart.map(item => item.productId)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (productId: string, change: number) => {
    const item = cart.find(i => i.productId === productId);
    if (item) {
      const newQuantity = item.quantity + change;
      if (newQuantity >= 1 && newQuantity <= item.stock) {
        updateQuantity(productId, newQuantity);
      }
    }
  };

  const getSelectedTotal = () => {
    return cart
      .filter(item => selectedItems.has(item.productId))
      .reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getSelectedCount = () => {
    return selectedItems.size;
  };

  const handleBuyNow = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to purchase');
      return;
    }

    if (!authService.isAuthenticated()) {
      alert('Please login to purchase');
      navigate('/login');
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Get selected items
      const itemsToBuy = cart
        .filter(item => selectedItems.has(item.productId))
        .map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }));
      
      console.log('Items to buy:', itemsToBuy);
      console.log('Request payload:', JSON.stringify({ items: itemsToBuy }));
      
      // Use multi-item checkout for all cases (supports both single and multiple items)
      const result = await paymentService.createMultiItemCheckout(itemsToBuy);

      if (result.url) {
        window.location.href = result.url;
      } else {
        alert('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment. Please try again.';
      alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen px-4 py-12 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Start shopping to add items to your cart!</p>
            <button
              onClick={() => navigate('/customer')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const allSelected = selectedItems.size === cart.length;

  return (
    <div className="min-h-screen px-4 py-8 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          <button
            onClick={() => navigate('/customer')}
            className="flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Continue Shopping
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {/* Select All */}
            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="font-semibold text-gray-900">Select All ({cart.length} items)</span>
              </label>
            </div>

            {/* Cart Items List */}
            {cart.map((item) => (
              <div 
                key={item.productId} 
                className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Checkbox */}
                  <div className="flex items-start pt-1">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.productId)}
                      onChange={(e) => handleSelectItem(item.productId, e.target.checked)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                  </div>

                  {/* Product Image */}
                  <div 
                    className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-3xl">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="text-lg font-semibold text-gray-900 mb-1 hover:text-indigo-600 cursor-pointer"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{item.description}</p>
                    
                    {item.selectedColor && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">Color:</span>
                        <span className="text-xs font-medium text-gray-700 px-2 py-1 bg-gray-100 rounded">
                          {item.selectedColor}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 flex-wrap">
                      {/* Price */}
                      <div>
                        <span className="text-xl font-bold text-indigo-600">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() => handleQuantityChange(item.productId, -1)}
                          disabled={item.quantity <= 1}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 font-semibold text-gray-900 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Stock Info */}
                      <span className="text-xs text-gray-500">
                        {item.stock} available
                      </span>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </span>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Selected Items:</span>
                  <span className="font-semibold">{getSelectedCount()}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold">${getSelectedTotal().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span className="font-semibold text-green-600">Free</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-indigo-600">${getSelectedTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={selectedItems.size === 0 || processingPayment}
                className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Buy Now ({getSelectedCount()} {getSelectedCount() === 1 ? 'item' : 'items'})
                  </>
                )}
              </button>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>💡 Tip:</strong> Select the items you want to purchase using the checkboxes
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
