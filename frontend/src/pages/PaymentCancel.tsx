import { useNavigate } from 'react-router-dom';
import React from 'react';

export default function PaymentCancel(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="payment-cancel">
      <div className="cancel-icon">❌</div>
      <h1>Payment Cancelled</h1>
      <p>Your payment was not processed.</p>
      <button onClick={() => navigate('/products')}>
        Back to Products
      </button>
    </div>
  );
}