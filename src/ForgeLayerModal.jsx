import React, { useEffect, useState } from 'react';

// Injected once — handles animations, hover, and pseudo-elements
// that can't be done with inline styles.
const MODAL_CSS = `
@keyframes fl-r-fade{from{opacity:0}to{opacity:1}}
@keyframes fl-r-up{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fl-r-spin{to{transform:rotate(360deg)}}
@keyframes fl-r-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.fl-r-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;
  display:flex;align-items:center;justify-content:center;padding:16px;
  animation:fl-r-fade .18s ease}
.fl-r-modal{background:#fff;border-radius:16px;width:100%;max-width:520px;
  box-shadow:0 24px 64px rgba(0,0,0,.28);overflow:hidden;
  animation:fl-r-up .22s ease;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  font-size:14px;color:#111}
.fl-r-spinner{width:38px;height:38px;border:3px solid #e5e7eb;
  border-top-color:#f7931a;border-radius:50%;
  animation:fl-r-spin .7s linear infinite;margin:0 auto 14px}
.fl-r-dot-pending{background:#f59e0b;animation:fl-r-pulse 1.6s ease-in-out infinite}
.fl-r-dot-confirmed{background:#10b981}
.fl-r-dot-expired{background:#ef4444}
.fl-r-xbtn:hover{background:#f3f4f6 !important;color:#111 !important}
.fl-r-cpbtn:hover{background:#f3f4f6 !important}
.fl-r-cpbtn-copied{border-color:#10b981 !important;color:#059669 !important}
@media(max-width:460px){.fl-r-grid{flex-direction:column !important;align-items:center !important}}
`;

let _cssInjected = false;
function ensureCSS() {
  if (_cssInjected || typeof document === 'undefined') return;
  _cssInjected = true;
  const el = document.createElement('style');
  el.textContent = MODAL_CSS;
  document.head.appendChild(el);
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ForgeLayerModal({ modalState, order, timeLeft, error, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => { ensureCSS(); }, []);

  // Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const copyAddress = () => {
    if (!order?.address) return;
    navigator.clipboard?.writeText(order.address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const urgent = timeLeft !== null && timeLeft <= 120;

  return (
    <div
      className="fl-r-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Crypto payment"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="fl-r-modal">

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 18px', borderBottom: '1px solid #e5e7eb', background: '#fafafa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 15, fontWeight: 700 }}>
            <div style={{
              width: 26, height: 26, background: '#f7931a', borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0,
            }}>FL</div>
            Pay with Crypto
          </div>
          <button
            className="fl-r-xbtn"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none', border: 'none', fontSize: 22, lineHeight: 1,
              cursor: 'pointer', color: '#6b7280', padding: '4px 8px',
              borderRadius: 5, transition: 'background .12s',
            }}
          >×</button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '20px 18px' }}>

          {/* Loading */}
          {modalState === 'loading' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div className="fl-r-spinner" />
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                Generating payment address…
              </p>
            </div>
          )}

          {/* Error */}
          {modalState === 'error' && (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Something went wrong</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>{error}</div>
            </div>
          )}

          {/* Payment */}
          {modalState === 'payment' && order && (
            <>
              {/* Status bar */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '9px 13px', borderRadius: 8,
                background: '#f9fafb', border: '1px solid #e5e7eb',
                marginBottom: 14, fontSize: 13,
              }}>
                <span
                  className="fl-r-dot-pending"
                  style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0 }}
                />
                <span>Awaiting payment…</span>
                <span style={{
                  marginLeft: 'auto', fontWeight: 600, fontSize: 13,
                  color: urgent ? '#ef4444' : '#374151',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {timeLeft !== null ? fmtTime(timeLeft) : '--:--'}
                </span>
              </div>

              {/* Network warning */}
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8,
                padding: '9px 13px', fontSize: 12, color: '#92400e',
                marginBottom: 14, lineHeight: 1.5,
              }}>
                <strong>⚠ Important:</strong> Send only <strong>{order.token}</strong> on the{' '}
                <strong>{order.chainName}</strong> network only. Wrong network = permanent loss.
              </div>

              {/* QR + info grid */}
              <div className="fl-r-grid" style={{ display: 'flex', gap: 18, marginBottom: 14 }}>
                {/* QR side */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <img
                    src={order.qrUrl}
                    alt={`Send to ${order.address}`}
                    width={148}
                    height={148}
                    style={{ border: '1px solid #e5e7eb', borderRadius: 10, display: 'block', background: '#f9fafb' }}
                  />
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Scan with wallet</p>
                </div>

                {/* Info side */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 13 }}>
                  {/* Amount */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                      Amount to Send
                    </label>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
                      {order.cryptoAmount
                        ? `${parseFloat(order.cryptoAmount).toFixed(8).replace(/\.?0+$/, '')} ${order.token}`
                        : `${order.currency} ${parseFloat(order.amount).toFixed(2)}`}
                    </div>
                    {order.cryptoAmount && (
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        ≈ {order.currency} {parseFloat(order.amount).toFixed(2)}
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                      Deposit Address
                    </label>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#374151', wordBreak: 'break-all', flex: 1, lineHeight: 1.5 }}>
                        {order.address}
                      </span>
                      <button
                        className={`fl-r-cpbtn${copied ? ' fl-r-cpbtn-copied' : ''}`}
                        onClick={copyAddress}
                        style={{
                          flexShrink: 0, background: '#fff', border: '1px solid #d1d5db',
                          borderRadius: 6, padding: '5px 11px', fontSize: 12,
                          cursor: 'pointer', color: '#374151',
                          transition: 'background .12s', whiteSpace: 'nowrap',
                        }}
                      >
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  {/* Network badge */}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
                      Network
                    </label>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', background: '#f3f4f6', borderRadius: 100, fontSize: 12, fontWeight: 500, color: '#374151' }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
                      {order.chainName} · {order.token}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Success */}
          {modalState === 'success' && (
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>✅</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#111', marginBottom: 7 }}>Payment Confirmed!</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>Your payment has been received.</div>
            </div>
          )}

          {/* Expired */}
          {modalState === 'expired' && (
            <div style={{ textAlign: 'center', padding: '30px 16px' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>⏳</div>
              <div style={{ fontSize: 19, fontWeight: 700, color: '#111', marginBottom: 7 }}>Payment Expired</div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                The payment window has closed. Please start a new payment.
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '10px 18px 14px', textAlign: 'center', fontSize: 11, color: '#9ca3af', borderTop: '1px solid #f3f4f6' }}>
          Secured by{' '}
          <a href="https://forgelayer.io" target="_blank" rel="noopener noreferrer" style={{ color: '#f7931a', textDecoration: 'none' }}>
            ForgeLayer
          </a>
        </div>
      </div>
    </div>
  );
}
