# forgelayer-react

> React components for crypto checkout powered by [ForgeLayer](https://forgelayer.io).

Drop a `<ForgeLayerButton>` anywhere in your React app and get a full crypto payment modal — QR code, countdown timer, live status polling, and success/expired states — with zero UI dependencies.

---

## Install

```bash
npm install forgelayer-react
```

Requires React 17 or later. Pairs with [`forgelayer-node`](https://github.com/forgelayer/forgelayer-node) on the backend.

---

## Quick Start

```jsx
import { ForgeLayerButton } from 'forgelayer-react';

export default function ProductPage() {
  return (
    <ForgeLayerButton
      amount={49.99}
      currency="USD"
      chain="ethereum"
      token="USDT"
      orderId="ORDER-123"
      baseUrl="/fl"
      onSuccess={(order) => console.log('Paid!', order)}
    >
      Pay $49.99 with USDT
    </ForgeLayerButton>
  );
}
```

---

## How It Works

```
<ForgeLayerButton> clicked
   │
   ├── POST /fl/create   →  Node.js backend (forgelayer-node)
   │                         generates deposit address + crypto amount
   │
   ├── modal opens       →  QR code + address + countdown timer
   │
   └── GET /fl/status    →  polls every 15 seconds
         ├── pending      →  keep showing modal
         ├── confirmed    →  show success state, fire onSuccess()
         └── expired      →  show expired state, fire onExpired()
```

All API calls go to your own backend — the React component never talks to ForgeLayer directly.

---

## Proxy Setup

In development, proxy `/fl` to your Node.js backend in `vite.config.js`:

```js
export default {
  server: {
    proxy: {
      '/fl': 'http://localhost:3000',
    },
  },
};
```

In production, your reverse proxy (nginx/Caddy) handles it.

---

## Components

### `<ForgeLayerButton>`

Self-contained button + modal. The simplest way to add crypto checkout.

```jsx
<ForgeLayerButton
  // Payment params
  amount={49.99}
  currency="USD"           // default: 'USD'
  chain="ethereum"         // ethereum | bsc | tron | bitcoin
  token="USDT"             // any token supported by your backend
  orderId="ORDER-123"      // your order ID
  paymentWindow={30}       // minutes before payment expires (default: 30)
  reuseAddress={false}     // reuse deposit address for same orderId

  // Backend
  baseUrl="/fl"            // path where forgelayer-node is mounted

  // Button UI
  label="Pay with Crypto"  // overridden by children if provided
  className="my-btn"       // optional CSS class
  style={{ width: '100%' }}

  // Callbacks
  onSuccess={(order) => router.push('/thank-you')}
  onExpired={() => setShowExpiredMsg(true)}
  onError={(err) => console.error(err)}
>
  Pay $49.99 with USDT
</ForgeLayerButton>
```

---

### `useForgeLayerCheckout(options)`

Hook for full control — use when you need to trigger checkout from your own button, form, or custom event.

```jsx
import { useForgeLayerCheckout, ForgeLayerModal } from 'forgelayer-react';

function CustomCheckout() {
  const { modalState, order, timeLeft, error, open, close } = useForgeLayerCheckout({
    baseUrl:   '/fl',
    onSuccess: (order) => console.log('Confirmed:', order),
    onExpired: ()      => console.log('Expired'),
    onError:   (err)   => console.error(err),
  });

  return (
    <>
      <button onClick={() => open({ amount: 25, currency: 'USD', chain: 'tron', token: 'USDT', orderId: 'ORDER-1' })}>
        Pay with Crypto
      </button>

      {modalState !== 'closed' && (
        <ForgeLayerModal
          modalState={modalState}
          order={order}
          timeLeft={timeLeft}
          error={error}
          onClose={close}
        />
      )}
    </>
  );
}
```

**`open(params)`** — opens the modal and calls `/fl/create`.

| Param | Type | Description |
|---|---|---|
| `amount` | `number` | Fiat amount to charge |
| `currency` | `string` | ISO currency code (e.g. `'USD'`) |
| `chain` | `string` | `ethereum` \| `bsc` \| `tron` \| `bitcoin` |
| `token` | `string` | Token symbol (e.g. `'USDT'`, `'ETH'`, `'BTC'`) |
| `orderId` | `string` | Your order ID |
| `paymentWindow` | `number` | Minutes until expiry (default: `30`) |

**Hook return values:**

| Value | Type | Description |
|---|---|---|
| `modalState` | `string` | `'closed'` \| `'loading'` \| `'payment'` \| `'success'` \| `'expired'` \| `'error'` |
| `order` | `object \| null` | Response from `/fl/create` |
| `timeLeft` | `number \| null` | Seconds remaining in payment window |
| `error` | `string \| null` | Error message if `modalState === 'error'` |
| `open(params)` | `function` | Start a new checkout session |
| `close()` | `function` | Close the modal and reset state |

---

### `<ForgeLayerModal>`

The modal UI on its own. Used alongside `useForgeLayerCheckout` for custom layouts.

```jsx
<ForgeLayerModal
  modalState={modalState}   // from useForgeLayerCheckout
  order={order}
  timeLeft={timeLeft}
  error={error}
  onClose={close}
/>
```

---

## Modal States

| State | What the user sees |
|---|---|
| `loading` | Spinner — "Generating payment address…" |
| `payment` | QR code, deposit address, amount, countdown timer |
| `success` | ✅ Payment Confirmed |
| `expired` | ⏳ Payment Expired |
| `error` | ⚠️ Error message |

---

## Full Example

```jsx
import { ForgeLayerButton } from 'forgelayer-react';

const PRODUCTS = [
  { id: 'PRO-001', name: 'Pro License',  price: 49.99, chain: 'ethereum', token: 'USDT' },
  { id: 'PLAN-002', name: 'Annual Plan', price: 119.88, chain: 'bitcoin',  token: 'BTC'  },
];

export default function Shop() {
  return (
    <div>
      {PRODUCTS.map((p) => (
        <div key={p.id}>
          <h2>{p.name} — ${p.price}</h2>
          <ForgeLayerButton
            amount={p.price}
            chain={p.chain}
            token={p.token}
            orderId={p.id}
            baseUrl="/fl"
            onSuccess={() => alert('Payment received!')}
          >
            Pay with {p.token}
          </ForgeLayerButton>
        </div>
      ))}
    </div>
  );
}
```

---

## Backend

This package is the frontend half. You need [`forgelayer-node`](https://github.com/forgelayer/forgelayer-node) on your Express server:

```bash
npm install forgelayer-node
```

```js
const { createCheckout } = require('forgelayer-node');
app.use('/fl', createCheckout({ apiKey: process.env.FORGELAYER_API_KEY }).middleware());
```

---

## License

MIT
