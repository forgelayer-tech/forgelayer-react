'use strict';
import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Core hook — handles all state and API calls for the checkout flow.
 *
 * modalState values:
 *   'closed' | 'loading' | 'payment' | 'success' | 'expired' | 'error'
 */
export function useForgeLayerCheckout({ baseUrl = '/fl', onSuccess, onExpired, onError } = {}) {
  const [modalState, setModalState] = useState('closed');
  const [order,      setOrder]      = useState(null);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [error,      setError]      = useState(null);

  const pollRef = useRef(null);
  const cdRef   = useRef(null);

  const stopTimers = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (cdRef.current)   { clearInterval(cdRef.current);   cdRef.current   = null; }
  }, []);

  // Cleanup on unmount
  useEffect(() => stopTimers, [stopTimers]);

  const close = useCallback(() => {
    stopTimers();
    setModalState('closed');
    setOrder(null);
    setTimeLeft(null);
    setError(null);
  }, [stopTimers]);

  const startCountdown = useCallback((expiresAt) => {
    if (cdRef.current) clearInterval(cdRef.current);
    const tick = () => {
      const rem = expiresAt - Math.floor(Date.now() / 1000);
      setTimeLeft(rem <= 0 ? 0 : rem);
      if (rem <= 0) clearInterval(cdRef.current);
    };
    tick();
    cdRef.current = setInterval(tick, 1000);
  }, []);

  const startPolling = useCallback((orderData) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${baseUrl}/status?session=${encodeURIComponent(orderData.sessionKey)}`);
        const data = await res.json();
        if (!data.ok) return;
        if (data.status === 'confirmed') {
          stopTimers();
          setModalState('success');
          onSuccess?.(orderData);
        } else if (data.status === 'expired') {
          stopTimers();
          setModalState('expired');
          onExpired?.();
        }
      } catch (_) {}
    }, 15_000);
  }, [baseUrl, stopTimers, onSuccess, onExpired]);

  const open = useCallback(async (params) => {
    stopTimers();
    setModalState('loading');
    setOrder(null);
    setTimeLeft(null);
    setError(null);

    try {
      const res  = await fetch(`${baseUrl}/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(params),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Failed to generate payment address.');
      setOrder(data);
      setModalState('payment');
      startCountdown(data.expiresAt);
      startPolling(data);
    } catch (e) {
      setError(e.message);
      setModalState('error');
      onError?.(e);
    }
  }, [baseUrl, stopTimers, startCountdown, startPolling, onError]);

  return { modalState, order, timeLeft, error, open, close };
}
