import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function PaymentSuccess(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    console.log('Payment successful! Session:', sessionId);

    // Countdown and redirect
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, navigate]);

  return (
    <div className="payment-success">
      <div className="success-icon">✅</div>
      <h1>Payment Successful!</h1>
      <p>Thank you for your purchase.</p>
      <p>Your order has been confirmed.</p>
      <p>Redirecting to orders page in {countdown} seconds...</p>
      <button onClick={() => navigate('/orders')}>
        View Orders Now
      </button>
    </div>
  );
}