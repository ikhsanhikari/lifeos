import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const THEMES: Record<string, {
  name: string;
  bg1: string; bg2: string; bg3: string;
  primary: string; secondary: string; glow: string;
  textPrimary: string; textSecondary: string; textMuted: string;
  cardBg: string; cardBorder: string; badgeBg: string; badgeText: string;
}> = {
  strava: {
    name: 'Strava Kinetic',
    bg1: '#0d0705', bg2: '#1f0d07', bg3: '#080504',
    primary: '#FC4C02', secondary: '#FF8800', glow: '#FF3D00',
    textPrimary: '#FFFFFF', textSecondary: '#FFCCBC', textMuted: '#8C6658',
    cardBg: 'rgba(252, 76, 2, 0.08)', cardBorder: 'rgba(252, 76, 2, 0.25)',
    badgeBg: 'rgba(252, 76, 2, 0.2)', badgeText: '#FF7A45',
  },
  cyber: {
    name: 'Cyber Mint',
    bg1: '#03140e', bg2: '#082b1d', bg3: '#020d09',
    primary: '#00E676', secondary: '#00B0FF', glow: '#00E676',
    textPrimary: '#FFFFFF', textSecondary: '#B9F6CA', textMuted: '#4E8A6E',
    cardBg: 'rgba(0, 230, 118, 0.08)', cardBorder: 'rgba(0, 230, 118, 0.25)',
    badgeBg: 'rgba(0, 230, 118, 0.2)', badgeText: '#69F0AE',
  },
  purple: {
    name: 'Neon Violet',
    bg1: '#0f051d', bg2: '#1f0a3b', bg3: '#090312',
    primary: '#C084FC', secondary: '#F472B6', glow: '#A855F7',
    textPrimary: '#FFFFFF', textSecondary: '#E9D5FF', textMuted: '#7E5B9B',
    cardBg: 'rgba(168, 85, 247, 0.08)', cardBorder: 'rgba(168, 85, 247, 0.25)',
    badgeBg: 'rgba(168, 85, 247, 0.2)', badgeText: '#D8B4FE',
  },
  ocean: {
    name: 'Sapphire Cyan',
    bg1: '#04101e', bg2: '#08213d', bg3: '#020a14',
    primary: '#38BDF8', secondary: '#34D399', glow: '#0EA5E9',
    textPrimary: '#FFFFFF', textSecondary: '#BAE6FD', textMuted: '#4B7A94',
    cardBg: 'rgba(14, 165, 233, 0.08)', cardBorder: 'rgba(14, 165, 233, 0.25)',
    badgeBg: 'rgba(14, 165, 233, 0.2)', badgeText: '#7DD3FC',
  },
  dark: {
    name: 'Obsidian Lime',
    bg1: '#09090b', bg2: '#18181b', bg3: '#000000',
    primary: '#A3E635', secondary: '#38BDF8', glow: '#84CC16',
    textPrimary: '#FFFFFF', textSecondary: '#D9F99D', textMuted: '#71717A',
    cardBg: 'rgba(255, 255, 255, 0.05)', cardBorder: 'rgba(255, 255, 255, 0.15)',
    badgeBg: 'rgba(163, 230, 53, 0.18)', badgeText: '#BEF264',
  },
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const themeKey = searchParams.get('theme') || 'strava';
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

    const theme = THEMES[themeKey] || THEMES.strava;
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
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '70px',
            background: `linear-gradient(145deg, ${theme.bg1} 0%, ${theme.bg2} 55%, ${theme.bg3} 100%)`,
            fontFamily: 'Inter, system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Central Radial Glow */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '700px', height: '700px', borderRadius: '50%', background: `radial-gradient(circle, ${theme.glow}30, transparent 65%)`, display: 'flex' }} />

          {/* Strava Vector Topo Map & Polyline Route Overlay */}
          <svg
            width={width}
            height={height}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              opacity: 0.22,
              pointerEvents: 'none',
            }}
            viewBox={`0 0 ${width} ${height}`}
            fill="none"
          >
            {/* Topography Contour Lines */}
            <path d="M -50 150 C 200 80, 400 300, 700 150 S 1000 250, 1150 120" stroke={theme.primary} strokeWidth="2.5" />
            <path d="M -50 300 C 250 150, 500 400, 800 250 S 1100 350, 1150 220" stroke={theme.primary} strokeWidth="2" />
            <path d="M -50 450 C 300 300, 550 550, 850 350 S 1150 480, 1150 350" stroke={theme.primary} strokeWidth="2" />
            <path d="M -50 600 C 200 450, 600 700, 900 480 S 1100 620, 1150 500" stroke={theme.primary} strokeWidth="1.5" />
            <path d="M -50 750 C 350 600, 650 850, 950 620 S 1150 780, 1150 650" stroke={theme.primary} strokeWidth="1.5" />

            {/* Map Grid */}
            <path d="M 0 270 L 1080 270 M 0 540 L 1080 540 M 0 810 L 1080 810" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />
            <path d="M 270 0 L 270 1080 M 540 0 L 540 1080 M 810 0 L 810 1080" stroke={theme.primary} strokeWidth="1" strokeDasharray="8 8" opacity="0.3" />

            {/* Strava Polyline Activity Route */}
            <path
              d="M 140 280 Q 280 120 480 220 T 780 160 T 950 340 T 720 580 T 420 520 T 220 780 T 640 920 T 940 820"
              stroke={theme.primary}
              strokeWidth="9"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
            />

            {/* GPS Start & Finish Nodes */}
            <circle cx="140" cy="280" r="14" fill={theme.primary} />
            <circle cx="140" cy="280" r="24" fill="none" stroke={theme.primary} strokeWidth="3" opacity="0.6" />

            <circle cx="940" cy="820" r="14" fill={theme.secondary} />
            <circle cx="940" cy="820" r="24" fill="none" stroke={theme.secondary} strokeWidth="3" opacity="0.6" />
          </svg>

          {/* Header Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 24px', borderRadius: '30px', background: theme.badgeBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '20px' }}>🔥</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: theme.badgeText, letterSpacing: '4px', textTransform: 'uppercase' }}>LIFE OS STREAK MAPS</span>
          </div>

          {/* Main Giant Streak Display */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 2 }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 80px',
                borderRadius: '44px',
                background: theme.cardBg,
                border: `2px solid ${theme.cardBorder}`,
                boxShadow: `0 40px 80px ${theme.glow}20`,
              }}
            >
              <span style={{ fontSize: '60px' }}>🔥</span>
              <span style={{ fontSize: '160px', fontWeight: 900, color: theme.primary, lineHeight: 0.95, letterSpacing: '-6px' }}>
                {streakData.streak}
              </span>
              <span style={{ fontSize: '36px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '8px', textTransform: 'uppercase', marginTop: '10px' }}>
                DAYS STREAK
              </span>
            </div>

            {/* Habit Title Pill */}
            <div style={{ marginTop: '20px', padding: '16px 36px', borderRadius: '24px', background: 'rgba(0,0,0,0.5)', border: `1px solid ${theme.cardBorder}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>🎯</span>
              <span style={{ fontSize: '32px', fontWeight: 900, color: theme.textPrimary, letterSpacing: '-0.5px' }}>
                {streakData.habitName}
              </span>
            </div>
          </div>

          {/* 14-Day Check-in History Bar */}
          {streakData.history && streakData.history.length > 0 && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '16px 28px', borderRadius: '24px', background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, position: 'relative', zIndex: 2 }}>
              {streakData.history.slice(-14).map((done: boolean, i: number) => (
                <div
                  key={i}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: done ? `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${done ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 900,
                    color: '#FFFFFF',
                  }}
                >
                  {done ? '✓' : ''}
                </div>
              ))}
            </div>
          )}

          {/* Watermark Footer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 24px', borderRadius: '20px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.12)', position: 'relative', zIndex: 2 }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <span style={{ fontSize: '16px', color: theme.textPrimary, fontWeight: 800, letterSpacing: '2px' }}>LIFE OS</span>
            <span style={{ fontSize: '16px', color: theme.textMuted }}>•</span>
            <span style={{ fontSize: '16px', color: theme.textSecondary, fontWeight: 600 }}>lifeos.app</span>
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
