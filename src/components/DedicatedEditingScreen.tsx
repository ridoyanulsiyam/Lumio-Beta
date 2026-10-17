import React, { useEffect, useRef } from 'react';
import {
  Check,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Sliders,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import type {
  CustomFont,
  EditingSection,
  LayerObject,
  ShapeType,
} from '../types/editor.ts';
import { renderLayerPreview } from '../utils/canvasRenderer.ts';
import { SYSTEM_FONTS } from '../utils/presets.ts';

interface DedicatedEditingScreenProps {
  layer: LayerObject;
  section: EditingSection;
  customFonts: CustomFont[];
  onChange: (updatedLayer: LayerObject) => void;
  onConfirm: () => void; // ✓ button: closes editing screen AND closes properties panel, leaving object independently editable
}

export const DedicatedEditingScreen: React.FC<DedicatedEditingScreenProps> = ({
  layer,
  section,
  customFonts,
  onChange,
  onConfirm,
}) => {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Render live preview on upper 50%
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    const container = previewContainerRef.current;
    if (!canvas || !container) return;

    const w = container.clientWidth || 360;
    const h = container.clientHeight || 280;

    renderLayerPreview(layer, canvas, w, h);
  }, [layer]);

  const update = (patch: Partial<LayerObject>) => {
    onChange({ ...layer, ...patch });
  };

  const updateEffects = (patch: Partial<LayerObject['effects']>) => {
    onChange({
      ...layer,
      effects: {
        ...layer.effects,
        ...patch,
      },
    });
  };

  const titles: Record<EditingSection, string> = {
    transform: 'Transform & Position',
    appearance: 'Appearance & Blending',
    stroke: 'Stroke Effect',
    innerGlow: 'Inner Glow Effect',
    outerGlow: 'Outer Glow Effect',
    dropShadow: 'Drop Shadow Effect',
    gaussianBlur: 'Gaussian Blur Effect',
    motionBlur: 'Motion Blur Effect',
    textSettings: 'Text Typography',
    shapeSettings: 'Shape Properties',
  };

  const blendModes: Array<{ label: string; value: LayerObject['blendMode'] }> = [
    { label: 'Normal', value: 'source-over' },
    { label: 'Multiply', value: 'multiply' },
    { label: 'Screen', value: 'screen' },
    { label: 'Overlay', value: 'overlay' },
    { label: 'Darken', value: 'darken' },
    { label: 'Lighten', value: 'lighten' },
    { label: 'Color Dodge', value: 'color-dodge' },
    { label: 'Color Burn', value: 'color-burn' },
    { label: 'Hard Light', value: 'hard-light' },
    { label: 'Soft Light', value: 'soft-light' },
    { label: 'Difference', value: 'difference' },
    { label: 'Exclusion', value: 'exclusion' },
    { label: 'Luminosity', value: 'luminosity' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col overflow-hidden text-neutral-100 select-none">
      {/* Top Bar with Title and ✓ Confirm Button */}
      <div className="h-14 px-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h2 className="text-sm font-bold tracking-wide uppercase">{titles[section]}</h2>
        </div>

        <button
          onClick={onConfirm}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/50 transition-all cursor-pointer active:scale-95"
          aria-label="Confirm Changes"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          <span>Done</span>
        </button>
      </div>

      {/* Upper ~50%: LIVE PREVIEW */}
      <div
        ref={previewContainerRef}
        className="h-[46%] w-full relative flex items-center justify-center p-3 bg-neutral-950/60 overflow-hidden border-b border-neutral-800/80 shadow-inner"
      >
        <canvas ref={previewCanvasRef} className="max-w-full max-h-full rounded-xl shadow-2xl" />
        <div className="absolute bottom-2 left-3 text-[11px] font-medium tracking-wider text-neutral-400/80 uppercase flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-xs">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Live Real-Time Preview</span>
        </div>
      </div>

      {/* Lower Section: CONTROLS */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-neutral-900">
        {/* TRANSFORM CONTROLS */}
        {section === 'transform' && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Position */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">X Position</label>
                <input
                  type="number"
                  value={layer.x}
                  onChange={(e) => update({ x: Number(e.target.value) })}
                  className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Y Position</label>
                <input
                  type="number"
                  value={layer.y}
                  onChange={(e) => update({ y: Number(e.target.value) })}
                  className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Width & Height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Width (px)</label>
                <input
                  type="number"
                  min="10"
                  value={layer.width}
                  onChange={(e) => update({ width: Math.max(10, Number(e.target.value)) })}
                  className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Height (px)</label>
                <input
                  type="number"
                  min="10"
                  value={layer.height}
                  onChange={(e) => update({ height: Math.max(10, Number(e.target.value)) })}
                  className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Rotation */}
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Rotation</span>
                <span className="font-mono text-neutral-200">{layer.rotation}°</span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={layer.rotation}
                  onChange={(e) => update({ rotation: Number(e.target.value) })}
                  className="flex-1 accent-blue-500 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={() => update({ rotation: 0 })}
                  className="p-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-400 hover:text-white"
                  title="Reset rotation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Flip Horizontal / Vertical */}
            <div>
              <label className="text-xs text-neutral-400 block mb-2">Mirror / Flip</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update({ flipH: !layer.flipH })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                    layer.flipH
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <FlipHorizontal className="w-4 h-4" />
                  <span>Flip Horizontal</span>
                </button>
                <button
                  type="button"
                  onClick={() => update({ flipV: !layer.flipV })}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border transition-all text-xs font-semibold cursor-pointer ${
                    layer.flipV
                      ? 'bg-blue-600/30 border-blue-500 text-blue-300'
                      : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                  }`}
                >
                  <FlipVertical className="w-4 h-4" />
                  <span>Flip Vertical</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APPEARANCE CONTROLS */}
        {section === 'appearance' && (
          <div className="space-y-5 max-w-lg mx-auto">
            {/* Opacity */}
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono text-neutral-200">{layer.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity}
                onChange={(e) => update({ opacity: Number(e.target.value) })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Blend Mode */}
            <div>
              <label className="text-xs text-neutral-400 block mb-2">Blend Mode</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {blendModes.map((bm) => (
                  <button
                    key={bm.value}
                    type="button"
                    onClick={() => update({ blendMode: bm.value })}
                    className={`py-2 px-3 text-xs rounded-xl border text-left cursor-pointer transition-all ${
                      layer.blendMode === bm.value
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {bm.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STROKE CONTROLS */}
        {section === 'stroke' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Stroke</span>
              <input
                type="checkbox"
                checked={layer.effects.stroke.enabled}
                onChange={(e) =>
                  updateEffects({
                    stroke: { ...layer.effects.stroke, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Color */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Stroke Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={layer.effects.stroke.color}
                  onChange={(e) =>
                    updateEffects({
                      stroke: { ...layer.effects.stroke, color: e.target.value, enabled: true },
                    })
                  }
                  className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={layer.effects.stroke.color}
                  onChange={(e) =>
                    updateEffects({
                      stroke: { ...layer.effects.stroke, color: e.target.value, enabled: true },
                    })
                  }
                  className="w-24 bg-neutral-800 border border-neutral-700 px-2 py-1 text-xs font-mono rounded-lg"
                />
              </div>
            </div>

            {/* Size */}
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Stroke Size</span>
                <span className="font-mono">{layer.effects.stroke.size} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={layer.effects.stroke.size}
                onChange={(e) =>
                  updateEffects({
                    stroke: { ...layer.effects.stroke, size: Number(e.target.value), enabled: true },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Opacity */}
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Stroke Opacity</span>
                <span className="font-mono">{layer.effects.stroke.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.effects.stroke.opacity}
                onChange={(e) =>
                  updateEffects({
                    stroke: {
                      ...layer.effects.stroke,
                      opacity: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Position */}
            <div>
              <span className="text-xs text-neutral-400 block mb-1.5">Position</span>
              <div className="grid grid-cols-3 gap-2">
                {(['outside', 'center', 'inside'] as const).map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() =>
                      updateEffects({
                        stroke: { ...layer.effects.stroke, position: pos, enabled: true },
                      })
                    }
                    className={`py-2 text-xs rounded-xl border capitalize cursor-pointer transition-all ${
                      layer.effects.stroke.position === pos
                        ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold'
                        : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* INNER GLOW CONTROLS */}
        {section === 'innerGlow' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Inner Glow</span>
              <input
                type="checkbox"
                checked={layer.effects.innerGlow.enabled}
                onChange={(e) =>
                  updateEffects({
                    innerGlow: { ...layer.effects.innerGlow, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Glow Color</span>
              <input
                type="color"
                value={layer.effects.innerGlow.color}
                onChange={(e) =>
                  updateEffects({
                    innerGlow: {
                      ...layer.effects.innerGlow,
                      color: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{layer.effects.innerGlow.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.effects.innerGlow.opacity}
                onChange={(e) =>
                  updateEffects({
                    innerGlow: {
                      ...layer.effects.innerGlow,
                      opacity: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Blur</span>
                <span className="font-mono">{layer.effects.innerGlow.blur} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={layer.effects.innerGlow.blur}
                onChange={(e) =>
                  updateEffects({
                    innerGlow: {
                      ...layer.effects.innerGlow,
                      blur: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* OUTER GLOW CONTROLS */}
        {section === 'outerGlow' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Outer Glow</span>
              <input
                type="checkbox"
                checked={layer.effects.outerGlow.enabled}
                onChange={(e) =>
                  updateEffects({
                    outerGlow: { ...layer.effects.outerGlow, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Glow Color</span>
              <input
                type="color"
                value={layer.effects.outerGlow.color}
                onChange={(e) =>
                  updateEffects({
                    outerGlow: {
                      ...layer.effects.outerGlow,
                      color: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{layer.effects.outerGlow.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.effects.outerGlow.opacity}
                onChange={(e) =>
                  updateEffects({
                    outerGlow: {
                      ...layer.effects.outerGlow,
                      opacity: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Blur Radius</span>
                <span className="font-mono">{layer.effects.outerGlow.blur} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={layer.effects.outerGlow.blur}
                onChange={(e) =>
                  updateEffects({
                    outerGlow: {
                      ...layer.effects.outerGlow,
                      blur: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Spread</span>
                <span className="font-mono">{layer.effects.outerGlow.spread} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={layer.effects.outerGlow.spread}
                onChange={(e) =>
                  updateEffects({
                    outerGlow: {
                      ...layer.effects.outerGlow,
                      spread: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* DROP SHADOW CONTROLS */}
        {section === 'dropShadow' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Drop Shadow</span>
              <input
                type="checkbox"
                checked={layer.effects.dropShadow.enabled}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: { ...layer.effects.dropShadow, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">Shadow Color</span>
              <input
                type="color"
                value={layer.effects.dropShadow.color}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: {
                      ...layer.effects.dropShadow,
                      color: e.target.value,
                      enabled: true,
                    },
                  })
                }
                className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Opacity</span>
                <span className="font-mono">{layer.effects.dropShadow.opacity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={layer.effects.dropShadow.opacity}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: {
                      ...layer.effects.dropShadow,
                      opacity: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Angle</span>
                <span className="font-mono">{layer.effects.dropShadow.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={layer.effects.dropShadow.angle}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: {
                      ...layer.effects.dropShadow,
                      angle: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Distance</span>
                <span className="font-mono">{layer.effects.dropShadow.distance} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={layer.effects.dropShadow.distance}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: {
                      ...layer.effects.dropShadow,
                      distance: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Blur</span>
                <span className="font-mono">{layer.effects.dropShadow.blur} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={layer.effects.dropShadow.blur}
                onChange={(e) =>
                  updateEffects({
                    dropShadow: {
                      ...layer.effects.dropShadow,
                      blur: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* GAUSSIAN BLUR */}
        {section === 'gaussianBlur' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Gaussian Blur</span>
              <input
                type="checkbox"
                checked={layer.effects.gaussianBlur.enabled}
                onChange={(e) =>
                  updateEffects({
                    gaussianBlur: { ...layer.effects.gaussianBlur, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Blur Amount</span>
                <span className="font-mono">{layer.effects.gaussianBlur.amount} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={layer.effects.gaussianBlur.amount}
                onChange={(e) =>
                  updateEffects({
                    gaussianBlur: {
                      ...layer.effects.gaussianBlur,
                      amount: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* MOTION BLUR */}
        {section === 'motionBlur' && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="flex items-center justify-between p-3 bg-neutral-800/80 rounded-xl border border-neutral-700">
              <span className="text-sm font-semibold">Enable Motion Blur</span>
              <input
                type="checkbox"
                checked={layer.effects.motionBlur.enabled}
                onChange={(e) =>
                  updateEffects({
                    motionBlur: { ...layer.effects.motionBlur, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Direction Angle</span>
                <span className="font-mono">{layer.effects.motionBlur.angle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={layer.effects.motionBlur.angle}
                onChange={(e) =>
                  updateEffects({
                    motionBlur: {
                      ...layer.effects.motionBlur,
                      angle: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Blur Distance / Amount</span>
                <span className="font-mono">{layer.effects.motionBlur.distance} px</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={layer.effects.motionBlur.distance}
                onChange={(e) =>
                  updateEffects({
                    motionBlur: {
                      ...layer.effects.motionBlur,
                      distance: Number(e.target.value),
                      enabled: true,
                    },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TEXT SETTINGS */}
        {section === 'textSettings' && layer.textData && (
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Text Content</label>
              <textarea
                value={layer.textData.text}
                onChange={(e) =>
                  update({
                    textData: { ...layer.textData!, text: e.target.value },
                  })
                }
                rows={3}
                className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Font Family (Includes Custom Fonts!) */}
            <div>
              <label className="text-xs text-neutral-400 block mb-1">Font Family</label>
              <select
                value={layer.textData.fontFamily}
                onChange={(e) =>
                  update({
                    textData: { ...layer.textData!, fontFamily: e.target.value },
                  })
                }
                className="w-full bg-neutral-800 border border-neutral-700 px-3 py-2 rounded-xl text-sm"
              >
                <optgroup label="System Fonts">
                  {SYSTEM_FONTS.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font.split(',')[0]}
                    </option>
                  ))}
                </optgroup>
                {customFonts.length > 0 && (
                  <optgroup label="Custom Imported Fonts">
                    {customFonts.map((f) => (
                      <option key={f.id} value={f.name} style={{ fontFamily: f.name }}>
                        {f.name} (Custom)
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Font Size & Color */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">
                  Font Size ({layer.textData.fontSize}px)
                </label>
                <input
                  type="range"
                  min="12"
                  max="160"
                  value={layer.textData.fontSize}
                  onChange={(e) =>
                    update({
                      textData: { ...layer.textData!, fontSize: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layer.textData.color}
                    onChange={(e) =>
                      update({
                        textData: { ...layer.textData!, color: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono text-neutral-300">
                    {layer.textData.color}
                  </span>
                </div>
              </div>
            </div>

            {/* Alignment & Styles */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center bg-neutral-800 rounded-xl p-1 border border-neutral-700">
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: { ...layer.textData!, textAlign: 'left' },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.textAlign === 'left' ? 'bg-blue-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: { ...layer.textData!, textAlign: 'center' },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.textAlign === 'center'
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400'
                  }`}
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: { ...layer.textData!, textAlign: 'right' },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.textAlign === 'right'
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400'
                  }`}
                >
                  <AlignRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center bg-neutral-800 rounded-xl p-1 border border-neutral-700">
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: {
                        ...layer.textData!,
                        fontWeight: layer.textData!.fontWeight === 'bold' ? 'normal' : 'bold',
                      },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.fontWeight === 'bold'
                      ? 'bg-blue-600 text-white'
                      : 'text-neutral-400'
                  }`}
                >
                  <Bold className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: { ...layer.textData!, isItalic: !layer.textData!.isItalic },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.isItalic ? 'bg-blue-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  <Italic className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    update({
                      textData: { ...layer.textData!, isUnderline: !layer.textData!.isUnderline },
                    })
                  }
                  className={`p-2 rounded-lg cursor-pointer ${
                    layer.textData.isUnderline ? 'bg-blue-600 text-white' : 'text-neutral-400'
                  }`}
                >
                  <Underline className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Letter spacing & Line height */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Letter Spacing</span>
                  <span className="font-mono">{layer.textData.letterSpacing}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={layer.textData.letterSpacing}
                  onChange={(e) =>
                    update({
                      textData: { ...layer.textData!, letterSpacing: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Line Height</span>
                  <span className="font-mono">{layer.textData.lineHeight}</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.5"
                  step="0.1"
                  value={layer.textData.lineHeight}
                  onChange={(e) =>
                    update({
                      textData: { ...layer.textData!, lineHeight: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* SHAPE SETTINGS */}
        {section === 'shapeSettings' && layer.shapeData && (
          <div className="space-y-4 max-w-lg mx-auto">
            {/* Shape Type */}
            <div>
              <label className="text-xs text-neutral-400 block mb-1.5">Change Shape</label>
              <div className="grid grid-cols-4 gap-2">
                {(['rectangle', 'rounded-rect', 'circle', 'triangle', 'star', 'heart', 'polygon'] as ShapeType[]).map(
                  (st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() =>
                        update({
                          shapeData: { ...layer.shapeData!, shapeType: st },
                        })
                      }
                      className={`p-2 text-xs rounded-xl border capitalize cursor-pointer transition-all ${
                        layer.shapeData!.shapeType === st
                          ? 'bg-blue-600/30 border-blue-500 text-blue-300 font-semibold'
                          : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700'
                      }`}
                    >
                      {st.replace('-', ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Fill Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layer.shapeData.fillColor}
                    onChange={(e) =>
                      update({
                        shapeData: { ...layer.shapeData!, fillColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono">{layer.shapeData.fillColor}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Border Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={layer.shapeData.strokeColor}
                    onChange={(e) =>
                      update({
                        shapeData: { ...layer.shapeData!, strokeColor: e.target.value },
                      })
                    }
                    className="w-8 h-8 rounded-lg border border-neutral-700 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs font-mono">{layer.shapeData.strokeColor}</span>
                </div>
              </div>
            </div>

            {/* Border Width */}
            <div>
              <div className="flex justify-between text-xs text-neutral-400 mb-1">
                <span>Border Width</span>
                <span className="font-mono">{layer.shapeData.strokeWidth} px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={layer.shapeData.strokeWidth}
                onChange={(e) =>
                  update({
                    shapeData: { ...layer.shapeData!, strokeWidth: Number(e.target.value) },
                  })
                }
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>

            {/* Corner Radius (for rounded-rect) */}
            {layer.shapeData.shapeType === 'rounded-rect' && (
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1">
                  <span>Corner Radius</span>
                  <span className="font-mono">{(layer.shapeData.cornerRadius ?? 16)} px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={(layer.shapeData.cornerRadius ?? 16)}
                  onChange={(e) =>
                    update({
                      shapeData: { ...layer.shapeData!, cornerRadius: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
