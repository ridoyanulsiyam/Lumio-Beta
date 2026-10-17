import React, { useState } from 'react';
import { X, ArrowLeftRight, Check, Sparkles, Layout } from 'lucide-react';
import { DOCUMENT_PRESETS } from '../utils/presets.ts';
import type { PresetSize } from '../types/editor.ts';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, width: number, height: number, backgroundColor: string) => void;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [docName, setDocName] = useState('New Project');
  const [width, setWidth] = useState<number>(1080);
  const [height, setHeight] = useState<number>(1080);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [selectedPreset, setSelectedPreset] = useState<string>('Instagram Square');

  if (!isOpen) return null;

  const handleSwapDimensions = () => {
    const tempW = width;
    setWidth(height);
    setHeight(tempW);
  };

  const handleSelectPreset = (preset: PresetSize) => {
    setSelectedPreset(preset.name);
    setWidth(preset.width);
    setHeight(preset.height);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const finalW = Math.max(100, Math.min(8000, Number(width) || 1080));
    const finalH = Math.max(100, Math.min(8000, Number(height) || 1080));
    onCreate(docName.trim() || 'Untitled Project', finalW, finalH, bgColor);
  };

  const bgOptions = [
    { label: 'White', value: '#ffffff' },
    { label: 'Black', value: '#0a0a0a' },
    { label: 'Slate', value: '#1e293b' },
    { label: 'Transparent', value: 'transparent' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold">New Document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreate} className="p-5 overflow-y-auto space-y-6">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
              Project Name
            </label>
            <input
              type="text"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. Summer Promo, Story Design"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/80 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Presets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Presets (Tap to Apply)
              </label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Standard Sizes
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DOCUMENT_PRESETS.map((preset) => {
                const isSelected = width === preset.width && height === preset.height;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 text-left rounded-xl border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/40 dark:border-blue-500 text-blue-900 dark:text-blue-200 font-medium'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="font-semibold truncate">{preset.name}</div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                      {preset.width} × {preset.height} px
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200/80 dark:border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Manual Dimensions
              </span>
              <button
                type="button"
                onClick={handleSwapDimensions}
                className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                title="Swap Width and Height"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Swap</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={width}
                  onChange={(e) => setWidth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                  Height (px)
                </label>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Canvas Background Color */}
          <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {bgOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setBgColor(opt.value)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-all ${
                    bgColor === opt.value
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-700 ${
                      opt.value === 'transparent'
                        ? 'bg-[repeating-conic-gradient(#cbd5e1_0_25%,#fff_0_50%)] bg-[length:6px_6px]'
                        : ''
                    }`}
                    style={opt.value !== 'transparent' ? { backgroundColor: opt.value } : {}}
                  />
                  <span>{opt.label}</span>
                  {bgColor === opt.value && <Check className="w-3 h-3 text-blue-600 ml-0.5" />}
                </button>
              ))}

              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="color"
                  value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-700 cursor-pointer p-0.5 bg-transparent"
                  title="Pick custom color"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              Create Document
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
