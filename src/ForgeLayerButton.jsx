import React from 'react';
import { useForgeLayerCheckout } from './useForgeLayerCheckout.js';
import { ForgeLayerModal } from './ForgeLayerModal.jsx';

/**
 * Drop-in React checkout button.
 *
 * Usage:
 *   <ForgeLayerButton
 *     amount={49.99}
 *     currency="USD"
 *     chain="ethereum"
 *     token="USDT"
 *     orderId="ORDER-123"
 *     onSuccess={(order) => router.push('/thank-you')}
 *   >
 *     Pay $49.99
 *   </ForgeLayerButton>
 */
export function ForgeLayerButton({
  // Payment params
  amount,
  currency       = 'USD',
  chain          = 'ethereum',
  token          = 'USDT',
  orderId,
  paymentWindow,
  reuseAddress,
  // Backend base path (proxied or absolute)
  baseUrl        = '/fl',
  pollInterval,
  // Button UI
  label,
  children,
  className,
  style,
  disabled,
  // Callbacks
  onSuccess,
  onExpired,
  onError,
  onOpen,
  onClose,
}) {
  const { modalState, order, timeLeft, error, open, close } = useForgeLayerCheckout({
    baseUrl,
    pollInterval,
    onSuccess,
    onExpired,
    onError,
    onOpen,
    onClose,
  });

  const isOpen = modalState !== 'closed';

  const handleClick = () => {
    open({ amount, currency, chain, token, orderId, paymentWindow, reuseAddress });
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isOpen}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 24px',
          background: '#f7931a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: 15,
          fontWeight: 600,
          cursor: (disabled || isOpen) ? 'not-allowed' : 'pointer',
          opacity: (disabled || isOpen) ? 0.65 : 1,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          lineHeight: 1.2,
          transition: 'opacity .15s',
          ...style,
        }}
      >
        {label ?? children ?? 'Pay with Crypto'}
      </button>

      {isOpen && (
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
