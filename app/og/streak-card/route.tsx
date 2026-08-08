import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeKey = searchParams.get('theme') || 'dark';
    const dataParam = searchParams.get('data');

    let streakData: any = null;
    if (dataParam) {
      try {
        streakData = JSON.parse(decodeURIComponent(dataParam));
      } catch {
        return new Response('Invalid data parameter', { status: 400 });
      }
    }

    if (!streakData) {
      return new Response('Missing data parameter', { status: 400 });
    }

    const theme = THEMES[themeKey] || THEMES.dark;
    const width = 1080;
    const height = 1080;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '40px',
            padding: '80px',
            background: `linear-gradient(135deg, ${theme.bg1} 0%, ${theme.bg2} 50%, ${theme.bg3} 100%)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}12, transparent 70%)`, display: 'flex' }} />

          {/* Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: theme.accent1, textTransform: 'uppercase', letterSpacing: '4px' }}>Habit Streak</span>
            <span style={{ fontSize: '18px', color: theme.textMuted }}>{streakData.date || ''}</span>
          </div>

          {/* Main Streak Number */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>🔥</span>
            <span style={{ fontSize: '140px', fontWeight: 900, color: theme.text, lineHeight: 1, letterSpacing: '-4px' }}>
              {streakData.streak}
            </span>
            <span style={{ fontSize: '32px', fontWeight: 700, color: theme.textSub, textTransform: 'uppercase', letterSpacing: '6px' }}>
              DAYS
            </span>
          </div>

          {/* Habit Name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '16px 40px', borderRadius: '20px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🎯</span>
              <span style={{ fontSize: '28px', fontWeight: 700, color: theme.text }}>
                {streakData.habitName}
              </span>
            </div>
          </div>

          {/* Streak History Bar (last 14 days) */}
          {streakData.history && streakData.history.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {streakData.history.slice(-14).map((done: boolean, i: number) => (
                <div
                  key={i}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: done ? `linear-gradient(135deg, ${theme.accent1}, ${theme.accent2})` : theme.cardBg,
                    border: `1px solid ${done ? 'transparent' : theme.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                  }}
                >
                  {done ? '✓' : ''}
                </div>
              ))}
            </div>
          )}

          {/* Branding */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'absolute', bottom: '40px', right: '60px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '16px', color: theme.textMuted, fontWeight: 700, letterSpacing: '2px' }}>lifeos.app</span>
          </div>
        </div>
      ),
      { width, height }
    );
  } catch (error: any) {
    console.error('Error generating streak card:', error);
    return new Response(`Failed to generate image: ${error.message}`, { status: 500 });
  }
}
