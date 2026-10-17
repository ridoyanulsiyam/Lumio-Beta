import type {
  CanvasDocument,
  LayerEffects,
  LayerObject,
  ShapeType,
} from '../types/editor.ts';

export function createDefaultEffects(): LayerEffects {
  return {
    stroke: {
      enabled: false,
      color: '#000000',
      size: 4,
      opacity: 100,
      position: 'outside',
    },
    innerGlow: {
      enabled: false,
      color: '#ffffff',
      opacity: 80,
      size: 10,
      blur: 8,
    },
    outerGlow: {
      enabled: false,
      color: '#3b82f6',
      opacity: 85,
      size: 15,
      blur: 12,
      spread: 5,
    },
    dropShadow: {
      enabled: false,
      color: '#000000',
      opacity: 60,
      angle: 45,
      distance: 12,
      size: 10,
      blur: 8,
    },
    gaussianBlur: {
      enabled: false,
      amount: 6,
    },
    motionBlur: {
      enabled: false,
      angle: 0,
      distance: 15,
    },
  };
}

export function generateId(): string {
  return 'layer_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export function createDefaultDocument(
  name = 'Untitled Project',
  width = 1080,
  height = 1080,
  backgroundColor = '#ffffff'
): CanvasDocument {
  return {
    id: 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
    name,
    width,
    height,
    backgroundColor,
    layers: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createTextLayer(
  text = 'Double Tap to Edit',
  x = 100,
  y = 100,
  fontFamily = 'Inter, sans-serif'
): LayerObject {
  return {
    id: generateId(),
    name: 'Text Layer',
    type: 'text',
    x,
    y,
    width: 400,
    height: 120,
    rotation: 0,
    flipH: false,
    flipV: false,
    opacity: 100,
    blendMode: 'source-over',
    isVisible: true,
    isLocked: false,
    effects: createDefaultEffects(),
    textData: {
      text,
      fontFamily,
      fontSize: 48,
      color: '#111827',
      textAlign: 'center',
      letterSpacing: 0,
      lineHeight: 1.2,
      fontWeight: 'bold',
      isItalic: false,
      isUnderline: false,
    },
  };
}

export function createShapeLayer(
  shapeType: ShapeType = 'rectangle',
  x = 150,
  y = 150,
  width = 300,
  height = 300
): LayerObject {
  const shapeNames: Record<ShapeType, string> = {
    rectangle: 'Rectangle',
    'rounded-rect': 'Rounded Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    star: 'Star',
    heart: 'Heart',
    polygon: 'Polygon',
  };

  return {
    id: generateId(),
    name: shapeNames[shapeType] || 'Shape',
    type: 'shape',
    x,
    y,
    width,
    height,
    rotation: 0,
    flipH: false,
    flipV: false,
    opacity: 100,
    blendMode: 'source-over',
    isVisible: true,
    isLocked: false,
    effects: createDefaultEffects(),
    shapeData: {
      shapeType,
      fillColor: '#3b82f6',
      strokeColor: '#1d4ed8',
      strokeWidth: 0,
      cornerRadius: 24,
    },
  };
}

export function createImageLayer(
  src: string,
  originalWidth: number,
  originalHeight: number,
  docWidth: number,
  docHeight: number
): LayerObject {
  // Scale down so it fits nicely on initial import
  let width = originalWidth;
  let height = originalHeight;
  const maxInitialW = docWidth * 0.7;
  const maxInitialH = docHeight * 0.7;

  if (width > maxInitialW || height > maxInitialH) {
    const ratio = Math.min(maxInitialW / width, maxInitialH / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const x = Math.round((docWidth - width) / 2);
  const y = Math.round((docHeight - height) / 2);

  return {
    id: generateId(),
    name: 'Image Layer',
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    flipH: false,
    flipV: false,
    opacity: 100,
    blendMode: 'source-over',
    isVisible: true,
    isLocked: false,
    effects: createDefaultEffects(),
    imageData: {
      src,
      originalWidth,
      originalHeight,
    },
  };
}

export function reorderLayers(
  layers: LayerObject[],
  id: string,
  direction: 'up' | 'down'
): LayerObject[] {
  const index = layers.findIndex((l) => l.id === id);
  if (index === -1) return layers;

  const targetIndex = direction === 'up' ? index + 1 : index - 1;
  if (targetIndex < 0 || targetIndex >= layers.length) return layers;

  const copy = [...layers];
  const [removed] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, removed);
  return copy;
}

export function duplicateLayer(
  layers: LayerObject[],
  id: string
): { layers: LayerObject[]; newLayer: LayerObject | null } {
  const layer = layers.find((l) => l.id === id);
  if (!layer) return { layers, newLayer: null };

  const cloned: LayerObject = {
    ...JSON.parse(JSON.stringify(layer)),
    id: generateId(),
    name: `${layer.name} (Copy)`,
    x: layer.x + 30,
    y: layer.y + 30,
  };

  const index = layers.findIndex((l) => l.id === id);
  const nextLayers = [...layers];
  nextLayers.splice(index + 1, 0, cloned);
  return { layers: nextLayers, newLayer: cloned };
}

export function deleteLayer(layers: LayerObject[], id: string): LayerObject[] {
  return layers.filter((l) => l.id !== id);
}

export function toggleLayerVisibility(layers: LayerObject[], id: string): LayerObject[] {
  return layers.map((l) => (l.id === id ? { ...l, isVisible: !l.isVisible } : l));
}

export function toggleLayerLock(layers: LayerObject[], id: string): LayerObject[] {
  return layers.map((l) => (l.id === id ? { ...l, isLocked: !l.isLocked } : l));
}

export function updateLayer(
  layers: LayerObject[],
  id: string,
  updater: Partial<LayerObject> | ((prev: LayerObject) => LayerObject)
): LayerObject[] {
  return layers.map((l) => {
    if (l.id !== id) return l;
    if (typeof updater === 'function') {
      return updater(l);
    }
    return { ...l, ...updater };
  });
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function applyMove(layer: LayerObject, deltaX: number, deltaY: number): LayerObject {
  if (layer.isLocked) return layer;
  return {
    ...layer,
    x: Math.round(layer.x + deltaX),
    y: Math.round(layer.y + deltaY),
  };
}

/**
 * Returns a copy of the layer with every pixel-based measurement multiplied by `scale`.
 * Used so exports / thumbnails are rendered natively at the target resolution
 * (crisp text, shapes and effects) instead of upscaling a 1x bitmap.
 */
export function scaleLayer(layer: LayerObject, scale: number): LayerObject {
  if (scale === 1) return layer;
  const s = scale;
  const fx = layer.effects;
  return {
    ...layer,
    x: layer.x * s,
    y: layer.y * s,
    width: layer.width * s,
    height: layer.height * s,
    textData: layer.textData
      ? {
          ...layer.textData,
          fontSize: layer.textData.fontSize * s,
          letterSpacing: layer.textData.letterSpacing * s,
        }
      : undefined,
    shapeData: layer.shapeData
      ? {
          ...layer.shapeData,
          strokeWidth: layer.shapeData.strokeWidth * s,
          cornerRadius:
            layer.shapeData.cornerRadius === undefined
              ? undefined
              : layer.shapeData.cornerRadius * s,
        }
      : undefined,
    effects: {
      stroke: { ...fx.stroke, size: fx.stroke.size * s },
      innerGlow: {
        ...fx.innerGlow,
        size: fx.innerGlow.size * s,
        blur: fx.innerGlow.blur * s,
      },
      outerGlow: {
        ...fx.outerGlow,
        size: fx.outerGlow.size * s,
        blur: fx.outerGlow.blur * s,
        spread: fx.outerGlow.spread * s,
      },
      dropShadow: {
        ...fx.dropShadow,
        distance: fx.dropShadow.distance * s,
        size: fx.dropShadow.size * s,
        blur: fx.dropShadow.blur * s,
      },
      gaussianBlur: { ...fx.gaussianBlur, amount: fx.gaussianBlur.amount * s },
      motionBlur: { ...fx.motionBlur, distance: fx.motionBlur.distance * s },
    },
  };
}

/**
 * Hit test that respects layer rotation (flip does not change the bounding box).
 */
export function isPointInLayer(layer: LayerObject, px: number, py: number): boolean {
  const cx = layer.x + layer.width / 2;
  const cy = layer.y + layer.height / 2;
  const rad = (-(layer.rotation || 0) * Math.PI) / 180;
  const dx = px - cx;
  const dy = py - cy;
  const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
  const ry = dx * Math.sin(rad) + dy * Math.cos(rad);
  return Math.abs(rx) <= layer.width / 2 && Math.abs(ry) <= layer.height / 2;
}
