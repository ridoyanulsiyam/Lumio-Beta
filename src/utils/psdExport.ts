import { writePsd } from 'ag-psd';
import type { BlendMode, CanvasDocument, LayerObject } from '../types/editor.ts';
import { renderLayerWithEffects } from './canvasRenderer.ts';
import { scaleLayer } from './editorLogic.ts';

type PsdLayer = {
  name: string;
  left: number;
  top: number;
  canvas: HTMLCanvasElement;
  opacity: number;
  hidden: boolean;
  blendMode?: string;
};

const BLEND_MODE_MAP: Record<BlendMode, string> = {
  'source-over': 'normal',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay',
  darken: 'darken',
  lighten: 'lighten',
  'color-dodge': 'color dodge',
  'color-burn': 'color burn',
  'hard-light': 'hard light',
  'soft-light': 'soft light',
  difference: 'difference',
  exclusion: 'exclusion',
  hue: 'hue',
  saturation: 'saturation',
  color: 'color',
  luminosity: 'luminosity',
};

function createTransformedLayer(layer: LayerObject, padScale = 1): {
  canvas: HTMLCanvasElement;
  left: number;
  top: number;
} {
  const { canvas: source, pad } = renderLayerWithEffects(layer, padScale);
  const angle = ((layer.rotation % 360) * Math.PI) / 180;
  const sourceW = source.width;
  const sourceH = source.height;
  const cos = Math.abs(Math.cos(angle));
  const sin = Math.abs(Math.sin(angle));
  const outW = Math.max(1, Math.ceil(sourceW * cos + sourceH * sin));
  const outH = Math.max(1, Math.ceil(sourceW * sin + sourceH * cos));

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      canvas: source,
      left: Math.round(layer.x - pad),
      top: Math.round(layer.y - pad),
    };
  }

  ctx.translate(outW / 2, outH / 2);
  ctx.rotate(angle);
  ctx.scale(layer.flipH ? -1 : 1, layer.flipV ? -1 : 1);
  ctx.drawImage(source, -sourceW / 2, -sourceH / 2);

  const centerX = layer.x + layer.width / 2;
  const centerY = layer.y + layer.height / 2;
  return {
    canvas,
    left: Math.round(centerX - outW / 2),
    top: Math.round(centerY - outH / 2),
  };
}

function parseRgb(color: string): { r: number; g: number; b: number } {
  const hex = color.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function createPsdTextData(layer: LayerObject): any | undefined {
  if (layer.type !== 'text' || !layer.textData) return undefined;
  const data = layer.textData;
  const rgb = parseRgb(data.color);
  const fontName = data.fontFamily.split(',')[0].trim().replace(/^['"]|['"]$/g, '') || 'ArialMT';
  const tracking = data.letterSpacing === 0 ? 0 : (data.letterSpacing / Math.max(1, data.fontSize)) * 1000;
  const justification = data.textAlign;

  return {
    text: data.text,
    transform: [1, 0, 0, 1, layer.x * 1, layer.y * 1],
    bounds: {
      top: { value: 0, units: 'Pixels' },
      left: { value: 0, units: 'Pixels' },
      right: { value: layer.width, units: 'Pixels' },
      bottom: { value: layer.height, units: 'Pixels' },
    },
    style: {
      font: { name: fontName, script: 0, type: 0, synthetic: 0 },
      fontSize: data.fontSize,
      fauxBold: data.fontWeight !== 'normal',
      fauxItalic: data.isItalic,
      autoLeading: true,
      leading: data.fontSize * data.lineHeight,
      horizontalScale: 1,
      verticalScale: 1,
      tracking,
      autoKerning: true,
      underline: data.isUnderline,
      fillColor: rgb,
      fillFlag: true,
      strokeFlag: false,
      fillFirst: true,
    },
    paragraphStyle: {
      justification,
      firstLineIndent: 0,
      startIndent: 0,
      endIndent: 0,
      spaceBefore: 0,
      spaceAfter: 0,
      autoHyphenate: false,
      autoLeading: data.lineHeight,
      wordSpacing: [0.8, 1, 1.33],
      letterSpacing: [0, 0, 0],
      glyphSpacing: [1, 1, 1],
    },
    styleRuns: [{
      length: data.text.length,
      style: {
        font: { name: fontName, script: 0, type: 0, synthetic: 0 },
        fontSize: data.fontSize,
        fauxBold: data.fontWeight !== 'normal',
        fauxItalic: data.isItalic,
        autoLeading: true,
        leading: data.fontSize * data.lineHeight,
        tracking,
        autoKerning: true,
        underline: data.isUnderline,
        fillColor: rgb,
        fillFlag: true,
        strokeFlag: false,
        fillFirst: true,
      },
    }],
    paragraphStyleRuns: [{
      length: data.text.length,
      paragraphStyle: {
        justification,
        firstLineIndent: 0,
        startIndent: 0,
        endIndent: 0,
        spaceBefore: 0,
        spaceAfter: 0,
        autoHyphenate: false,
        wordSpacing: [0.8, 1, 1.33],
        letterSpacing: [0, 0, 0],
        glyphSpacing: [1, 1, 1],
      },
    }],
  };
}

export async function exportToPsdBlob(doc: CanvasDocument, scale = 1): Promise<Blob> {
  const psdWidth = Math.max(1, Math.round(doc.width * scale));
  const psdHeight = Math.max(1, Math.round(doc.height * scale));
  const psdLayers: any[] = [];

  const composites: Array<{
    canvas: HTMLCanvasElement;
    left: number;
    top: number;
    opacity: number;
    hidden: boolean;
    canvasBlend: GlobalCompositeOperation;
  }> = [];

  for (const layer of doc.layers) {
    // Render each layer natively at the export resolution (no bitmap upscaling)
    const scaledLayer = scaleLayer(layer, scale);
    const transformed = createTransformedLayer(scaledLayer, scale);
    const layerCanvas = transformed.canvas;
    const left = Math.round(transformed.left);
    const top = Math.round(transformed.top);
    const opacity = Math.max(0, Math.min(1, layer.opacity / 100));

    const psdLayer: any = {
      name: layer.name,
      left,
      top,
      canvas: layerCanvas,
      opacity,
      hidden: !layer.isVisible,
      blendMode: BLEND_MODE_MAP[layer.blendMode] || 'normal',
    };

    const textData = createPsdTextData(layer);
    if (textData) {
      textData.transform = [1, 0, 0, 1, layer.x * scale, layer.y * scale];
      textData.style.fontSize *= scale;
      textData.style.leading *= scale;
      textData.bounds.right.value *= scale;
      textData.bounds.bottom.value *= scale;
      textData.styleRuns[0].style.fontSize *= scale;
      textData.styleRuns[0].style.leading *= scale;
      psdLayer.text = textData;
    }

    psdLayers.push(psdLayer);
    composites.push({
      canvas: layerCanvas,
      left,
      top,
      opacity,
      hidden: !layer.isVisible,
      // Canvas uses names like "color-dodge" while PSD uses "color dodge",
      // so keep the canvas value separately for the flattened preview image.
      canvasBlend: layer.blendMode || 'source-over',
    });
  }

  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = psdWidth;
  compositeCanvas.height = psdHeight;
  const ctx = compositeCanvas.getContext('2d');

  if (ctx) {
    if (doc.backgroundColor && doc.backgroundColor !== 'transparent') {
      ctx.fillStyle = doc.backgroundColor;
      ctx.fillRect(0, 0, psdWidth, psdHeight);
    }

    for (const item of composites) {
      if (item.hidden) continue;
      ctx.save();
      ctx.globalAlpha = item.opacity;
      ctx.globalCompositeOperation = item.canvasBlend;
      ctx.drawImage(item.canvas, item.left, item.top);
      ctx.restore();
    }
  }

  const psdData: any = {
    width: psdWidth,
    height: psdHeight,
    canvas: compositeCanvas,
    children: psdLayers.length > 0 ? psdLayers : undefined,
  };

  const buffer = writePsd(psdData, { generateThumbnail: true, invalidateTextLayers: false });
  return new Blob([buffer], { type: 'application/x-photoshop' });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}
