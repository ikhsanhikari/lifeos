'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Share2, Copy, MessageCircle, Send, X, Image, Smartphone, Layers, Check, Film } from 'lucide-react';
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
type ThemeType = 'strava' | 'cyber' | 'purple' | 'ocean' | 'dark';

const FORMAT_OPTIONS: { key: FormatType; label: string; icon: React.ReactNode; size: string }[] = [
  { key: 'square', label: 'Square', icon: <Image className="w-4 h-4" />, size: '1080×1080' },
  { key: 'story', label: 'Story', icon: <Smartphone className="w-4 h-4" />, size: '1080×1920' },
  { key: 'carousel', label: 'Carousel', icon: <Layers className="w-4 h-4" />, size: '4 Slides' },
];

const THEME_OPTIONS: { key: ThemeType; label: string; colors: string[]; vibe: string }[] = [
  { key: 'strava', label: 'Strava Kinetic', colors: ['#0d0705', '#1f0d07', '#FC4C02'], vibe: 'Fitness Flex 🔥' },
  { key: 'cyber', label: 'Cyber Mint', colors: ['#03140e', '#082b1d', '#00E676'], vibe: 'Tech Neon ⚡' },
  { key: 'purple', label: 'Neon Violet', colors: ['#0f051d', '#1f0a3b', '#C084FC'], vibe: 'Spotify Wrapped 🎧' },
  { key: 'ocean', label: 'Sapphire Cyan', colors: ['#04101e', '#08213d', '#38BDF8'], vibe: 'Clean & Cool 🌊' },
  { key: 'dark', label: 'Obsidian Lime', colors: ['#09090b', '#18181b', '#A3E635'], vibe: 'Minimal Dark 🖤' },
];

function buildOgUrl(data: ShareCardData, format: FormatType, theme: ThemeType, slideIndex?: number): string {
  const baseData = { ...data };

  // For carousel, modify data per slide
  if (format === 'carousel' && slideIndex !== undefined) {
    const slideData: any = { ...baseData };
    if (slideIndex === 1) {
      // Slide 2: Streak breakdown
      slideData.highlights = [];
      slideData.achievements = [];
    } else if (slideIndex === 2) {
      // Slide 3: Mood trend (keep recentMoodLogs)
      slideData.highlights = [];
      slideData.achievements = [];
    } else if (slideIndex === 3) {
      // Slide 4: Highlights + reflection
      slideData.habitsCompleted = 0;
      slideData.habitsTotal = 0;
      slideData.tasksCompleted = 0;
      slideData.tasksTotal = 0;
    }
    const encoded = encodeURIComponent(JSON.stringify(slideData));
    return `/og/daily-card?format=square&theme=${theme}&data=${encoded}`;
  }

  const encoded = encodeURIComponent(JSON.stringify(baseData));
  return `/og/daily-card?format=${format}&theme=${theme}&data=${encoded}`;
}

export function ShareCardModal({ isOpen, onClose, cardData, isLoading }: ShareCardModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<FormatType>('square');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('strava');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [carouselSlide, setCarouselSlide] = useState(0);

  // Build preview URL
  useEffect(() => {
    if (!cardData) return;
    if (selectedFormat === 'carousel') {
      setPreviewUrl(buildOgUrl(cardData, 'square', selectedTheme, carouselSlide));
    } else {
      setPreviewUrl(buildOgUrl(cardData, selectedFormat, selectedTheme));
    }
  }, [cardData, selectedFormat, selectedTheme, carouselSlide]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSelectedFormat('square');
      setSelectedTheme('strava');
      setCopySuccess(false);
      setCarouselSlide(0);
      setIsRecordingVideo(false);
      setVideoProgress(0);
    }
  }, [isOpen]);

  const handleDownloadVideo = useCallback(async () => {
    if (!cardData) return;
    setIsRecordingVideo(true);
    setVideoProgress(0);
    try {
      const videoBlob = await generateAnimatedShareVideo(
        cardData,
        selectedTheme,
        selectedFormat === 'story' ? 'story' : 'square',
        (pct) => setVideoProgress(pct)
      );

      const blobUrl = URL.createObjectURL(videoBlob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
      link.download = `lifeos-animated-story.${ext}`;
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Video recording failed:', err);
    } finally {
      setIsRecordingVideo(false);
    }
  }, [cardData, selectedTheme, selectedFormat]);

  const handleDownload = useCallback(async () => {
    if (!previewUrl) return;
    setIsDownloading(true);
    try {
      if (selectedFormat === 'carousel') {
        // Download all 4 slides
        for (let i = 0; i < 4; i++) {
          const url = buildOgUrl(cardData!, 'square', selectedTheme, i);
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `lifeos-card-slide-${i + 1}.png`;
          link.click();
          URL.revokeObjectURL(blobUrl);
          // Small delay between downloads
          await new Promise(r => setTimeout(r, 300));
        }
      } else {
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `lifeos-${selectedFormat}-card.png`;
        link.click();
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  }, [previewUrl, selectedFormat, selectedTheme, cardData]);

  const handleCopyImage = useCallback(async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback: copy URL
      try {
        await navigator.clipboard.writeText(window.location.origin + previewUrl);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch {}
    }
  }, [previewUrl]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121215] border border-indigo-500/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-950/30">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-[#121215]/95 backdrop-blur-md border-b border-zinc-800 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Share Achievement</h2>
              <p className="text-xs text-indigo-400 font-medium">Generate & share your daily productivity card</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
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
              {/* Format Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => {
                        setSelectedFormat(opt.key);
                        setCarouselSlide(0);
                      }}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                        selectedFormat === opt.key
                          ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300 shadow-lg shadow-indigo-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-300'
                      }`}
                    >
                      {opt.icon}
                      <span className="text-xs font-semibold">{opt.label}</span>
                      <span className="text-[10px] opacity-60">{opt.size}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme Selector */}
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Theme
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setSelectedTheme(opt.key)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                        selectedTheme === opt.key
                          ? 'bg-indigo-500/15 border-indigo-500/40 shadow-lg shadow-indigo-950/30'
                          : 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80'
                      }`}
                    >
                      <div className="flex gap-1">
                        {opt.colors.map((c, i) => (
                          <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ background: c }} />
                        ))}
                      </div>
                      <span className={`text-xs font-semibold ${selectedTheme === opt.key ? 'text-indigo-300' : 'text-zinc-400'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-zinc-500">{opt.vibe}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Carousel Slide Selector */}
              {selectedFormat === 'carousel' && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                    Slide Preview
                  </label>
                  <div className="flex gap-2">
                    {['Overview', 'Streaks', 'Mood Trend', 'Highlights'].map((label, i) => (
                      <button
                        key={i}
                        onClick={() => setCarouselSlide(i)}
                        className={`flex-1 text-xs py-2 px-3 rounded-lg border transition-all ${
                          carouselSlide === i
                            ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-300'
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
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                  Preview
                </label>
                <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center p-4">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Share Card Preview"
                      className={`rounded-lg shadow-2xl max-w-full ${
                        selectedFormat === 'story' ? 'max-h-[400px]' : 'max-h-[320px]'
                      }`}
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
