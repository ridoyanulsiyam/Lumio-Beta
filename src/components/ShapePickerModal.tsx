import React from 'react';
import { X, Square, Circle, Triangle, Star, Heart, Hexagon } from 'lucide-react';
import type { ShapeType } from '../types/editor.ts';

interface ShapePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShape: (shape: ShapeType) => void;
}

export const ShapePickerModal: React.FC<ShapePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectShape,
}) => {
  if (!isOpen) return null;

  const shapes: Array<{ type: ShapeType; label: string; icon: React.ReactNode }> = [
    { type: 'rectangle', label: 'Rectangle', icon: <Square className="w-6 h-6" /> },
    { type: 'rounded-rect', label: 'Rounded Rect', icon: <Square className="w-6 h-6 rounded-md" /> },
    { type: 'circle', label: 'Circle', icon: <Circle className="w-6 h-6" /> },
    { type: 'triangle', label: 'Triangle', icon: <Triangle className="w-6 h-6" /> },
    { type: 'star', label: 'Star', icon: <Star className="w-6 h-6" /> },
    { type: 'heart', label: 'Heart', icon: <Heart className="w-6 h-6" /> },
    { type: 'polygon', label: 'Hexagon', icon: <Hexagon className="w-6 h-6" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-base font-bold">Select a Shape</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 grid grid-cols-3 gap-3">
          {shapes.map((s) => (
            <button
              key={s.type}
              onClick={() => {
                onSelectShape(s.type);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-all group cursor-pointer"
            >
              <div className="text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:scale-110 transition-transform mb-2">
                {s.icon}
              </div>
              <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
