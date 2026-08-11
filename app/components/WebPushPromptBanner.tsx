'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Loader2, Sparkles } from 'lucide-react';
import { useWebPush } from '../hooks/useWebPush';

export const WebPushPromptBanner: React.FC = () => {
  const { isSupported, isSubscribed, permission, isLoading, subscribe } = useWebPush();
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasSubscribedSuccess, setHasSubscribedSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Only show prompt if browser supports WebPush, permission is 'default', not yet subscribed, and not dismissed in current session
    if (typeof window !== 'undefined') {
      const dismissed = sessionStorage.getItem('lifeos_hide_push_prompt');
      if (isSupported && !isSubscribed && permission === 'default' && !dismissed) {
        // Small delay for smooth entry after page load
        const timer = setTimeout(() => setIsVisible(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isSupported, isSubscribed, permission]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lifeos_hide_push_prompt', 'true');
    }
  };

  const handleSubscribe = async () => {
    const success = await subscribe();
    if (success) {
      setHasSubscribedSuccess(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-slide-up">
      <div className="p-4 rounded-2xl bg-zinc-950/95 border border-violet-500/40 shadow-2xl shadow-violet-950/40 backdrop-blur-xl relative overflow-hidden space-y-3">
        {/* Glow accent */}
        <div className="absolute -top-12 -right-12 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-300 shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs font-bold text-zinc-100 tracking-tight">Aktifkan Web Push Notification</h3>
                <Sparkles className="w-3 h-3 text-amber-400" />
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug mt-0.5">
                Dapatkan notifikasi pengingat habit & tugas harian kamu langsung di desktop / Android.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasSubscribedSuccess ? (
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>Notifikasi berhasil diaktifkan! Terimakasih 🎉</span>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-800/60">
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleSubscribe}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-violet-950/40 flex items-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Bell className="w-3.5 h-3.5" />
                  <span>Izinkan Notifikasi 🔔</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
