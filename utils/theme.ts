// =============================================
// PANTRY PAL PRO — DESIGN SYSTEM
// =============================================

export type ThemeMode = 'light' | 'dark';

export const DARK_COLORS = {
  // Backgrounds (layered darkness)
  bg0: '#08080F',       // deepest background (screens)
  bg1: '#10101A',       // card background
  bg2: '#18182A',       // elevated card / input
  bg3: '#222238',       // selected / hover state

  // Accent
  accent: '#6C63FF',    // primary purple-indigo
  accentSoft: '#9B94FF',
  accentGlow: 'rgba(108,99,255,0.18)',

  // Status
  safe: '#2ED573',
  safeBg: '#0D2E1A',
  warning: '#FFA502',
  warningBg: '#2E1E00',
  urgent: '#FF4757',
  urgentBg: '#2E0909',
  expired: '#A855F7',
  expiredBg: '#1C0A2E',

  // Text
  textPrimary: '#F0F0FF',
  textSecondary: '#9090B0',
  textMuted: '#55556A',

  // Borders
  border: '#1E1E32',
  borderLight: '#2A2A45',
};

export const LIGHT_COLORS = {
  // Backgrounds
  bg0: '#F8F9FF',       // soft white-blue
  bg1: '#FFFFFF',       // pure white cards
  bg2: '#F0F2FF',       // muted inputs
  bg3: '#E4E7FF',       // hover highlights

  // Accent
  accent: '#5D54E6',    // slightly deeper purple for light mode
  accentSoft: '#8279FF',
  accentGlow: 'rgba(93,84,230,0.12)',

  // Status (slightly adapted for light bg)
  safe: '#27AE60',
  safeBg: '#E8F6EF',
  warning: '#F39C12',
  warningBg: '#FEF5E7',
  urgent: '#EB2F06',
  urgentBg: '#FDEDEC',
  expired: '#8E44AD',
  expiredBg: '#F4ECF7',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#505075',
  textMuted: '#8E8EAC',

  // Borders
  border: '#E2E2F0',
  borderLight: '#EEEEF8',
};

// Legacy Export (Defaults to Dark for safety during migration)
export const COLORS = DARK_COLORS;

export const GRADIENTS = {
  accent: ['#6C63FF', '#A855F7'] as const,
  accentCyan: ['#6C63FF', '#00D2FF'] as const,
  danger: ['#FF4757', '#FF6B81'] as const,
  safe: ['#2ED573', '#1ABC9C'] as const,
  card: {
    dark: ['#10101A', '#16162A'] as const,
    light: ['#FFFFFF', '#F9FAFF'] as const,
  }
};

export const FONTS = {
  display: { fontSize: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 12, fontWeight: '500' as const, letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 1.2 },
};

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 50,
};

export const getShadow = (mode: ThemeMode) => ({
  card: {
    shadowColor: mode === 'dark' ? '#000' : '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: mode === 'dark' ? 0.3 : 0.08,
    shadowRadius: 12,
    elevation: mode === 'dark' ? 8 : 4,
  },
  accent: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
});
