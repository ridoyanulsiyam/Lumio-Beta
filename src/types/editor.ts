export type ObjectType = 'text' | 'shape' | 'image';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion'
  | 'hue'
  | 'saturation'
  | 'color'
  | 'luminosity';

export interface StrokeEffect {
  enabled: boolean;
  color: string;
  size: number;
  opacity: number; // 0-100
  position: 'inside' | 'center' | 'outside';
}

export interface InnerGlowEffect {
  enabled: boolean;
  color: string;
  opacity: number; // 0-100
  size: number;
  blur: number;
}

export interface OuterGlowEffect {
  enabled: boolean;
  color: string;
  opacity: number; // 0-100
  size: number;
  blur: number;
  spread: number;
}

export interface DropShadowEffect {
  enabled: boolean;
  color: string;
  opacity: number; // 0-100
  angle: number; // 0-360
  distance: number;
  size: number;
  blur: number;
}

export interface GaussianBlurEffect {
  enabled: boolean;
  amount: number; // 0-100
}

export interface MotionBlurEffect {
  enabled: boolean;
  angle: number; // 0-360
  distance: number; // 0-100
}

export interface LayerEffects {
  stroke: StrokeEffect;
  innerGlow: InnerGlowEffect;
  outerGlow: OuterGlowEffect;
  dropShadow: DropShadowEffect;
  gaussianBlur: GaussianBlurEffect;
  motionBlur: MotionBlurEffect;
}

export type ShapeType =
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'heart'
  | 'polygon';

export interface TextData {
  text: string;
  fontFamily: string;
  fontSize: number;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  letterSpacing: number; // in px
  lineHeight: number; // e.g. 1.2
  fontWeight: 'normal' | 'bold' | '600' | '800';
  isItalic: boolean;
  isUnderline: boolean;
}

export interface ShapeData {
  shapeType: ShapeType;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius?: number;
}

export interface ImageData {
  src: string;
  originalWidth: number;
  originalHeight: number;
}

export interface LayerObject {
  id: string;
  name: string;
  type: ObjectType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  flipH: boolean;
  flipV: boolean;
  opacity: number; // 0-100
  blendMode: BlendMode;
  isVisible: boolean;
  isLocked: boolean;
  effects: LayerEffects;
  textData?: TextData;
  shapeData?: ShapeData;
  imageData?: ImageData;
}

export interface CanvasDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: LayerObject[];
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
}

export interface CustomFont {
  id: string;
  name: string;
  fileName: string;
  dataUrl: string;
  format: string;
}

export type EditingSection =
  | 'transform'
  | 'appearance'
  | 'stroke'
  | 'innerGlow'
  | 'outerGlow'
  | 'dropShadow'
  | 'gaussianBlur'
  | 'motionBlur'
  | 'textSettings'
  | 'shapeSettings';

export interface PresetSize {
  name: string;
  category: string;
  width: number;
  height: number;
  icon?: string;
}
