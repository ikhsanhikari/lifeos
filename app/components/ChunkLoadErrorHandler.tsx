'use client';

import { useEffect } from 'react';

/**
 * Component to handle ChunkLoadError gracefully when new deployments replace static build chunks.
 * Automatically reloads the page when a stale chunk fetch fails (MIME type / 404 error).
 */
export function ChunkLoadErrorHandler() {
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason;
      const errorMessage = error?.message || error?.toString() || '';
      const errorName = error?.name || '';

      if (
        errorName === 'ChunkLoadError' ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('MIME type') ||
        errorMessage.includes('minified React error #423') ||
        errorMessage.includes('minified React error #418')
      ) {
        console.warn('⚠️ Stale deployment chunk detected. Refreshing page to fetch updated assets...');
        event.preventDefault();
        window.location.reload();
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const errorMessage = event.message || '';
      if (
        errorMessage.includes('Loading chunk') ||
        errorMessage.includes('ChunkLoadError') ||
        errorMessage.includes('MIME type')
      ) {
        console.warn('⚠️ Script chunk error caught. Refreshing page...');
        window.location.reload();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleWindowError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleWindowError);
    };
  }, []);

  return null;
}
