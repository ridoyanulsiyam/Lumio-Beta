import type {
  CanvasDocument,
  LayerObject,
  ShapeType,
} from '../types/editor.ts';
import { scaleLayer } from './editorLogic.ts';

/**
 * Builds a valid CSS font-family list. System fonts are stored as full stacks
 * (e.g. "Inter, sans-serif") which must NOT be wrapped in a single pair of quotes,
 * otherwise the browser looks for one font literally named "Inter, sans-serif".
 */
export function toCssFontFamily(fontFamily: string | undefined): string {
  const value = (fontFamily || '').trim();
  if (!value) return 'sans-serif';
  if (value.includes(',')) return value;
  if (/^(["']).*\1$/.test(value)) return `${value}, sans-serif`;
  return `"${value}", sans-serif`;
}

// In-memory image cache for fast re-rendering
const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(src: string): Promise<HTMLImageElement> {
  if (imageCache.has(src)) {
    const cached = imageCache.get(src)!;
    if (cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageCache.set(src, img);
      resolve(img);
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draws shape path onto canvas 2D context
 */
function drawShapePath(
  ctx: CanvasRenderingContext2D,
  type: ShapeType,
  width: number,
  height: number,
  cornerRadius = 16
) {
  ctx.beginPath();
  switch (type) {
    case 'rectangle':
      ctx.rect(0, 0, width, height);
      break;

    case 'rounded-rect': {
      const r = Math.min(cornerRadius, width / 2, height / 2);
      ctx.roundRect(0, 0, width, height, r);
      break;
    }

    case 'circle': {
      ctx.ellipse(width / 2, height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;
    }

    case 'triangle': {
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();
      break;
    }

    case 'star': {
      const cx = width / 2;
      const cy = height / 2;
      const spikes = 5;
      const outerRadius = Math.min(width, height) / 2;
      const innerRadius = outerRadius * 0.45;
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;

      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        let x = cx + Math.cos(rot) * outerRadius;
        let y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.closePath();
      break;
    }

    case 'heart': {
      const w = width;
      const h = height;
      ctx.moveTo(w / 2, h * 0.8);
      ctx.bezierCurveTo(w / 2, h * 0.7, 0, h * 0.5, 0, h * 0.28);
      ctx.bezierCurveTo(0, 0, w * 0.45, 0, w / 2, h * 0.3);
      ctx.bezierCurveTo(w * 0.55, 0, w, 0, w, h * 0.28);
      ctx.bezierCurveTo(w, h * 0.5, w / 2, h * 0.7, w / 2, h * 0.8);
      ctx.closePath();
      break;
    }

    case 'polygon': {
      const cx = width / 2;
      const cy = height / 2;
      const sides = 6;
      const r = Math.min(width, height) / 2;
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }
}

/**
 * Draws text with multiline and alignment support
 */
function drawTextContent(ctx: CanvasRenderingContext2D, layer: LayerObject) {
  const data = layer.textData;
  if (!data) return;

  const style = `${data.isItalic ? 'italic ' : ''}${data.fontWeight} ${data.fontSize}px ${toCssFontFamily(data.fontFamily)}`;
  ctx.font = style;
  ctx.fillStyle = data.color;
  ctx.textBaseline = 'top';

  const lines = (data.text || '').split('\n');
  const lineHeight = data.fontSize * (data.lineHeight || 1.2);

  lines.forEach((line, index) => {
    let drawX = 0;
    if (data.textAlign === 'center') {
      ctx.textAlign = 'center';
      drawX = layer.width / 2;
    } else if (data.textAlign === 'right') {
      ctx.textAlign = 'right';
      drawX = layer.width;
    } else {
      ctx.textAlign = 'left';
      drawX = 0;
    }

    const drawY = index * lineHeight;

    const ctxAny = ctx as unknown as { letterSpacing?: string };
    if ('letterSpacing' in ctx && typeof ctxAny.letterSpacing === 'string') {
      ctxAny.letterSpacing = `${data.letterSpacing}px`;
      ctx.fillText(line, drawX, drawY);
    } else if (data.letterSpacing > 0) {
      const chars = line.split('');
      let currentX = drawX;
      chars.forEach((char) => {
        ctx.fillText(char, currentX, drawY);
        currentX += ctx.measureText(char).width + data.letterSpacing;
      });
    } else {
      ctx.fillText(line, drawX, drawY);
    }

    if (data.isUnderline) {
      const metrics = ctx.measureText(line);
      const lineWidth = metrics.width;
      let startX = drawX;
      if (data.textAlign === 'center') startX = drawX - lineWidth / 2;
      if (data.textAlign === 'right') startX = drawX - lineWidth;

      ctx.save();
      ctx.strokeStyle = data.color;
      ctx.lineWidth = Math.max(2, Math.round(data.fontSize / 16));
      ctx.beginPath();
      ctx.moveTo(startX, drawY + lineHeight - 4);
      ctx.lineTo(startX + lineWidth, drawY + lineHeight - 4);
      ctx.stroke();
      ctx.restore();
    }
  });
}

/**
 * Renders raw layer content (without layer-level effects) to a temporary offscreen canvas
 */
function renderLayerRaw(layer: LayerObject, padScale = 1): HTMLCanvasElement {
  const pad = Math.round(80 * padScale); // Padding to prevent clipping during effects
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil(layer.width + pad * 2));
  canvas.height = Math.max(1, Math.ceil(layer.height + pad * 2));
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.translate(pad, pad);

  if (layer.type === 'text') {
    drawTextContent(ctx, layer);
  } else if (layer.type === 'shape' && layer.shapeData) {
    const s = layer.shapeData;
    drawShapePath(ctx, s.shapeType, layer.width, layer.height, s.cornerRadius);
    ctx.fillStyle = s.fillColor;
    ctx.fill();

    if (s.strokeWidth > 0 && s.strokeColor) {
      ctx.strokeStyle = s.strokeColor;
      ctx.lineWidth = s.strokeWidth;
      ctx.stroke();
    }
  } else if (layer.type === 'image' && layer.imageData) {
    const img = imageCache.get(layer.imageData.src);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, layer.width, layer.height);
    }
  }

  return canvas;
}

/**
 * Applies active Layer Effects and returns a rendered composite canvas
 */
export function renderLayerWithEffects(
  layer: LayerObject,
  padScale = 1
): {
  canvas: HTMLCanvasElement;
  pad: number;
} {
  const pad = Math.round(120 * padScale); // Generous padding for outer glow and drop shadows
  const rawPad = Math.round(80 * padScale);
  const baseCanvas = renderLayerRaw(layer, padScale);
  const outCanvas = document.createElement('canvas');
  outCanvas.width = Math.max(1, Math.ceil(layer.width + pad * 2));
  outCanvas.height = Math.max(1, Math.ceil(layer.height + pad * 2));
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return { canvas: baseCanvas, pad: rawPad };

  const offsetX = pad - rawPad;
  const offsetY = pad - rawPad;

  const fx = layer.effects;

  // 1. Drop Shadow Effect
  if (fx.dropShadow.enabled) {
    const rad = (fx.dropShadow.angle * Math.PI) / 180;
    const dx = Math.cos(rad) * fx.dropShadow.distance;
    const dy = Math.sin(rad) * fx.dropShadow.distance;

    ctx.save();
    ctx.shadowColor = fx.dropShadow.color;
    ctx.shadowBlur = Math.max(1, fx.dropShadow.blur);
    ctx.shadowOffsetX = dx;
    ctx.shadowOffsetY = dy;
    ctx.globalAlpha = fx.dropShadow.opacity / 100;

    // Draw shadow using baseCanvas as mask
    ctx.drawImage(baseCanvas, offsetX, offsetY);
    ctx.restore();
  }

  // 2. Outer Glow Effect
  if (fx.outerGlow.enabled) {
    ctx.save();
    ctx.shadowColor = fx.outerGlow.color;
    ctx.shadowBlur = Math.max(1, fx.outerGlow.blur + fx.outerGlow.spread);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.globalAlpha = fx.outerGlow.opacity / 100;
    ctx.drawImage(baseCanvas, offsetX, offsetY);
    // Draw again for intensity
    ctx.drawImage(baseCanvas, offsetX, offsetY);
    ctx.restore();
  }

  // 3. Motion Blur or Gaussian Blur on the main layer body
  ctx.save();
  if (fx.gaussianBlur.enabled && fx.gaussianBlur.amount > 0) {
    ctx.filter = `blur(${fx.gaussianBlur.amount}px)`;
  }
  ctx.drawImage(baseCanvas, offsetX, offsetY);
  ctx.restore();

  // If motion blur is enabled: directional multi-sampling
  if (fx.motionBlur.enabled && fx.motionBlur.distance > 0) {
    const rad = (fx.motionBlur.angle * Math.PI) / 180;
    const totalDist = fx.motionBlur.distance;
    const samples = 8;
    ctx.save();
    ctx.globalAlpha = 0.18;
    for (let s = 1; s <= samples; s++) {
      const stepDist = (s / samples) * totalDist;
      const sx = Math.cos(rad) * stepDist;
      const sy = Math.sin(rad) * stepDist;
      ctx.drawImage(baseCanvas, offsetX + sx, offsetY + sy);
      ctx.drawImage(baseCanvas, offsetX - sx, offsetY - sy);
    }
    ctx.restore();
  }

  // 4. Stroke Effect (Inside, Center, Outside)
  if (fx.stroke.enabled && fx.stroke.size > 0) {
    ctx.save();
    ctx.globalAlpha = fx.stroke.opacity / 100;

    const strokeCanvas = document.createElement('canvas');
    strokeCanvas.width = outCanvas.width;
    strokeCanvas.height = outCanvas.height;
    const sCtx = strokeCanvas.getContext('2d');
    if (sCtx) {
      sCtx.translate(pad, pad);
      if (layer.type === 'shape' && layer.shapeData) {
        drawShapePath(sCtx, layer.shapeData.shapeType, layer.width, layer.height, layer.shapeData.cornerRadius);
        sCtx.strokeStyle = fx.stroke.color;
        sCtx.lineWidth = fx.stroke.size * 2;
        sCtx.stroke();
      } else {
        // Outline for text / image using shadow dilation
        sCtx.shadowColor = fx.stroke.color;
        sCtx.shadowBlur = 1;
        const steps = 12;
        const radius = fx.stroke.size;
        for (let i = 0; i < steps; i++) {
          const a = (i * 2 * Math.PI) / steps;
          sCtx.shadowOffsetX = Math.cos(a) * radius;
          sCtx.shadowOffsetY = Math.sin(a) * radius;
          sCtx.drawImage(baseCanvas, -rawPad, -rawPad);
        }
      }

      if (fx.stroke.position === 'inside') {
        sCtx.globalCompositeOperation = 'destination-in';
        sCtx.drawImage(baseCanvas, -rawPad, -rawPad);
      } else if (fx.stroke.position === 'outside') {
        sCtx.globalCompositeOperation = 'destination-out';
        sCtx.drawImage(baseCanvas, -rawPad, -rawPad);
      }

      ctx.drawImage(strokeCanvas, 0, 0);
    }
    ctx.restore();
  }

  // 5. Inner Glow Effect
  if (fx.innerGlow.enabled && fx.innerGlow.size > 0) {
    ctx.save();
    const glowCanvas = document.createElement('canvas');
    glowCanvas.width = outCanvas.width;
    glowCanvas.height = outCanvas.height;
    const gCtx = glowCanvas.getContext('2d');
    if (gCtx) {
      gCtx.drawImage(baseCanvas, offsetX, offsetY);
      gCtx.globalCompositeOperation = 'source-in';
      gCtx.fillStyle = fx.innerGlow.color;
      gCtx.fillRect(0, 0, glowCanvas.width, glowCanvas.height);
      gCtx.globalCompositeOperation = 'destination-out';
      gCtx.filter = `blur(${fx.innerGlow.blur || 6}px)`;
      gCtx.drawImage(baseCanvas, offsetX, offsetY);

      ctx.globalAlpha = fx.innerGlow.opacity / 100;
      ctx.globalCompositeOperation = 'source-atop';
      ctx.drawImage(glowCanvas, 0, 0);
    }
    ctx.restore();
  }

  return { canvas: outCanvas, pad };
}

/**
 * Master Canvas Renderer: Draws the entire document onto any canvas
 */
export async function renderDocument(
  doc: CanvasDocument,
  targetCanvas: HTMLCanvasElement,
  scale = 1
): Promise<void> {
  // Preload any image layers
  const imageLayers = doc.layers.filter((l) => l.type === 'image' && l.imageData?.src);
  await Promise.all(
    imageLayers.map((l) => preloadImage(l.imageData!.src).catch(() => null))
  );

  const width = Math.round(doc.width * scale);
  const height = Math.round(doc.height * scale);

  targetCanvas.width = width;
  targetCanvas.height = height;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  // Background
  if (doc.backgroundColor && doc.backgroundColor !== 'transparent') {
    ctx.fillStyle = doc.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Render layers bottom to top
  for (const sourceLayer of doc.layers) {
    if (!sourceLayer.isVisible) continue;

    // Render each layer natively at the target resolution (crisp text/shapes/effects)
    // instead of upscaling a 1x bitmap. For scale === 1 this is the original layer.
    const layer = scaleLayer(sourceLayer, scale);
    const { canvas: layerCanvas, pad } = renderLayerWithEffects(layer, scale);

    ctx.save();

    // Blend mode & Opacity
    ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));
    ctx.globalCompositeOperation = layer.blendMode || 'source-over';

    // Center of layer for rotation and flip
    const centerX = layer.x + layer.width / 2;
    const centerY = layer.y + layer.height / 2;

    ctx.translate(centerX, centerY);

    if (layer.rotation) {
      ctx.rotate((layer.rotation * Math.PI) / 180);
    }

    if (layer.flipH || layer.flipV) {
      ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
    }

    // Draw the layer canvas with offset padding
    const drawX = -layer.width / 2 - pad;
    const drawY = -layer.height / 2 - pad;

    ctx.drawImage(layerCanvas, drawX, drawY);

    ctx.restore();
  }
}

/**
 * Renders a single layer onto a square or fitting canvas for Dedicated Editing Screen Live Preview
 */
export async function renderLayerPreview(
  layer: LayerObject,
  targetCanvas: HTMLCanvasElement,
  containerW: number,
  containerH: number
): Promise<void> {
  if (layer.type === 'image' && layer.imageData?.src) {
    await preloadImage(layer.imageData.src).catch(() => null);
  }

  targetCanvas.width = containerW;
  targetCanvas.height = containerH;

  const ctx = targetCanvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, containerW, containerH);

  // Draw subtle dark/light checkerboard for transparency
  const tileSize = 16;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, containerW, containerH);
  ctx.fillStyle = '#e2e8f0';
  for (let y = 0; y < containerH; y += tileSize) {
    for (let x = 0; x < containerW; x += tileSize) {
      if ((x / tileSize + y / tileSize) % 2 === 0) {
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  const { canvas: layerCanvas, pad } = renderLayerWithEffects(layer);

  // Compute fit scale so object is large and clear in preview
  const objW = layer.width + pad * 1.2;
  const objH = layer.height + pad * 1.2;
  const fitScale = Math.min((containerW * 0.82) / objW, (containerH * 0.82) / objH, 1.8);

  ctx.save();
  ctx.translate(containerW / 2, containerH / 2);
  ctx.scale(fitScale, fitScale);

  ctx.globalAlpha = Math.max(0, Math.min(1, layer.opacity / 100));
  ctx.globalCompositeOperation = layer.blendMode || 'source-over';

  if (layer.rotation) {
    ctx.rotate((layer.rotation * Math.PI) / 180);
  }

  if (layer.flipH || layer.flipV) {
    ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
  }

  const drawX = -layer.width / 2 - pad;
  const drawY = -layer.height / 2 - pad;

  ctx.drawImage(layerCanvas, drawX, drawY);

  ctx.restore();
}

/**
 * Creates a quick thumbnail string (data URL) for saving with project
 */
export async function createThumbnail(doc: CanvasDocument): Promise<string> {
  const thumbCanvas = document.createElement('canvas');
  const maxDim = 320;
  const scale = Math.min(maxDim / doc.width, maxDim / doc.height, 1);
  await renderDocument(doc, thumbCanvas, scale);
  return thumbCanvas.toDataURL('image/jpeg', 0.8);
}
