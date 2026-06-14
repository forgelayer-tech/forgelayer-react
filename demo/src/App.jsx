import React, { useState } from 'react';
import { ForgeLayerButton, useForgeLayerCheckout, ForgeLayerModal } from 'forgelayer-react';

const PRODUCTS = [
  {
    id:    'LIC-001',
    name:  'Pro License',
    price: 49.99,
    desc:  'Lifetime updates. One-time payment.',
    chain: 'ethereum',
    token: 'USDT',
    emoji: '💎',
  },
  {
    id:     'SUB-002',
    name:   'Annual Plan',
    price:  119.88,
    desc:   'Billed annually. Cancel anytime.',
    chain:  'bitcoin',
    token:  'BTC',
    emoji:  '₿',
    window: 60,
  },
  {
    id:    'SVC-003',
    name:  'One-off Service',
    price: 25.00,
    desc:  'Tron network — near-zero gas fees.',
    chain: 'tron',
    token: 'USDT',
    emoji: '⚡',
  },
];

// ── Example using <ForgeLayerButton> (simple, self-contained) ──────────────
function ProductCard({ product, onPaid }) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{product.emoji}</div>
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>{product.name}</h2>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f7931a', margin: '0 0 8px' }}>
        ${product.price.toFixed(2)}
      </div>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>{product.desc}</p>
      <ForgeLayerButton
        amount={product.price}
        currency="USD"
        chain={product.chain}
        token={product.token}
        orderId={`${product.id}-${Date.now()}`}
        paymentWindow={product.window ?? 30}
        baseUrl="/fl"
        onSuccess={(order) => onPaid(product, order)}
        onExpired={() => alert('Payment window expired. Please try again.')}
      >
        {product.emoji} Pay ${product.price.toFixed(2)} with {product.token}
      </ForgeLayerButton>
    </div>
  );
}

// ── Example using the hook directly (full control) ─────────────────────────
function CustomCheckout() {
  const [amount, setAmount] = useState('10.00');

  const { modalState, order, timeLeft, error, open, close } = useForgeLayerCheckout({
    baseUrl: '/fl',
    onSuccess: (o) => console.log('Paid:', o),
  });

  const handlePay = () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) return alert('Enter a valid amount.');
    open({
      amount:   parsed,
      currency: 'USD',
      chain:    'ethereum',
      token:    'USDT',
      orderId:  'CUSTOM-' + Date.now(),
    });
  };

  return (
    <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
      <h2 style={{ fontSize: '1.1rem', margin: '0 0 6px' }}>Custom Amount</h2>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
        Hook usage — full control over when the modal opens.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>$</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: 110, padding: '10px 12px', border: '1px solid #d1d5db',
              borderRadius: 8, fontSize: 15, outline: 'none',
            }}
          />
        </div>
        <button
          onClick={handlePay}
          disabled={modalState !== 'closed'}
          style={{
            padding: '10px 22px', background: '#111', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
            cursor: modalState !== 'closed' ? 'not-allowed' : 'pointer',
            opacity: modalState !== 'closed' ? 0.6 : 1,
          }}
        >
          Pay with USDT
        </button>
      </div>

      {/* Render the modal separately when using the hook directly */}
      {modalState !== 'closed' && (
        <ForgeLayerModal
          modalState={modalState}
          order={order}
          timeLeft={timeLeft}
          error={error}
          onClose={close}
        />
      )}
    </div>
  );
}

// ── App shell ──────────────────────────────────────────────────────────────
export default function App() {
  const [successBanner, setSuccessBanner] = useState(null);

  const handlePaid = (product, order) => {
    setSuccessBanner({ product, order });
    setTimeout(() => setSuccessBanner(null), 6000);
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f6f7f9', minHeight: '100vh' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 20px' }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: '1.8rem', margin: '0 0 6px', color: '#111' }}>
            ⚡ ForgeLayer React
          </h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Drop-in React checkout components. Backend powered by{' '}
            <code style={{ background: '#f3f4f6', padding: '1px 6px', borderRadius: 4 }}>
              forgelayer-js-plugin
            </code>{' '}
            on port 4000.
          </p>
        </div>

        {/* Success banner */}
        {successBanner && (
          <div style={{
            background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 12,
            padding: '16px 20px', marginBottom: 28, color: '#065f46', fontWeight: 500,
          }}>
            ✅ Payment confirmed for <strong>{successBanner.product.name}</strong>!
            Order ID: <code>{successBanner.order.orderId}</code>
          </div>
        )}

        {/* Product grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} onPaid={handlePaid} />
          ))}
          <CustomCheckout />
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 28,
  boxShadow: '0 1px 4px rgba(0,0,0,.06)',
};
