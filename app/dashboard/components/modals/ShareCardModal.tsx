'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Share2, Copy, MessageCircle, Send, X, Image, Smartphone, Layers, Check, Film, ChevronDown, Palette, Layout, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { generateAnimatedShareVideo } from './canvasVideoExporter';

export interface ShareCardData {
  date: string;
  dateShort: string;
  userName: string;
  habitsCompleted: number;
  habitsTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  focusScore: number;
  topStreak: { name: string; streak: number } | null;
  mood: number | null;
  energy: number | null;
  achievements: string[];
  highlights: string[];
  completedHabitNames?: string[];
  completedTaskTitles?: string[];
  journalSnippet?: string | null;
  activeGoalsCount?: number;
  quote: string;
  habitStreaks: Array<{
    habitId: string;
    habitName: string;
    currentStreak: number;
    isDoneToday: boolean;
  }>;
  recentMoodLogs: Array<{
    date: string;
    mood: number;
    energy: number;
  }>;
}

interface ShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardData: ShareCardData | null;
  isLoading: boolean;
}

type FormatType = 'square' | 'story' | 'carousel';
type ThemeType = 'strava' | 'cyber' | 'purple' | 'ocean' | 'dark' | 'sunset' | 'cyberpunk' | 'paper';

const FORMAT_OPTIONS: { key: FormatType; label: string; icon: React.ReactNode; size: string }[] = [
  { key: 'square', label: 'Square (Post)', icon: <Image className="w-4 h-4" />, size: '1080×1080' },
  { key: 'story', label: 'Story (9:16)', icon: <Smartphone className="w-4 h-4" />, size: '1080×1920' },
  { key: 'carousel', label: 'Carousel (4 Slides)', icon: <Layers className="w-4 h-4" />, size: '4 Slides' },
];

const THEME_OPTIONS: { key: ThemeType; label: string; colors: string[]; vibe: string }[] = [
  { key: 'strava', label: 'Strava Kinetic', colors: ['#0d0705', '#1f0d07', '#FC4C02'], vibe: 'Fitness Flex 🔥' },
  { key: 'cyber', label: 'Cyber Mint', colors: ['#03140e', '#082b1d', '#00E676'], vibe: 'Tech Neon ⚡' },
  { key: 'paper', label: 'Natural Kraft', colors: ['#f2e8d5', '#fffdf7', '#2e5a3c'], vibe: 'Natural Paper & Ink 📜' },
  { key: 'purple', label: 'Neon Violet', colors: ['#0f051d', '#1f0a3b', '#C084FC'], vibe: 'Spotify Wrapped 🎧' },
  { key: 'ocean', label: 'Sapphire Cyan', colors: ['#04101e', '#08213d', '#38BDF8'], vibe: 'Clean & Cool 🌊' },
  { key: 'dark', label: 'Obsidian Lime', colors: ['#09090b', '#18181b', '#A3E635'], vibe: 'Minimal Dark 🖤' },
  { key: 'sunset', label: 'Sunset Crimson', colors: ['#1f0910', '#2a0e18', '#FF6B00'], vibe: 'Golden Hour 🌅' },
  { key: 'cyberpunk', label: 'Cyberpunk Dual', colors: ['#090514', '#120a24', '#00F0FF'], vibe: 'Synthwave 🌆' },
];

const PRESET_WALLPAPERS = [
  { name: '🏔️ Mountain', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80' },
  { name: '🌆 Cyber City', url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&auto=format&fit=crop&q=80' },
  { name: '🏋️ Workout', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80' },
  { name: '🌌 Cosmic Space', url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&auto=format&fit=crop&q=80' },
];

function buildOgUrl(data: ShareCardData, format: FormatType, theme: ThemeType, slideIndex?: number, bgImage?: string | null): string {
  const baseData = { ...data };
  let url = `/og/daily-card?format=${format}&theme=${theme}&data=${encodeURIComponent(JSON.stringify(baseData))}`;
  if (format === 'carousel' && slideIndex !== undefined) {
    url += `&slide=${slideIndex}`;
  }
  if (bgImage && bgImage.startsWith('http') && bgImage.length < 500) {
    url += `&bgImage=${encodeURIComponent(bgImage)}`;
  }
  return url;
}

function getUniqueFilename(prefix: string, ext: string): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:T.]/g, '').substring(0, 14);
  const randomStr = Math.random().toString(36).substring(2, 6);
  return `${prefix}-${timestamp}-${randomStr}.${ext}`;
}

async function mergeBgAndCardImages(bgUrl: string, cardUrl: string, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unsupported');

  const [bgImg, cardImg] = await Promise.all([
    new Promise<HTMLImageElement | null>((res) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = bgUrl;
    }),
    new Promise<HTMLImageElement | null>((res) => {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => res(img);
      img.onerror = () => res(null);
      img.src = cardUrl;
    }),
  ]);

  if (bgImg) {
    const imgRatio = bgImg.width / bgImg.height;
    const canvasRatio = width / height;
    let dW = width;
    let dH = height;
    let dX = 0;
    let dY = 0;
    if (imgRatio > canvasRatio) {
      dW = height * imgRatio;
      dX = (width - dW) / 2;
    } else {
      dH = width / imgRatio;
      dY = (height - dH) / 2;
    }
    ctx.drawImage(bgImg, dX, dY, dW, dH);
    ctx.fillStyle = 'rgba(8, 8, 14, 0.65)';
    ctx.fillRect(0, 0, width, height);
  }

  if (cardImg) {
    ctx.drawImage(cardImg, 0, 0, width, height);
  }

  return new Promise((res) => canvas.toBlob((b) => res(b || new Blob([])), 'image/png'));
}

export function ShareCardModal({ isOpen, onClose, cardData, isLoading }: ShareCardModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('story');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('cyber');
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(true);
  const [carouselSlide, setCarouselSlide] = useState(0);

  // Build preview URL
  useEffect(() => {
    if (!cardData) return;
    setIsPreviewLoading(true);
    if (selectedFormat === 'carousel') {
      setPreviewUrl(buildOgUrl(cardData, 'carousel', selectedTheme, carouselSlide, customBgUrl));
    } else {
      setPreviewUrl(buildOgUrl(cardData, selectedFormat, selectedTheme, undefined, customBgUrl));
    }
  }, [cardData, selectedFormat, selectedTheme, carouselSlide, customBgUrl]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFormat('square');
      setSelectedTheme('strava');
      setCustomBgUrl(null);
      setCopySuccess(false);
      setCarouselSlide(0);
      setIsRecordingVideo(false);
      setVideoProgress(0);
    }
  }, [isOpen]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomBgUrl(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadVideo = useCallback(async () => {
    if (!cardData) return;
    setIsRecordingVideo(true);
    setVideoProgress(0);
    try {
      const videoBlob = await generateAnimatedShareVideo(
        cardData,
        selectedTheme,
        selectedFormat === 'story' ? 'story' : 'square',
        (pct) => setVideoProgress(pct),
        customBgUrl
      );

      const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = getUniqueFilename(`lifeos-${selectedFormat}-story`, ext);
      const videoFile = new File([videoBlob], fileName, { type: videoBlob.type });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [videoFile] })) {
        try {
          await navigator.share({
            title: 'Life OS Daily Story',
            text: 'Cek pencapaian produktivitas harian saya di Life OS!',
            files: [videoFile],
          });
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
        }
      }

      const blobUrl = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
    } catch (err) {
      console.error('Video recording failed:', err);
    } finally {
      setIsRecordingVideo(false);
    }
  }, [cardData, selectedTheme, selectedFormat, customBgUrl]);

  const handleDownload = useCallback(async () => {
    if (!previewUrl) return;
    setIsDownloading(true);
    try {
      const width = 1080;
      const height = selectedFormat === 'story' ? 1920 : 1080;

      if (selectedFormat === 'carousel') {
        for (let i = 0; i < 4; i++) {
          const url = buildOgUrl(cardData!, 'carousel', selectedTheme, i, customBgUrl);
          let blob: Blob;
          if (customBgUrl) {
            blob = await mergeBgAndCardImages(customBgUrl, url, width, height);
          } else {
            const response = await fetch(url);
            if (!response.ok) continue;
            blob = await response.blob();
          }
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = getUniqueFilename(`lifeos-slide-${i + 1}`, 'png');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
          await new Promise(r => setTimeout(r, 400));
        }
      } else {
        let blob: Blob;
        if (customBgUrl) {
          blob = await mergeBgAndCardImages(customBgUrl, previewUrl, width, height);
        } else {
          const response = await fetch(previewUrl);
          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}`);
          }
          blob = await response.blob();
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = getUniqueFilename(`lifeos-${selectedFormat}-card`, 'png');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [previewUrl, selectedFormat, selectedTheme, cardData, customBgUrl]);

  const handleCopyImage = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const width = 1080;
      const height = selectedFormat === 'story' ? 1920 : 1080;
      let blob: Blob;

      if (customBgUrl) {
        blob = await mergeBgAndCardImages(customBgUrl, previewUrl, width, height);
      } else {
        const response = await fetch(previewUrl);
        blob = await response.blob();
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      try {
        await navigator.clipboard.writeText(window.location.origin + previewUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {}
    }
  }, [previewUrl, customBgUrl, selectedFormat]);

  const [isSendingTelegram, setIsSendingTelegram] = useState(false);
  const [telegramSuccess, setTelegramSuccess] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const handleSendTelegram = async () => {
    setIsSendingTelegram(true);
    setTelegramSuccess(false);
    setTelegramError(null);
    try {
      const token = localStorage.getItem('lifeos_token');
      let customImageBase64: string | undefined = undefined;

      if (customBgUrl) {
        const width = 1080;
        const height = selectedFormat === 'story' ? 1920 : 1080;
        const mergedBlob = await mergeBgAndCardImages(customBgUrl, previewUrl, width, height);
        customImageBase64 = await new Promise<string>((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target?.result as string);
          reader.readAsDataURL(mergedBlob);
        });
      }

      const res = await fetch(`${API_BASE_URL}/api/share/send-telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          format: selectedFormat,
          theme: selectedTheme,
          slide: carouselSlide,
          bgImage: customBgUrl && customBgUrl.startsWith('http') ? customBgUrl : undefined,
          customImageBase64,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setTelegramSuccess(true);
        setTimeout(() => setTelegramSuccess(false), 4000);
      } else {
        setTelegramError(json.message || 'Gagal mengirim ke Telegram');
        setTimeout(() => setTelegramError(null), 4000);
      }
    } catch (err: any) {
      setTelegramError(err.message || 'Koneksi error');
      setTimeout(() => setTelegramError(null), 4000);
    } finally {
      setIsSendingTelegram(false);
    }
  };

  const handleShareTwitter = useCallback(() => {
    if (!cardData) return;
    const text = encodeURIComponent(
      `✨ My Daily Achievement — ${cardData.dateShort}\n\n` +
      `🎯 Habits: ${cardData.habitsCompleted}/${cardData.habitsTotal}\n` +
      `✅ Tasks: ${cardData.tasksCompleted}/${cardData.tasksTotal}\n` +
      `⭐ Focus Score: ${cardData.focusScore}%\n\n` +
      `#LifeOS #ProductivityFlex`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  }, [cardData]);

  const handleShareWhatsApp = useCallback(() => {
    if (!cardData) return;
    const text = encodeURIComponent(
      `✨ *Daily Achievement* — ${cardData.dateShort}\n\n` +
      `🎯 Habits: ${cardData.habitsCompleted}/${cardData.habitsTotal}\n` +
      `✅ Tasks: ${cardData.tasksCompleted}/${cardData.tasksTotal}\n` +
      `⭐ Focus Score: ${cardData.focusScore}%\n` +
      (cardData.topStreak ? `🔥 Streak: ${cardData.topStreak.name} (${cardData.topStreak.streak} days)\n` : '') +
      `\n_Generated by LifeOS_`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }, [cardData]);

  const handleShareTelegram = useCallback(() => {
    if (!cardData) return;
    const text = encodeURIComponent(
      `✨ Daily Achievement — ${cardData.dateShort}\n\n` +
      `🎯 Habits: ${cardData.habitsCompleted}/${cardData.habitsTotal}\n` +
      `✅ Tasks: ${cardData.tasksCompleted}/${cardData.tasksTotal}\n` +
      `⭐ Focus Score: ${cardData.focusScore}%`
    );
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${text}`, '_blank');
  }, [cardData]);

  if (!isOpen) return null;

  const currentThemeObj = THEME_OPTIONS.find(t => t.key === selectedTheme);
  const currentFormatObj = FORMAT_OPTIONS.find(f => f.key === selectedFormat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121215] border border-indigo-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-950/30">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#121215]/95 backdrop-blur-md border-b border-zinc-800 px-6 py-3.5 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-4.5 h-4.5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100">Share Achievement Card</h2>
              <p className="text-[11px] text-indigo-400 font-medium">Generate & share your daily productivity card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-1.5 rounded-xl transition-all"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="inline-block w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm font-semibold text-zinc-200">Memuat data produktivitas...</p>
            </div>
          ) : !cardData ? (
            <div className="py-12 text-center">
              <p className="text-zinc-400 text-sm">Tidak ada data untuk ditampilkan.</p>
            </div>
          ) : (
            <>
              {/* Compact Control Panel: Format & Theme Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                {/* Format Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Layout className="w-3 h-3 text-indigo-400" />
                      Format
                    </span>
                    <span className="text-indigo-400/80 font-mono text-[10px]">{currentFormatObj?.size}</span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedFormat}
                      onChange={(e) => {
                        setSelectedFormat(e.target.value as FormatType);
                        setCarouselSlide(0);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer pr-8"
                    >
                      {FORMAT_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} ({opt.size})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Theme Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Palette className="w-3 h-3 text-indigo-400" />
                      Theme
                    </span>
                    <div className="flex gap-1 items-center">
                      {currentThemeObj?.colors.map((c, i) => (
                        <span key={i} className="w-2.5 h-2.5 rounded-full inline-block border border-white/20" style={{ background: c }} />
                      ))}
                    </div>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedTheme}
                      onChange={(e) => setSelectedTheme(e.target.value as ThemeType)}
                      className="w-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 font-semibold focus:outline-none focus:border-indigo-500 transition-colors appearance-none cursor-pointer pr-8"
                    >
                      {THEME_OPTIONS.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label} — {opt.vibe}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Custom Background Photo Section */}
              <div className="space-y-1.5 bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/80">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3 text-indigo-400" />
                    Custom Background Photo (Wallpaper)
                  </span>
                  {customBgUrl && (
                    <button
                      onClick={() => setCustomBgUrl(null)}
                      className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-0.5 font-semibold"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus Foto
                    </button>
                  )}
                </label>

                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {/* Upload Local Image Button */}
                  <label className="flex-shrink-0 flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Foto Kamu</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>

                  {/* Preset Wallpapers */}
                  {PRESET_WALLPAPERS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => setCustomBgUrl(preset.url)}
                      className={`flex-shrink-0 text-xs py-1.5 px-2.5 rounded-lg border transition-all ${
                        customBgUrl === preset.url
                          ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold shadow-sm shadow-indigo-950/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Slide Selector */}
              {selectedFormat === 'carousel' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Slide Preview
                  </label>
                  <div className="flex gap-1.5">
                    {['Overview', 'Streaks', 'Mood Trend', 'Highlights'].map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselSlide(i)}
                        className={`flex-1 text-xs py-1.5 px-2 rounded-lg border transition-all ${
                          carouselSlide === i
                            ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300 font-semibold'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview */}
              <div>
                <div className="relative min-h-[200px] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-3">
                  {/* Custom Background Photo Layer */}
                  {customBgUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <img
                        src={customBgUrl}
                        alt="Custom Background"
                        className="w-full h-full object-cover filter brightness-[0.45] contrast-[1.05]"
                      />
                    </div>
                  )}

                  {isPreviewLoading && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/75 backdrop-blur-sm rounded-xl transition-all">
                      <div className="w-7 h-7 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-2" />
                      <span className="text-xs font-semibold text-indigo-300">Generasi Preview Gambar...</span>
                    </div>
                  )}
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Share Card Preview"
                      onLoad={() => setIsPreviewLoading(false)}
                      onError={() => setIsPreviewLoading(false)}
                      className={`relative z-10 rounded-lg shadow-2xl max-w-full transition-opacity duration-300 ${
                        isPreviewLoading ? 'opacity-30 blur-[2px]' : 'opacity-100 blur-0'
                      } ${selectedFormat === 'story' ? 'max-h-[360px]' : 'max-h-[300px]'}`}
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="space-y-2">
                  <button
                    onClick={handleDownloadVideo}
                    disabled={isRecordingVideo || isDownloading}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-gradient-to-r from-orange-500 via-rose-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-orange-950/40 active:scale-[0.98]"
                  >
                    {isRecordingVideo ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Rendering 60FPS Video Story... ({videoProgress}%)</span>
                      </>
                    ) : (
                      <>
                        <Film className="w-4.5 h-4.5 text-amber-200 animate-pulse" />
                        <span>Export Animated Video Story (60FPS) 🎬</span>
                      </>
                    )}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={isDownloading || isRecordingVideo}
                      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                    >
                      {isDownloading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {isDownloading ? 'Downloading...' : selectedFormat === 'carousel' ? 'Download All Slides' : 'Download PNG'}
                    </button>
                    <button
                      onClick={handleCopyImage}
                      className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs transition-all active:scale-[0.98] ${
                        copySuccess
                          ? 'bg-emerald-600 text-white'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copySuccess ? 'Copied!' : 'Copy Image'}
                    </button>
                  </div>

                  {/* Telegram Direct Send Button */}
                  <button
                    onClick={handleSendTelegram}
                    disabled={isSendingTelegram}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md active:scale-[0.98] ${
                      telegramSuccess
                        ? 'bg-emerald-600 text-white'
                        : telegramError
                        ? 'bg-rose-600 text-white'
                        : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-950/30'
                    }`}
                  >
                    {isSendingTelegram ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        <span>Sending to Telegram...</span>
                      </>
                    ) : telegramSuccess ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Terkirim ke Chat Telegram! ✈️</span>
                      </>
                    ) : telegramError ? (
                      <span>⚠️ {telegramError}</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-sky-200" />
                        <span>Kirim Langsung ke Telegram Bot ✈️</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Share Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mr-1">Share to:</span>
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-sky-500/20 border border-zinc-800 hover:border-sky-500/30 text-zinc-400 hover:text-sky-400 rounded-lg text-xs transition-all"
                    title="Share to X/Twitter"
                  >
                    <span className="text-xs font-black">𝕏</span>
                    <span>X</span>
                  </button>
                  <button
                    onClick={handleShareWhatsApp}
                    className="flex items-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-emerald-500/20 border border-zinc-800 hover:border-emerald-500/30 text-zinc-400 hover:text-emerald-400 rounded-lg text-xs transition-all"
                    title="Share to WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                  <button
                    onClick={handleShareTelegram}
                    className="flex items-center gap-1.5 py-2 px-3 bg-zinc-900 hover:bg-blue-500/20 border border-zinc-800 hover:border-blue-500/30 text-zinc-400 hover:text-blue-400 rounded-lg text-xs transition-all"
                    title="Share to Telegram"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Telegram</span>
                  </button>
                </div>

                <p className="text-[10px] text-zinc-600 text-center">
                  💡 Tip: Download the image first, then attach it manually when sharing to Instagram or other platforms.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
