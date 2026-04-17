const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const jwt = require('jsonwebtoken');
const { prisma } = require('../database');

const router = express.Router();

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.userId = decoded.id;
    next();
  });
};

// Create checkout session for token or edit pack purchases
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  const { type } = req.body;

  try {
    let priceData;
    if (type === 'tokens') {
      priceData = {
        currency: 'gbp',
        product_data: {
          name: '10 Tokens Pack',
          description: '10 tokens for generating and editing games'
        },
        unit_amount: 1000,
      };
    } else if (type === 'edits') {
      priceData = {
        currency: 'gbp',
        product_data: {
          name: '5 Edit Pack',
          description: '5 extra edits for the master prompt or game code'
        },
        unit_amount: 100,
      };
    } else {
      return res.status(400).json({ error: 'Invalid payment type' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: priceData,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.userId,
        type,
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create subscription
router.post('/create-subscription', verifyToken, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: 'Monthly Subscription',
            description: 'Unlock premium features'
          },
          unit_amount: 500, // £5 in pence
          recurring: {
            interval: 'month'
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      metadata: {
        userId: req.userId
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle successful payments
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, type } = session.metadata || {};

      if (session.mode === 'subscription') {
        const subscriptionEnd = new Date();
        subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

        await prisma.user.update({
          where: { id: parseInt(userId) },
          data: {
            subscription_active: true,
            subscription_end: subscriptionEnd
          }
        });

        await prisma.payment.create({
          data: {
            user_id: parseInt(userId),
            stripe_payment_id: session.payment_intent || session.id,
            amount: session.amount_total || 0,
            currency: session.currency || 'gbp',
            type: 'subscription',
            tokens_purchased: 0
          }
        });
      } else if (session.mode === 'payment' && type) {
        let tokensToAdd = 0;
        if (type === 'tokens') tokensToAdd = 10;
        if (type === 'edits') tokensToAdd = 5;

        await prisma.user.update({
          where: { id: parseInt(userId) },
          data: { tokens: { increment: tokensToAdd } }
        });

        await prisma.payment.create({
          data: {
            user_id: parseInt(userId),
            stripe_payment_id: session.payment_intent || session.id,
            amount: session.amount_total || 0,
            currency: session.currency || 'gbp',
            type,
            tokens_purchased: tokensToAdd
          }
        });
      }
    }
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).send('Internal Server Error');
  }

  res.json({ received: true });
});

module.exports = router;