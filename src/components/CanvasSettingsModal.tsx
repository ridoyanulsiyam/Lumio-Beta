import React, { useState, useEffect } from 'react';
import { X, Wrench, Trash2, Maximize, Paintbrush } from 'lucide-react';

interface CanvasSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  width: number;
  height: number;
  backgroundColor: string;
  onUpdateCanvas: (width: number, height: number, backgroundColor: string) => void;
  onClearAll: () => void;
  onResetZoom: () => void;
}

export const CanvasSettingsModal: React.FC<CanvasSettingsModalProps> = ({
  isOpen,
  onClose,
  width,
  height,
  backgroundColor,
  onUpdateCanvas,
  onClearAll,
  onResetZoom,
}) => {
  const [docW, setDocW] = useState(width);
  const [docH, setDocH] = useState(height);
  const [bg, setBg] = useState(backgroundColor);

  // Re-sync the form with the real canvas every time the dialog opens
  // (otherwise cancelled edits or external size changes would linger).
  useEffect(() => {
    if (isOpen) {
      setDocW(width);
      setDocH(height);
      setBg(backgroundColor);
    }
  }, [isOpen, width, height, backgroundColor]);

  if (!isOpen) return null;

  const clampSize = (v: number) => Math.min(8000, Math.max(100, Math.round(v) || 100));

  const handleApply = () => {
    onUpdateCanvas(clampSize(docW), clampSize(docH), bg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold">Canvas & Tools</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Canvas Dimensions */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              Canvas Dimensions
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Width (px)</span>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={docW}
                  onChange={(e) => setDocW(Number(e.target.value))}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
              <div>
                <span className="text-[11px] text-neutral-400 block mb-1">Height (px)</span>
                <input
                  type="number"
                  min="100"
                  max="8000"
                  value={docH}
                  onChange={(e) => setDocH(Number(e.target.value))}
                  className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Background color */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider block">
              Canvas Background
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={bg === 'transparent' ? '#ffffff' : bg}
                onChange={(e) => setBg(e.target.value)}
                className="w-8 h-8 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-transparent cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setBg('transparent')}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  bg === 'transparent'
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-600'
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                Transparent
              </button>
              <button
                type="button"
                onClick={() => setBg('#ffffff')}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setBg('#000000')}
                className="px-3 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Black
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800 space-y-2">
            <button
              onClick={() => {
                onResetZoom();
                onClose();
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-medium transition-colors"
            >
              <Maximize className="w-4 h-4 text-blue-500" />
              <span>Fit Canvas to Screen</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Clear all layers on canvas?')) {
                  onClearAll();
                  onClose();
                }
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All Layers</span>
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
