import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { paymentService } from '../services/paymentService';
import { authService } from '../services/authService';

export default function Cart() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity } = useCart();
  const { showNotification } = useNotification();
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
        // Show notification before redirecting
        showNotification('Order placed successfully! Redirecting to payment...', 'success');
        
        // Small delay to show notification before redirect
        setTimeout(() => {
          window.location.href = result.url;
        }, 1000);
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
      <div className="min-h-screen px-4 py-12 bg-[#d2dfe9]">
        <div className="max-w-6xl mx-auto">
          <div className="p-12 text-center bg-white shadow-lg rounded-2xl">
            <div className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-gray-100 rounded-full">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="mb-3 text-2xl font-bold text-gray-900">Your cart is empty</h2>
            <p className="mb-6 text-gray-600">Start shopping to add items to your cart!</p>
        
          </div>
        </div>
      </div>
    );
  }

  const allSelected = selectedItems.size === cart.length;

  return (
    <div className="min-h-screen px-4 py-8 bg-[#d2dfe9]">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
            <p className="mt-1 text-gray-600">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your cart</p>
          </div>
          
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {/* Select All */}
            <div className="p-4 bg-white border border-gray-200 shadow-sm rounded-xl">
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
                className="p-4 transition-shadow bg-white border border-gray-200 shadow-sm rounded-xl hover:shadow-md"
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
                    className="flex-shrink-0 w-24 h-24 overflow-hidden bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full text-3xl text-gray-400">
                        📦
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 
                      className="mb-1 text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600"
                      onClick={() => navigate(`/product/${item.productId}`)}
                    >
                      {item.name}
                    </h3>
                    <p className="mb-2 text-sm text-gray-600 line-clamp-1">{item.description}</p>
                    
                    {item.selectedColor && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500">Color:</span>
                        <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded">
                          {item.selectedColor}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4">
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
                          className="px-3 py-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          −
                        </button>
                        <span className="px-4 py-1 font-semibold text-gray-900 min-w-[40px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.productId, 1)}
                          disabled={item.quantity >= item.stock}
                          className="px-3 py-1 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm text-gray-600">
                        Subtotal: <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                      </span>
                      
                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-sm font-medium text-red-600 transition-colors hover:text-red-800"
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
            <div className="sticky p-6 bg-white border border-gray-200 shadow-lg rounded-xl top-4">
              <h2 className="mb-4 text-xl font-bold text-gray-900">Order Summary</h2>
              
              <div className="mb-4 space-y-3">
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
                  <span className="font-semibold text-[#4A7FA7]">Free</span>
                </div>
                
                <div className="pt-3 mt-3 border-t border-gray-200">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-[#1A3D63]">${getSelectedTotal().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleBuyNow}
                disabled={selectedItems.size === 0 || processingPayment}
                className="flex items-center justify-center w-full gap-2 px-4 py-3 font-bold text-white transition-all bg-blue-800 rounded-lg shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:shadow-lg"
              >
                {processingPayment ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                   
                    Buy Now ({getSelectedCount()} {getSelectedCount() === 1 ? 'item' : 'items'})
                  </>
                )}
              </button>

            
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
