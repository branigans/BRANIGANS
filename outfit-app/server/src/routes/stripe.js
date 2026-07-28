const express = require('express');
const prisma = require('../db');
const stripe = require('../lib/stripe');
const { requireAuth } = require('../middleware/auth');
const { me } = require('../lib/serialize');

const router = express.Router();

router.post('/create-checkout-session', requireAuth, async (req, res) => {
  try {
    let customerId = req.user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.displayName,
        metadata: { userId: req.user.id }
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: req.user.id }, data: { stripeCustomerId: customerId } });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/suscripcion?estado=exito`,
      cancel_url: `${process.env.CLIENT_URL}/suscripcion?estado=cancelado`,
      metadata: { userId: req.user.id }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] create-checkout-session', err);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
});

router.get('/portal', requireAuth, async (req, res) => {
  if (!req.user.stripeCustomerId) {
    return res.status(400).json({ error: 'Este usuario aún no tiene un cliente de Stripe' });
  }
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.user.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/perfil`
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[stripe] portal', err);
    res.status(500).json({ error: 'No se pudo abrir el portal de facturación' });
  }
});

// Exportado aparte y montado con express.raw() en index.js, antes de express.json(),
// porque Stripe necesita el body sin parsear para verificar la firma.
async function webhookHandler(req, res) {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe] webhook signature inválida', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.subscription && session.customer) {
          await applySubscriptionFromId(session.subscription, session.customer);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.created': {
        const sub = event.data.object;
        await applySubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await prisma.user.updateMany({
          where: { stripeCustomerId: sub.customer },
          data: { subscriptionStatus: 'canceled' }
        });
        break;
      }
      default:
        break;
    }
    res.json({ received: true });
  } catch (err) {
    console.error('[stripe] webhook handler error', err);
    res.status(500).json({ error: 'Error procesando el evento' });
  }
}

async function applySubscriptionFromId(subscriptionId, customerId) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  await applySubscription(sub, customerId);
}

async function applySubscription(sub, customerIdOverride) {
  const customerId = customerIdOverride || sub.customer;
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: sub.status,
      subscriptionCurrentPeriodEnd: new Date(sub.current_period_end * 1000)
    }
  });
}

module.exports = { router, webhookHandler };
