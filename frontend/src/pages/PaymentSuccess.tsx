import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';

export default function PaymentSuccess(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('Payment successful! Session:', sessionId);

    // Show success notification
    showNotification('Order has been placed successfully!', 'success');

    // Countdown and redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        const newCount = prev - 1;
        if (newCount <= 0) {
          clearInterval(timer);
          // Use setTimeout to ensure navigation happens after state update
          setTimeout(() => navigate('/orders'), 0);
          return 0;
        }
        return newCount;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate, showNotification]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-12 bg-white rounded-2xl shadow-2xl max-w-md">
        <div className="text-6xl mb-6">✅</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-2">Thank you for your purchase.</p>
        <p className="text-gray-600 mb-6">Your order has been confirmed.</p>
        <p className="text-sm text-gray-500 mb-6">Redirecting to orders page in {countdown} seconds...</p>
        <button 
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          View Orders Now
        </button>
      </div>
    </div>
  );
}