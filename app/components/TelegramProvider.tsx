'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TelegramWebAppUser, TelegramWebAppData } from '../types/telegram';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface TelegramContextType {
  isTelegram: boolean;
  tgWebApp: TelegramWebAppData | null;
  tgUser: TelegramWebAppUser | null;
  initData: string | null;
  colorScheme: 'light' | 'dark';
  authStatus: 'idle' | 'authenticating' | 'authenticated' | 'error';
  authError: string | null;
  haptic: {
    light: () => void;
    medium: () => void;
    heavy: () => void;
    success: () => void;
    error: () => void;
    selection: () => void;
  };
  closeApp: () => void;
  expandApp: () => void;
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
  tgWebApp: null,
  tgUser: null,
  initData: null,
  colorScheme: 'dark',
  authStatus: 'idle',
  authError: null,
  haptic: {
    light: () => {},
    medium: () => {},
    heavy: () => {},
    success: () => {},
    error: () => {},
    selection: () => {},
  },
  closeApp: () => {},
  expandApp: () => {},
});

export const useTelegram = () => useContext(TelegramContext);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [isTelegram, setIsTelegram] = useState(false);
  const [tgWebApp, setTgWebApp] = useState<TelegramWebAppData | null>(null);
  const [tgUser, setTgUser] = useState<TelegramWebAppUser | null>(null);
  const [initData, setInitData] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('dark');
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'authenticated' | 'error'>('idle');
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webApp = window.Telegram?.WebApp;
    if (!webApp) return;

    // Check if running inside actual Telegram environment
    const hasInitData = Boolean(webApp.initData && webApp.initData.length > 0);
    const hasPlatform = Boolean(webApp.platform && webApp.platform !== 'unknown');

    if (hasInitData || hasPlatform) {
      setIsTelegram(true);
      setTgWebApp(webApp);
      setInitData(webApp.initData || null);

      if (webApp.initDataUnsafe?.user) {
        setTgUser(webApp.initDataUnsafe.user);
      }

      if (webApp.colorScheme) {
        setColorScheme(webApp.colorScheme);
      }

      try {
        webApp.ready();
        webApp.expand();
      } catch (e) {
        console.warn('Error calling Telegram.WebApp ready/expand:', e);
      }
    }
  }, []);

  // Zero-Click Auto Authentication when Telegram initData is available
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const webApp = window.Telegram?.WebApp;
    const rawInitData = webApp?.initData;

    if (!rawInitData) return;

    async function autoAuthenticate() {
      try {
        setAuthStatus('authenticating');
        const res = await fetch(`${API_BASE_URL}/api/auth/telegram-webapp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: rawInitData }),
        });

        const json = await res.json();

        if (json.success && json.token) {
          localStorage.setItem('lifeos_token', json.token);
          document.cookie = `lifeos_token=${json.token}; path=/; max-age=2592000; SameSite=Lax`;
          setAuthStatus('authenticated');
          setAuthError(null);
        } else {
          console.warn('Telegram WebApp auth failed:', json.message);
          setAuthStatus('error');
          setAuthError(json.message || 'Gagal verifikasi Telegram WebApp');
        }
      } catch (err: any) {
        console.error('Error auto-authenticating Telegram WebApp:', err);
        setAuthStatus('error');
        setAuthError(err.message || 'Gagal terhubung ke server');
      }
    }

    autoAuthenticate();
  }, []);

  // Telegram Native BackButton integration
  useEffect(() => {
    if (!tgWebApp?.BackButton) return;

    const backButton = tgWebApp.BackButton;
    const isRootPage = pathname === '/' || pathname === '/dashboard';

    if (!isRootPage) {
      backButton.show();
      const handleBackClick = () => {
        router.back();
      };
      backButton.onClick(handleBackClick);

      return () => {
        backButton.offClick(handleBackClick);
        backButton.hide();
      };
    } else {
      backButton.hide();
    }
  }, [pathname, router, tgWebApp]);

  const haptic = {
    light: () => tgWebApp?.HapticFeedback?.impactOccurred('light'),
    medium: () => tgWebApp?.HapticFeedback?.impactOccurred('medium'),
    heavy: () => tgWebApp?.HapticFeedback?.impactOccurred('heavy'),
    success: () => tgWebApp?.HapticFeedback?.notificationOccurred('success'),
    error: () => tgWebApp?.HapticFeedback?.notificationOccurred('error'),
    selection: () => tgWebApp?.HapticFeedback?.selectionChanged(),
  };

  const closeApp = () => {
    try {
      tgWebApp?.close();
    } catch (e) {
      console.warn('Failed to close Telegram WebApp:', e);
    }
  };

  const expandApp = () => {
    try {
      tgWebApp?.expand();
    } catch (e) {
      console.warn('Failed to expand Telegram WebApp:', e);
    }
  };

  return (
    <TelegramContext.Provider
      value={{
        isTelegram,
        tgWebApp,
        tgUser,
        initData,
        colorScheme,
        authStatus,
        authError,
        haptic,
        closeApp,
        expandApp,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
}
