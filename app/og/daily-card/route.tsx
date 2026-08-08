import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Theme color configurations
const THEMES: Record<string, {
  bg1: string; bg2: string; bg3: string;
  accent1: string; accent2: string; glow: string;
  text: string; textSub: string; textMuted: string;
  cardBg: string; cardBorder: string;
}> = {
  dark: {
    bg1: '#09090b', bg2: '#1a0a2e', bg3: '#0d1117',
    accent1: '#818cf8', accent2: '#34d399', glow: '#6366f1',
    text: '#f4f4f5', textSub: '#a1a1aa', textMuted: '#71717a',
    cardBg: 'rgba(255,255,255,0.06)', cardBorder: 'rgba(255,255,255,0.1)',
  },
  purple: {
    bg1: '#0d0015', bg2: '#1a0033', bg3: '#0f0020',
    accent1: '#c084fc', accent2: '#f472b6', glow: '#a855f7',
    text: '#faf5ff', textSub: '#c4b5fd', textMuted: '#8b5cf6',
    cardBg: 'rgba(168,85,247,0.08)', cardBorder: 'rgba(168,85,247,0.2)',
  },
  ocean: {
    bg1: '#0a1628', bg2: '#0d2847', bg3: '#0c1e3a',
    accent1: '#38bdf8', accent2: '#2dd4bf', glow: '#0ea5e9',
    text: '#f0f9ff', textSub: '#7dd3fc', textMuted: '#38bdf8',
    cardBg: 'rgba(14,165,233,0.08)', cardBorder: 'rgba(14,165,233,0.2)',
  },
  sunset: {
    bg1: '#1a0a00', bg2: '#2d1500', bg3: '#1f0e00',
    accent1: '#fbbf24', accent2: '#f97316', glow: '#f59e0b',
    text: '#fffbeb', textSub: '#fcd34d', textMuted: '#f59e0b',
    cardBg: 'rgba(245,158,11,0.08)', cardBorder: 'rgba(245,158,11,0.2)',
  },
};

function getMoodEmoji(mood: number | null): string {
  if (!mood) return '—';
  if (mood >= 5) return '😊';
  if (mood >= 4) return '🙂';
  if (mood >= 3) return '😐';
  if (mood >= 2) return '🙁';
  return '😢';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'square';
    const themeKey = searchParams.get('theme') || 'dark';
    const dataParam = searchParams.get('data');

    // Parse card data from query param
    let cardData: any = null;
    if (dataParam) {
      try {
        cardData = JSON.parse(decodeURIComponent(dataParam));
      } catch {
        return new Response('Invalid data parameter', { status: 400 });
      }
    }

    if (!cardData) {
      return new Response('Missing data parameter', { status: 400 });
    }

    const theme = THEMES[themeKey] || THEMES.dark;

    // Dimensions based on format
    const width = 1080;
    const height = format === 'story' ? 1920 : 1080;

    const focusPercent = cardData.focusScore || 0;

    if (format === 'story') {
      return new ImageResponse(
        (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: '80px 60px',
              background: `linear-gradient(170deg, ${theme.bg1} 0%, ${theme.bg2} 50%, ${theme.bg3} 100%)`,
              fontFamily: 'Inter, system-ui, sans-serif',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Glow Effect */}
            <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}15, transparent 70%)`, display: 'flex' }} />
            <div style={{ position: 'absolute', bottom: '-150px', left: '-150px', width: '500px', height: '500px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.accent2}10, transparent 70%)`, display: 'flex' }} />

            {/* Header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '32px' }}>✨</span>
                <span style={{ fontSize: '28px', fontWeight: 800, color: theme.accent1, textTransform: 'uppercase', letterSpacing: '4px' }}>Daily Achievement</span>
              </div>
              <span style={{ fontSize: '26px', color: theme.textSub, fontWeight: 500 }}>{cardData.date}</span>
              <span style={{ fontSize: '36px', fontWeight: 800, color: theme.text }}>{cardData.userName}</span>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Habits & Tasks Row */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '28px' }}>🎯</span>
                  <span style={{ fontSize: '64px', fontWeight: 900, color: theme.accent1, lineHeight: 1.1 }}>{cardData.habitsCompleted}/{cardData.habitsTotal}</span>
                  <span style={{ fontSize: '22px', color: theme.textSub, fontWeight: 600 }}>Habits</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                  <span style={{ fontSize: '28px' }}>✅</span>
                  <span style={{ fontSize: '64px', fontWeight: 900, color: theme.accent2, lineHeight: 1.1 }}>{cardData.tasksCompleted}/{cardData.tasksTotal}</span>
                  <span style={{ fontSize: '22px', color: theme.textSub, fontWeight: 600 }}>Tasks</span>
                </div>
              </div>

              {/* Focus Score */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '32px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '24px', color: theme.textSub, fontWeight: 600 }}>⭐ Focus Score</span>
                  <span style={{ fontSize: '48px', fontWeight: 900, color: theme.accent1 }}>{focusPercent}%</span>
                </div>
                <div style={{ display: 'flex', width: '100%', height: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${focusPercent}%`, height: '100%', borderRadius: '8px', background: `linear-gradient(90deg, ${theme.accent1}, ${theme.accent2})` }} />
                </div>
              </div>

              {/* Streak & Mood Row */}
              <div style={{ display: 'flex', gap: '24px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '8px' }}>
                  <span style={{ fontSize: '28px' }}>🔥</span>
                  <span style={{ fontSize: '22px', color: theme.textSub, fontWeight: 600 }}>Best Streak</span>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: theme.text }}>
                    {cardData.topStreak ? `${cardData.topStreak.name} (${cardData.topStreak.streak}d)` : '—'}
                  </span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '32px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>{getMoodEmoji(cardData.mood)}</span>
                    <span style={{ fontSize: '22px', color: theme.textSub, fontWeight: 600 }}>Mood</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '28px' }}>⚡</span>
                    <span style={{ fontSize: '22px', color: theme.textSub, fontWeight: 600 }}>Energy: {cardData.energy || '—'}/5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Achievements */}
            {cardData.achievements && cardData.achievements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {cardData.achievements.slice(0, 4).map((badge: string, i: number) => (
                  <div key={i} style={{ display: 'flex', padding: '12px 20px', borderRadius: '16px', background: `${theme.accent1}15`, border: `1px solid ${theme.accent1}30`, fontSize: '20px', color: theme.accent1, fontWeight: 700 }}>
                    {badge}
                  </div>
                ))}
              </div>
            )}

            {/* Highlight */}
            {cardData.highlights && cardData.highlights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '28px', borderRadius: '20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                <span style={{ fontSize: '18px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>── Highlight ──</span>
                <span style={{ fontSize: '24px', color: theme.text, fontStyle: 'italic', fontWeight: 500 }}>
                  &ldquo;{cardData.highlights[0]}&rdquo;
                </span>
              </div>
            )}

            {/* Quote + Branding */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
              {cardData.quote && (
                <span style={{ fontSize: '20px', color: theme.textMuted, fontStyle: 'italic', textAlign: 'center' }}>
                  &ldquo;{cardData.quote}&rdquo;
                </span>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{ fontSize: '20px', color: theme.textMuted, fontWeight: 700, letterSpacing: '2px' }}>lifeos.app</span>
              </div>
            </div>
          </div>
        ),
        { width, height }
      );
    }

    // Square format (default) — also used for carousel slides
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '60px',
            background: `linear-gradient(135deg, ${theme.bg1} 0%, ${theme.bg2} 60%, ${theme.bg3} 100%)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow Effects */}
          <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '400px', height: '400px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}15, transparent 70%)`, display: 'flex' }} />
          <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '350px', height: '350px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.accent2}10, transparent 70%)`, display: 'flex' }} />

          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>✨</span>
              <span style={{ fontSize: '22px', fontWeight: 800, color: theme.accent1, textTransform: 'uppercase', letterSpacing: '3px' }}>Daily Achievement</span>
            </div>
            <span style={{ fontSize: '20px', color: theme.textSub, fontWeight: 500 }}>{cardData.date}</span>
          </div>

          {/* Stats Grid */}
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', borderRadius: '20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>🎯</span>
              <span style={{ fontSize: '52px', fontWeight: 900, color: theme.accent1, lineHeight: 1.1 }}>{cardData.habitsCompleted}/{cardData.habitsTotal}</span>
              <span style={{ fontSize: '18px', color: theme.textSub, fontWeight: 600 }}>Habits</span>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', borderRadius: '20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, gap: '4px' }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <span style={{ fontSize: '52px', fontWeight: 900, color: theme.accent2, lineHeight: 1.1 }}>{cardData.tasksCompleted}/{cardData.tasksTotal}</span>
              <span style={{ fontSize: '18px', color: theme.textSub, fontWeight: 600 }}>Tasks</span>
            </div>
          </div>

          {/* Focus Score */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '20px', color: theme.textSub, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⭐</span> Focus Score
              </span>
              <span style={{ fontSize: '36px', fontWeight: 900, color: theme.accent1 }}>{focusPercent}%</span>
            </div>
            <div style={{ display: 'flex', width: '100%', height: '14px', borderRadius: '7px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${focusPercent}%`, height: '100%', borderRadius: '7px', background: `linear-gradient(90deg, ${theme.accent1}, ${theme.accent2})` }} />
            </div>
          </div>

          {/* Bottom Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Streak & Mood */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🔥</span>
                <span style={{ fontSize: '18px', color: theme.text, fontWeight: 700 }}>
                  Best Streak: {cardData.topStreak ? `${cardData.topStreak.name} (${cardData.topStreak.streak}d)` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px', color: theme.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {getMoodEmoji(cardData.mood)} Mood
                </span>
                <span style={{ fontSize: '18px', color: theme.text, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ⚡ Energy: {cardData.energy || '—'}/5
                </span>
              </div>
            </div>

            {/* Highlight */}
            {cardData.highlights && cardData.highlights.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '20px', borderRadius: '16px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}` }}>
                <span style={{ fontSize: '14px', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '2px' }}>── Highlight ──</span>
                <span style={{ fontSize: '18px', color: theme.text, fontStyle: 'italic' }}>&ldquo;{cardData.highlights[0]}&rdquo;</span>
              </div>
            )}

            {/* Achievements */}
            {cardData.achievements && cardData.achievements.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cardData.achievements.slice(0, 3).map((badge: string, i: number) => (
                  <div key={i} style={{ display: 'flex', padding: '8px 16px', borderRadius: '12px', background: `${theme.accent1}15`, border: `1px solid ${theme.accent1}30`, fontSize: '16px', color: theme.accent1, fontWeight: 700 }}>
                    {badge}
                  </div>
                ))}
              </div>
            )}

            {/* Branding */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 700, letterSpacing: '2px' }}>lifeos.app</span>
            </div>
          </div>
        </div>
      ),
      { width, height }
    );
  } catch (error: any) {
    console.error('Error generating OG card:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}
