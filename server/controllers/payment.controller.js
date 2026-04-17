const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Bid = require('../models/Bid');

// Initialize Razorpay only if credentials are provided
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID_TEST && process.env.RAZORPAY_KEY_SECRET_TEST) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID_TEST,
    key_secret: process.env.RAZORPAY_KEY_SECRET_TEST
  });
}

// Demo/Mock payment order generator
const createDemoOrder = (amount, bidId) => {
  return {
    id: `demo_order_${bidId}_${Date.now()}`,
    entity: 'order',
    amount: amount * 100,
    amount_paid: 0,
    amount_due: amount * 100,
    currency: 'INR',
    receipt: `receipt_bid_${bidId}`,
    offer_id: null,
    status: 'created',
    attempts: 0,
    notes: { bidId: String(bidId), mode: 'demo', purpose: 'advance_10pct' },
    created_at: Math.floor(Date.now() / 1000)
  };
};

/** @returns {{ status: number, message: string } | null} */
function assertCanPayBid(req, bid) {
  if (bid.status !== 'accepted') {
    return { status: 400, message: 'Advance payment is only available after your negotiation is accepted' };
  }
  if (bid.advancePaymentDetails?.status === 'completed') {
    return { status: 400, message: 'Advance payment already completed for this negotiation' };
  }
  if (req.user.role === 'admin') return null;
  const ownerId = bid.userId?.toString?.() || String(bid.userId);
  const userId = req.user._id?.toString?.() || String(req.user._id);
  if (ownerId !== userId) {
    return { status: 403, message: 'You can only pay for your own negotiations' };
  }
  return null;
}

/**
 * Razorpay Node SDK throws a plain object `{ statusCode, error }`, not an Error — so
 * `error.message` is usually undefined and clients only saw a generic message.
 */
function razorpayErrorMessage(err) {
  if (err == null) return 'Payment initiation failed on server';
  if (typeof err === 'string') return err;
  const inner = err.error;
  if (typeof inner === 'string') return inner;
  if (inner && typeof inner === 'object') {
    if (inner.description) return inner.description;
    if (inner.message) return inner.message;
    if (inner.reason) return String(inner.reason);
  }
  if (err.description) return err.description;
  if (err.message) return err.message;
  if (err.statusCode) return `Payment gateway error (HTTP ${err.statusCode})`;
  try {
    return JSON.stringify(err).slice(0, 240);
  } catch (_) {
    return 'Payment initiation failed on server';
  }
}

function isLikelyObjectId(id) {
  return typeof id === 'string' && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
}

function applyAdvancePaidPipeline(bid) {
  if (bid.pipelineStage !== 'deal_done' && bid.pipelineStage !== 'deal_cancelled') {
    bid.pipelineStage = 'advance_paid';
  }
}

exports.createPaymentIntent = async (req, res) => {
  try {
    const { bidId } = req.body;
    if (!bidId || !isLikelyObjectId(String(bidId))) {
      return res.status(400).json({ message: 'Invalid negotiation id' });
    }

    const bid = await Bid.findById(bidId).populate('propertyId');
    if (!bid) return res.status(404).json({ message: 'Negotiation not found' });

    const denied = assertCanPayBid(req, bid);
    if (denied) return res.status(denied.status).json({ message: denied.message });

    const bidAmount = Number(bid.amount);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      return res.status(400).json({ message: 'Invalid proposed amount' });
    }

    // Advance payment (10% of bid), minimum ₹1 (100 paise) for Razorpay
    const advanceAmount = Math.max(1, Math.round(bidAmount * 0.1));
    const amountPaise = advanceAmount * 100;

    let order;

    const forceDemo =
      process.env.PAYMENTS_FORCE_DEMO === 'true' || process.env.PAYMENTS_FORCE_DEMO === '1';
    const fb = process.env.RAZORPAY_DEMO_FALLBACK;
    const demoFallbackExplicitOn = fb === 'true' || fb === '1';
    const demoFallbackExplicitOff = fb === 'false' || fb === '0';
    // Local dev: if Razorpay keys are wrong, still allow demo checkout unless explicitly disabled.
    const demoFallback =
      demoFallbackExplicitOn ||
      (!demoFallbackExplicitOff && process.env.NODE_ENV !== 'production');

    if (razorpay && !forceDemo) {
      const bidIdStr = String(bid._id);
      const receipt = `b${bidIdStr.slice(-6)}${Date.now()}`.slice(0, 40);
      const options = {
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: {
          bidId: bidIdStr,
          purpose: 'advance_10pct',
        },
      };
      try {
        order = await razorpay.orders.create(options);
      } catch (rzpErr) {
        console.error('PAYMENT_ERROR (Razorpay orders.create):', rzpErr);
        if (demoFallback) {
          console.warn(
            'RAZORPAY_DEMO_FALLBACK enabled — using demo order. Fix Razorpay keys or disable fallback for live payments.'
          );
          order = createDemoOrder(advanceAmount, bid._id);
        } else {
          throw rzpErr;
        }
      }
    } else {
      if (!razorpay) {
        console.log('Using DEMO PAYMENT MODE - Configure Razorpay credentials in .env for real payments');
      } else if (forceDemo) {
        console.log('PAYMENTS_FORCE_DEMO set — using demo order (Razorpay keys ignored)');
      }
      order = createDemoOrder(advanceAmount, bid._id);
    }

    const usingLiveRazorpay = razorpay && order && !String(order.id || '').startsWith('demo_order_');
    const razorpayKeyId = usingLiveRazorpay ? process.env.RAZORPAY_KEY_ID_TEST || null : null;
    res.json({ order, advanceAmount, razorpayKeyId });
  } catch (error) {
    console.error('PAYMENT_ERROR:', error);
    res.status(500).json({ message: razorpayErrorMessage(error) });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bidId } = req.body;

    const bid = await Bid.findById(bidId);
    if (!bid) return res.status(404).json({ message: 'Negotiation not found' });

    const denied = assertCanPayBid(req, bid);
    if (denied) return res.status(denied.status).json({ message: denied.message });

    const orderIdStr = String(razorpay_order_id || '');

    // Demo orders only (do not trust client isDemoMode — id prefix is server-issued)
    if (orderIdStr.startsWith('demo_order_')) {
      console.log('Demo payment verified successfully');
      bid.advancePaymentDetails = {
        transactionId: razorpay_payment_id || `demo_${Date.now()}`,
        paidAmount: Math.round(bid.amount * 0.10),
        status: 'completed',
        isDemoMode: true,
        paidAt: new Date(),
      };
      applyAdvancePaidPipeline(bid);
      await bid.save();
      return res.status(200).json({ message: 'Demo payment verified successfully', isDemoMode: true });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET_TEST;
    if (!secret) {
      return res.status(500).json({ message: 'Server payment verification is not configured' });
    }
    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification fields' });
    }

    const sign = orderIdStr + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', secret).update(sign).digest('hex');

    if (razorpay_signature === expectedSign) {
      bid.advancePaymentDetails = {
        transactionId: razorpay_payment_id,
        paidAmount: Math.round(bid.amount * 0.10),
        status: 'completed',
        paidAt: new Date(),
      };
      applyAdvancePaidPipeline(bid);
      await bid.save();
      return res.status(200).json({ message: 'Payment verified successfully' });
    }
    return res.status(400).json({ message: 'Invalid signature' });
  } catch (error) {
    console.error('VERIFY_ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};
