'use client';

import React, { useEffect, useState, Suspense } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

function MagicLinkCallbackHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (!token) {
      setStatus('error');
      setErrorMessage('Token magic login tidak ditemukan pada URL.');
      return;
    }

    async function verifyToken() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-magic-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const json = await res.json();

        if (json.success && json.token) {
          localStorage.setItem('lifeos_token', json.token);
          document.cookie = `lifeos_token=${json.token}; path=/; max-age=2592000; SameSite=Lax`;

          setStatus('success');
          setUserName(json.user?.name || 'User');

          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage(json.message || 'Gagal memverifikasi magic login token.');
        }
      } catch (err: any) {
        console.error('Error verifying magic link:', err);
        setStatus('error');
        setErrorMessage('Gagal terhubung ke backend server API.');
      }
    }

    verifyToken();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white font-sans">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="glass-card p-8 rounded-2xl max-w-md w-full border border-slate-800 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto animate-spin">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Memverifikasi Magic Login...</h2>
            <p className="text-slate-400 text-xs">Menyiapkan sesi login otomatis Anda di Life OS.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
              🎉
            </div>
            <h2 className="text-2xl font-black text-white">Login Berhasil!</h2>
            <p className="text-emerald-400 text-sm font-semibold">Selamat datang kembali, {userName} 👋</p>
            <p className="text-slate-400 text-xs">Mengalihkan Anda ke Web Dashboard secara otomatis...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto text-3xl">
              ❌
            </div>
            <h2 className="text-xl font-bold text-white">Verifikasi Magic Link Gagal</h2>
            <p className="text-rose-400 text-xs">{errorMessage}</p>
            <div className="pt-2">
              <a
                href="https://t.me/LifeOSBot"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-lg transition-all"
              >
                📱 Buka Bot Telegram & Minta Link Baru (/login)
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MagicLinkCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b0f19] text-white flex items-center justify-center">Loading...</div>}>
      <MagicLinkCallbackHandler />
    </Suspense>
  );
}
