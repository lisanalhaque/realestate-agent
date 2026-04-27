import { toast } from 'react-toastify';

function getApiBase() {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return base.replace(/\/$/, '');
}

export function bidIdString(bid) {
  const id = bid?._id;
  if (!id) return '';
  return typeof id === 'string' ? id : id.toString?.() || String(id);
}

/**
 * Create order, then demo confirm or Razorpay checkout, then verify on server.
 * @param {object} bid
 * @param {{ onSuccess?: () => void, onBusyChange?: (busy: boolean) => void }} [callbacks]
 */
export async function runAdvancePayment(bid, { onSuccess, onBusyChange } = {}) {
  const setBusy = (busy) => {
    try {
      onBusyChange?.(busy);
    } catch (_) {
      /* ignore callback errors */
    }
  };

  const token = localStorage.getItem('token');
  const bidId = bidIdString(bid);
  if (!token) {
    toast.error('Please sign in to pay.');
    return;
  }
  if (!bidId) {
    toast.error('Invalid negotiation record.');
    return;
  }

  const apiBase = getApiBase();
  setBusy(true);

  try {
    const res = await fetch(`${apiBase}/payments/create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ bidId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to initialize payment');

    const orderId = data.order?.id;
    if (!orderId) throw new Error('Invalid payment order from server');

    const isDemoMode = String(orderId).startsWith('demo_order_');

    if (isDemoMode) {
      const advance = data.advanceAmount ?? 100;
      const confirmed = window.confirm(
        `Demo Payment Confirmation\n\nProperty: ${bid.propertyId?.title || 'Property'}\nAdvance Amount: ₹${advance}\n\nClick OK to confirm demo payment.`
      );

      if (!confirmed) {
        setBusy(false);
        toast.info('Payment cancelled');
        return;
      }

      try {
        const verifyRes = await fetch(`${apiBase}/payments/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            razorpay_order_id: orderId,
            razorpay_payment_id: `demo_payment_${Date.now()}`,
            razorpay_signature: 'demo_signature',
            bidId,
          }),
        });
        const verifyData = await verifyRes.json().catch(() => ({}));
        if (verifyRes.ok) {
          toast.success('Demo payment successful.');
          onSuccess?.();
        } else {
          toast.error(verifyData.message || 'Payment verification failed');
        }
      } catch (e) {
        console.error(e);
        toast.error('Error verifying payment');
      } finally {
        setBusy(false);
      }
      return;
    }

    const key =
      data.razorpayKeyId ||
      import.meta.env.VITE_RAZORPAY_KEY_ID ||
      '';
    if (!key) {
      throw new Error('Payment gateway key missing. Set RAZORPAY_KEY_ID_TEST on the server or VITE_RAZORPAY_KEY_ID for the client.');
    }

    if (typeof window.Razorpay !== 'function') {
      throw new Error('Payment script failed to load. Check your network and try again.');
    }

    const options = {
      key,
      amount: data.order.amount,
      currency: data.order.currency || 'INR',
      name: 'BoomAgent',
      description: `Advance for ${bid.propertyId?.title || 'property'}`,
      order_id: orderId,
      handler: async function (response) {
        try {
          const verifyRes = await fetch(`${apiBase}/payments/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bidId,
            }),
          });
          const verifyData = await verifyRes.json().catch(() => ({}));
          if (verifyRes.ok) {
            toast.success('Advance payment successful.');
            onSuccess?.();
          } else {
            toast.error(verifyData.message || 'Payment verification failed');
          }
        } catch (e) {
          console.error(e);
          toast.error('Error verifying payment');
        }
      },
      theme: { color: '#2563eb' },
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      toast.error(response.error?.description || 'Payment failed');
    });
    setBusy(false);
    rzp.open();
  } catch (error) {
    console.error(error);
    setBusy(false);
    toast.error(error.message || 'Payment initiation failed');
  }
}
