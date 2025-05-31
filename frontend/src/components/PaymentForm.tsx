import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

interface PaymentFormProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onCancel: () => void;
  amount: number;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentSuccess, onCancel, amount }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create payment intent
      const { data } = await axios.post('/api/create-payment-intent');
      
      const cardElement = elements.getElement(CardElement);
      
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        data.client_secret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (error) {
        setPaymentError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (error: any) {
      setPaymentError(error.response?.data?.error || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          🎯 Monthly Subscription
        </h2>
        
        <p className="text-gray-600 mb-4">
          Get unlimited transcriptions for just ${amount.toFixed(2)}/month! 
          Since you provide your own OpenAI API key, you only pay for hosting and features.
        </p>

        <div className="mb-4 p-3 bg-green-50 rounded-md">
          <h3 className="font-medium text-green-800 mb-2">✨ What you get:</h3>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Unlimited audio transcriptions</li>
            <li>• Maximum speed optimization</li>
            <li>• Support for files up to 11+ hours</li>
            <li>• Secure processing & storage</li>
            <li>• 30-day subscription period</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 border border-gray-300 rounded-md">
            <CardElement options={cardStyle} />
          </div>

          {paymentError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {paymentError}
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isProcessing}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!stripe || isProcessing}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            </button>
          </div>
        </form>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🔒 Secure payment powered by Stripe</p>
          <p>Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm; 