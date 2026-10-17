import React from 'react';
import {
  X,
  Layers,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  Trash2,
  Copy,
  Type,
  Square,
  Image as ImageIcon,
} from 'lucide-react';
import type { LayerObject } from '../types/editor.ts';

interface LayerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: LayerObject[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const LayerManagerModal: React.FC<LayerManagerModalProps> = ({
  isOpen,
  onClose,
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
}) => {
  if (!isOpen) return null;

  // In standard design tools, the highest index layer is on top of the stack
  const reversedLayers = [...layers].reverse();

  const getLayerIcon = (layer: LayerObject) => {
    switch (layer.type) {
      case 'text':
        return <Type className="w-4 h-4 text-blue-500" />;
      case 'shape':
        return <Square className="w-4 h-4 text-indigo-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border-t sm:border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-bold">Layers ({layers.length})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Layer List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1">
          {layers.length === 0 ? (
            <div className="text-center py-8 text-neutral-400 text-xs">
              No layers yet. Add a text, shape, or image from the toolbar below.
            </div>
          ) : (
            reversedLayers.map((layer) => {
              const isSelected = layer.id === selectedLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => onSelectLayer(layer.id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800">
                      {getLayerIcon(layer)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate">{layer.name}</div>
                      <div className="text-[10px] text-neutral-400 capitalize">
                        {layer.type} • {layer.opacity}% • {layer.blendMode.replace('source-over', 'normal')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Move Up */}
                    <button
                      onClick={() => onMoveUp(layer.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>

                    {/* Move Down */}
                    <button
                      onClick={() => onMoveDown(layer.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {/* Visibility */}
                    <button
                      onClick={() => onToggleVisibility(layer.id)}
                      className={`p-1.5 rounded-lg ${
                        layer.isVisible ? 'text-neutral-500' : 'text-neutral-400 bg-neutral-200/50 dark:bg-neutral-800'
                      }`}
                      title={layer.isVisible ? 'Hide' : 'Show'}
                    >
                      {layer.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    {/* Lock */}
                    <button
                      onClick={() => onToggleLock(layer.id)}
                      className={`p-1.5 rounded-lg ${
                        layer.isLocked ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40' : 'text-neutral-500'
                      }`}
                      title={layer.isLocked ? 'Unlock' : 'Lock'}
                    >
                      {layer.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => onDuplicate(layer.id)}
                      className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => onDelete(layer.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
