export const Colors = {
  bg: '#0D0F1E', bg2: '#13162A', card: '#1E2340', card2: '#252B4A',
  border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.14)',
  indigo: '#5B67F8', indigoLight: '#7B85FA',
  indigoDim: 'rgba(91,103,248,0.18)', indigoDim2: 'rgba(91,103,248,0.3)',
  cyan: '#00D4FF', cyanDim: 'rgba(0,212,255,0.15)',
  purple: '#9B5DE5', purpleDim: 'rgba(155,93,229,0.2)',
  green: '#22C55E', greenDim: 'rgba(34,197,94,0.15)',
  amber: '#F59E0B', amberDim: 'rgba(245,158,11,0.15)',
  red: '#EF4444', redDim: 'rgba(239,68,68,0.15)',
  orange: '#F97316', white: '#FFFFFF',
  text: 'rgba(255,255,255,0.95)', text2: 'rgba(255,255,255,0.6)', text3: 'rgba(255,255,255,0.35)',
} as const
export const Typography = {
  family: { regular: 'Nunito_400Regular', medium: 'Nunito_500Medium', semiBold: 'Nunito_600SemiBold', bold: 'Nunito_700Bold', extraBold: 'Nunito_800ExtraBold' },
  size: { xs:11, sm:13, base:15, md:17, lg:20, xl:24, '2xl':28, '3xl':34, '4xl':48 },
} as const
export const Spacing = { xs:4, sm:8, md:12, base:16, lg:20, xl:24, '2xl':32, '3xl':48 } as const
export const Radius = { sm:8, md:12, lg:16, xl:20, '2xl':24, full:999 } as const