import React, { useState, useRef } from 'react';
import { X, Moon, Sun, Upload, Trash2, Type, ShieldCheck, Check } from 'lucide-react';
import type { CustomFont } from '../types/editor.ts';
import { saveCustomFont, deleteCustomFont, loadFontToDocument } from '../utils/storage.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  customFonts: CustomFont[];
  onFontsUpdated: (fonts: CustomFont[]) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDark,
  onToggleDark,
  customFonts,
  onFontsUpdated,
}) => {
  const [fontError, setFontError] = useState<string | null>(null);
  const [fontSuccess, setFontSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFontError(null);
    setFontSuccess(null);
    setIsUploading(true);

    try {
      // Derive clean font name from file name
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      const cleanFontName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newFont: CustomFont = {
          id: 'font_' + Date.now().toString(36),
          name: cleanFontName,
          fileName: file.name,
          dataUrl,
          format: file.name.split('.').pop() || 'woff',
        };

        const loaded = await loadFontToDocument(newFont);
        if (loaded) {
          await saveCustomFont(newFont);
          onFontsUpdated([...customFonts, newFont]);
          setFontSuccess(`Font "${cleanFontName}" imported successfully!`);
          setTimeout(() => setFontSuccess(null), 3000);
        } else {
          setFontError('Could not parse font file. Ensure it is a valid TTF/OTF/WOFF/WOFF2.');
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        setFontError('Failed to read file.');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setFontError('Error importing font.');
      setIsUploading(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteFont = async (id: string) => {
    await deleteCustomFont(id);
    onFontsUpdated(customFonts.filter((f) => f.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h2 className="text-lg font-bold">Settings & Preferences</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Appearance & Theme */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Appearance
            </h3>
            <div className="flex items-center justify-between p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-medium text-sm">Theme Mode</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {isDark ? 'Dark mode enabled' : 'Light mode enabled'}
                  </div>
                </div>
              </div>

              <button
                onClick={onToggleDark}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-hidden cursor-pointer ${
                  isDark ? 'bg-blue-600' : 'bg-neutral-300'
                }`}
                role="switch"
                aria-checked={isDark}
                aria-label="Toggle Dark Mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
                    isDark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Custom Font Manager */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Custom Fonts
              </h3>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Font</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFontUpload}
              className="hidden"
            />

            {fontSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4 shrink-0" />
                <span>{fontSuccess}</span>
              </div>
            )}

            {fontError && (
              <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200 dark:border-red-800">
                {fontError}
              </div>
            )}

            {customFonts.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-800 text-center text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
                <Type className="w-6 h-6 mx-auto opacity-50 mb-1" />
                <div>No custom fonts imported yet.</div>
                <div className="text-[11px] opacity-75">
                  Import .ttf, .otf, .woff or .woff2 files to use in your text layers.
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {customFonts.map((font) => (
                  <div
                    key={font.id}
                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-800"
                  >
                    <div>
                      <div className="font-semibold text-sm" style={{ fontFamily: font.name }}>
                        {font.name}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        {font.fileName}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteFont(font.id)}
                      className="p-1.5 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                      aria-label={`Delete font ${font.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy & Security */}
          <div className="p-4 bg-neutral-100/70 dark:bg-neutral-800/40 rounded-xl border border-neutral-200/80 dark:border-neutral-800/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                100% Offline & Client-Side Secure
              </div>
              <div className="text-neutral-500 dark:text-neutral-400 leading-relaxed">
                All photos, layers, fonts, and projects are processed and stored locally on your device in IndexedDB. Zero tracking, zero ads, zero third-party scripts.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-medium rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
