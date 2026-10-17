import React, { useState } from 'react';
import {
  Move,
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Edit2,
  X,
  Type,
  Square,
  Blend,
  CircleDot,
  Sun,
  Flame,
  CloudFog,
  Wind,
} from 'lucide-react';
import type { EditingSection, LayerObject } from '../types/editor.ts';

interface PropertiesPanelProps {
  layer: LayerObject;
  onOpenSection: (section: EditingSection) => void;
  onClose: () => void;
  // Compact Layer Section actions (on right side)
  onToggleVisibility: () => void;
  onToggleLock: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (newName: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  layer,
  onOpenSection,
  onClose,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onRename,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [tempName, setTempName] = useState(layer.name);

  const handleFinishRename = () => {
    if (tempName.trim()) {
      onRename(tempName.trim());
    }
    setIsRenaming(false);
  };

  const fx = layer.effects;

  return (
    <div className="bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col w-full max-h-[380px] text-neutral-900 dark:text-neutral-100 select-none animate-in slide-in-from-bottom duration-200">
      {/* Top Header of Properties Panel */}
      <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            {layer.type}
          </span>
          {isRenaming ? (
            <input
              type="text"
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleFinishRename}
              onKeyDown={(e) => e.key === 'Enter' && handleFinishRename()}
              className="bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md px-2 py-0.5 text-xs font-semibold focus:outline-hidden"
            />
          ) : (
            <button
              onClick={() => {
                setTempName(layer.name);
                setIsRenaming(true);
              }}
              className="flex items-center gap-1.5 font-bold text-xs hover:text-blue-600 dark:hover:text-blue-400 truncate text-left"
              title="Click to rename"
            >
              <span className="truncate">{layer.name}</span>
              <Edit2 className="w-3 h-3 opacity-50 shrink-0" />
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors ml-2"
          aria-label="Close Properties"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Grid: Left/Center Editing Categories + Right Compact Layer Section */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left / Center: Dynamic Properties Controls */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Object Specific Settings */}
          {layer.type === 'text' && (
            <button
              onClick={() => onOpenSection('textSettings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 hover:border-blue-400 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-blue-600 text-white shadow-xs">
                  <Type className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-950 dark:text-blue-200">
                    Text Typography
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[180px]">
                    "{layer.textData?.text}" ({layer.textData?.fontSize}px)
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
                Edit
              </span>
            </button>
          )}

          {layer.type === 'shape' && (
            <button
              onClick={() => onOpenSection('shapeSettings')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400 transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                  <Square className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-indigo-950 dark:text-indigo-200 capitalize">
                    {layer.shapeData?.shapeType} Fill & Border
                  </div>
                  <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border border-neutral-400"
                      style={{ backgroundColor: layer.shapeData?.fillColor }}
                    />
                    <span>{layer.shapeData?.fillColor}</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-900 px-2 py-1 rounded-lg border border-neutral-200 dark:border-neutral-800">
                Edit
              </span>
            </button>
          )}

          {/* Quick Categories: Transform & Appearance */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onOpenSection('transform')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <Move className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold">Transform</div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {layer.width}×{layer.height} • {layer.rotation}°
                </div>
              </div>
            </button>

            <button
              onClick={() => onOpenSection('appearance')}
              className="flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-all cursor-pointer text-left"
            >
              <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                <Blend className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold">Appearance</div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {layer.opacity}% • {layer.blendMode.replace('source-over', 'normal')}
                </div>
              </div>
            </button>
          </div>

          {/* Effects Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Effects (Independent)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Stroke */}
              <button
                onClick={() => onOpenSection('stroke')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.stroke.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CircleDot className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Stroke</span>
                </div>
                {fx.stroke.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Inner Glow */}
              <button
                onClick={() => onOpenSection('innerGlow')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.innerGlow.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Inner Glow</span>
                </div>
                {fx.innerGlow.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Outer Glow */}
              <button
                onClick={() => onOpenSection('outerGlow')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.outerGlow.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Outer Glow</span>
                </div>
                {fx.outerGlow.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Drop Shadow */}
              <button
                onClick={() => onOpenSection('dropShadow')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.dropShadow.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Sun className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Drop Shadow</span>
                </div>
                {fx.dropShadow.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Gaussian Blur */}
              <button
                onClick={() => onOpenSection('gaussianBlur')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.gaussianBlur.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CloudFog className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Gaussian Blur</span>
                </div>
                {fx.gaussianBlur.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* Motion Blur */}
              <button
                onClick={() => onOpenSection('motionBlur')}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  fx.motionBlur.enabled
                    ? 'border-emerald-500/80 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                    : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 opacity-70" />
                  <span className="font-medium">Motion Blur</span>
                </div>
                {fx.motionBlur.enabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: COMPACT LAYER SECTION */}
        <div className="w-16 border-l border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-950/50 flex flex-col items-center py-2 px-1 justify-between shrink-0">
          <div className="space-y-1.5 w-full flex flex-col items-center">
            {/* Move Up */}
            <button
              onClick={onMoveUp}
              className="w-10 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Move Layer Up"
              aria-label="Move Layer Up"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            {/* Move Down */}
            <button
              onClick={onMoveDown}
              className="w-10 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Move Layer Down"
              aria-label="Move Layer Down"
            >
              <ChevronDown className="w-4 h-4" />
            </button>

            <div className="w-6 h-px bg-neutral-200 dark:bg-neutral-800 my-0.5" />

            {/* Visibility Toggle */}
            <button
              onClick={onToggleVisibility}
              className={`w-10 h-8 flex items-center justify-center rounded-lg transition-colors ${
                layer.isVisible
                  ? 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
                  : 'text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800/50'
              }`}
              title={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
              aria-label={layer.isVisible ? 'Hide Layer' : 'Show Layer'}
            >
              {layer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Lock Toggle */}
            <button
              onClick={onToggleLock}
              className={`w-10 h-8 flex items-center justify-center rounded-lg transition-colors ${
                layer.isLocked
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
              title={layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
              aria-label={layer.isLocked ? 'Unlock Layer' : 'Lock Layer'}
            >
              {layer.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </button>

            {/* Duplicate */}
            <button
              onClick={onDuplicate}
              className="w-10 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
              title="Duplicate Layer"
              aria-label="Duplicate Layer"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          {/* Delete Layer */}
          <div className="pt-2 w-full flex justify-center">
            <button
              onClick={onDelete}
              className="w-10 h-8 flex items-center justify-center rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Delete Layer"
              aria-label="Delete Layer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
