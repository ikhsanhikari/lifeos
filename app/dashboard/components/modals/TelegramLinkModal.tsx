import React from 'react';
import { X, Send, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface TelegramLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  isGeneratingToken: boolean;
  linkTokenData: { token: string; telegramUrl: string; expiresAt: number } | null;
}

export const TelegramLinkModal: React.FC<TelegramLinkModalProps> = ({
  isOpen,
  onClose,
  isGeneratingToken,
  linkTokenData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Hubungkan Bot Telegram</h3>
          <p className="text-xs text-zinc-400">
            Sinkronkan habit, task, dan daily log langsung via percakapan Telegram.
          </p>
        </div>

        {isGeneratingToken && (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            <span>Membuat One-Time Token...</span>
          </div>
        )}

        {linkTokenData && !isGeneratingToken && (
          <div className="space-y-4">
            <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800/80 text-center space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-zinc-500 tracking-wider">
                Kode Token Integrasi
              </span>
              <p className="font-mono text-xl font-bold text-indigo-400 tracking-wider">
                {linkTokenData.token}
              </p>
              <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-medium">
                <Clock className="w-3 h-3" />
                <span>Berlaku selama 5 menit</span>
              </div>
            </div>

            <a
              href={linkTokenData.telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-center rounded-xl shadow-lg shadow-indigo-600/20 transition-all text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Buka Bot Telegram & Hubungkan</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>

            <p className="text-zinc-500 text-[11px] text-center leading-relaxed">
              Pop-up ini akan tertutup otomatis saat akun Telegram kamu terdeteksi terhubung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
