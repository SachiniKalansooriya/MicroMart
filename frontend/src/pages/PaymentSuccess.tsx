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
    <div className="flex items-center justify-center min-h-screen bg-[#d2dfe9]">
      <div className="max-w-md p-12 text-center bg-white shadow-2xl rounded-2xl">
        <div className="mb-6 text-6xl">✅</div>
        <h1 className="mb-4 text-3xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="mb-2 text-gray-600">Thank you for your purchase.</p>
        <p className="mb-6 text-gray-600">Your order has been confirmed.</p>
        <p className="mb-6 text-sm text-gray-500">Redirecting to orders page in {countdown} seconds...</p>
        <button 
          onClick={() => navigate('/orders')}
          className="px-6 py-3 bg-[#1a3d63] text-white font-semibold rounded-lg  transition-colors"
        >
          View Orders Now
        </button>
      </div>
    </div>
  );
}