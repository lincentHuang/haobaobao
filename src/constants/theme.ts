import { Platform } from 'react-native';

/** 可愛卡通 + 立體：暖色奶油底、飽和糖果色、每個色都有一個「底邊」深色做立體感 */
export const C = {
  bg: '#FFF6E9',
  card: '#FFFFFF',
  cardEdge: '#EADBC4',
  text: '#3D2C1E',
  textSoft: '#8A7462',
  line: '#F0E2CC',

  orange: '#FF9F43',
  orangeEdge: '#D9781C',
  green: '#4CD180',
  greenEdge: '#2EA35C',
  blue: '#4AA8FF',
  blueEdge: '#2A7FD1',
  yellow: '#FFD23F',
  yellowEdge: '#D9A814',
  red: '#FF6B6B',
  redEdge: '#D14545',
  purple: '#A78BFA',
  purpleEdge: '#7C5FD6',
  grey: '#E7DCCB',
  greyEdge: '#C9B89F',
} as const;

export type Tone = 'orange' | 'green' | 'blue' | 'yellow' | 'red' | 'purple' | 'grey' | 'white';

export const tone = (t: Tone) =>
  t === 'white' ? { face: C.card, edge: C.cardEdge } : { face: C[t], edge: C[`${t}Edge` as const] };

export const R = { sm: 12, md: 20, lg: 28, pill: 999 } as const;
export const S = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

export const font = Platform.select({ ios: 'ui-rounded', web: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', system-ui", default: undefined });

/** 色票：給小孩頭像、規則選色 */
export const palette = ['#FF9F43', '#4CD180', '#4AA8FF', '#FFD23F', '#FF6B6B', '#A78BFA', '#FF8FC7', '#2DD4BF'];
