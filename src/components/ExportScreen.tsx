import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Download,
  Image as ImageIcon,
  Layers,
  FileCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import type { CanvasDocument } from '../types/editor.ts';
import { renderDocument } from '../utils/canvasRenderer.ts';
import { exportToPsdBlob, triggerDownload } from '../utils/psdExport.ts';

interface ExportScreenProps {
  document: CanvasDocument;
  onBack: () => void;
}

type ExportFormat = 'png' | 'jpg' | 'psd';
type ExportResolution = 'default' | '2k' | '4k';

export const ExportScreen: React.FC<ExportScreenProps> = ({
  document: doc,
  onBack,
}) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [resolution, setResolution] = useState<ExportResolution>('default');
  const [jpgQuality, setJpgQuality] = useState<number>(92);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Compute target output dimensions based on resolution
  const getScaleFactor = (res: ExportResolution): number => {
    const maxDimension = Math.max(doc.width, doc.height);
    if (res === '2k') {
      return 2048 / maxDimension;
    }
    if (res === '4k') {
      return 3840 / maxDimension;
    }
    return 1; // Default
  };

  const scale = getScaleFactor(resolution);
  const outWidth = Math.round(doc.width * scale);
  const outHeight = Math.round(doc.height * scale);

  // Render on-screen preview
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // Fast preview at fit size
    const previewScale = Math.min(600 / doc.width, 600 / doc.height, 1);
    renderDocument(doc, canvas, previewScale);
  }, [doc]);

  const canvasToBlob = (
    canvas: HTMLCanvasElement,
    type: string,
    quality?: number
  ): Promise<Blob> =>
    new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(blob)
            : reject(
                new Error(
                  'The browser could not create the image. The canvas may be too large for this device - try a lower resolution.'
                )
              ),
        type,
        quality
      );
    });

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    setExportError(null);

    try {
      const cleanFileName = (doc.name || 'lumio_project').replace(/[^a-zA-Z0-9_-]/g, '_');

      if (format === 'psd') {
        const psdBlob = await exportToPsdBlob(doc, scale);
        triggerDownload(psdBlob, `${cleanFileName}.psd`);
        setExportSuccess(`PSD (${outWidth}×${outHeight}px) exported successfully with transformed layers!`);
      } else if (format === 'png') {
        const exportCanvas = window.document.createElement('canvas');
        await renderDocument(doc, exportCanvas, scale);
        const blob = await canvasToBlob(exportCanvas, 'image/png');
        triggerDownload(blob, `${cleanFileName}_${resolution}.png`);
        setExportSuccess(`PNG (${outWidth}×${outHeight}px) exported successfully!`);
      } else if (format === 'jpg') {
        const exportCanvas = window.document.createElement('canvas');
        // If doc background is transparent, fill with white for JPG
        const docForJpg = {
          ...doc,
          backgroundColor:
            doc.backgroundColor === 'transparent' ? '#ffffff' : doc.backgroundColor,
        };
        await renderDocument(docForJpg, exportCanvas, scale);
        const blob = await canvasToBlob(exportCanvas, 'image/jpeg', jpgQuality / 100);
        triggerDownload(blob, `${cleanFileName}_${resolution}.jpg`);
        setExportSuccess(`JPG (${outWidth}×${outHeight}px) exported successfully!`);
      }
    } catch (err) {
      console.error('Export failed:', err);
      setExportError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-neutral-900 text-neutral-100 flex flex-col overflow-hidden select-none">
      {/* Header */}
      <div className="h-14 px-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Editor</span>
        </button>

        <h1 className="text-sm font-bold tracking-wide uppercase">Export Project</h1>

        <div className="w-20" /> {/* Spacer */}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left/Top: Preview Stage */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-neutral-950/70 border-b md:border-b-0 md:border-r border-neutral-800 relative">
          <div className="max-w-full max-h-[50vh] md:max-h-[75vh] flex items-center justify-center p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-2xl">
            <canvas ref={previewCanvasRef} className="max-w-full max-h-full object-contain rounded-lg" />
          </div>

          <div className="mt-3 text-xs text-neutral-400 font-mono flex items-center gap-2">
            <span>Dimensions: {outWidth} × {outHeight} px</span>
            <span>•</span>
            <span>{doc.layers.length} Layers</span>
          </div>

          {exportError && (
            <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 max-w-sm p-3 bg-red-950/90 border border-red-700 text-red-200 text-xs rounded-xl shadow-xl">
              {exportError}
            </div>
          )}

          {exportSuccess && (
            <div className="absolute top-4 left-4 right-4 md:left-auto md:right-4 max-w-sm flex items-center gap-2 p-3 bg-emerald-950/90 border border-emerald-700 text-emerald-200 text-xs rounded-xl shadow-xl animate-in fade-in">
              <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{exportSuccess}</span>
            </div>
          )}
        </div>

        {/* Right/Bottom: Export Settings Sidebar */}
        <div className="w-full md:w-96 p-5 overflow-y-auto space-y-6 bg-neutral-900">
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              File Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  format === 'png'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                    : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">PNG</span>
                <span className="text-[10px] opacity-70">Transparent</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('jpg')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  format === 'jpg'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                    : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">JPG</span>
                <span className="text-[10px] opacity-70">Optimized</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('psd')}
                className={`py-3 px-2 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  format === 'psd'
                    ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                    : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                }`}
              >
                <Layers className="w-5 h-5" />
                <span className="text-xs">PSD</span>
                <span className="text-[10px] opacity-70">Layered PSD</span>
              </button>
            </div>
          </div>

          {/* Resolutions */}
          {(
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
                  Export Resolution
                </label>
                <span className="text-[11px] text-blue-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Sharp Export
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: 'default', label: 'Default', desc: '1x Size' },
                    { id: '2k', label: '2K', desc: 'High Res' },
                    { id: '4k', label: '4K', desc: 'Ultra HD' },
                  ] as const
                ).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setResolution(r.id)}
                    className={`py-2.5 px-2 rounded-xl border flex flex-col items-center gap-0.5 cursor-pointer transition-all ${
                      resolution === r.id
                        ? 'border-blue-500 bg-blue-600/20 text-blue-300 font-bold'
                        : 'border-neutral-800 bg-neutral-800/60 text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{r.label}</span>
                    <span className="text-[10px] opacity-70">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quality for JPG */}
          {format === 'jpg' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-neutral-400">
                <span>JPEG Quality</span>
                <span className="font-mono text-neutral-200">{jpgQuality}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="100"
                value={jpgQuality}
                onChange={(e) => setJpgQuality(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* PSD info */}
          {format === 'psd' && (
            <div className="p-3.5 bg-neutral-800/70 border border-neutral-700/60 rounded-xl space-y-1.5 text-xs text-neutral-300">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Multi-Layer PSD Preserved</span>
              </div>
              <p className="text-neutral-400 leading-relaxed text-[11px]">
                Each text, shape, and image is exported as an independent rasterized Photoshop layer with transparency, transformed coordinates, names, order, opacity, and blend mode preserved.
              </p>
            </div>
          )}

          {/* Download Action Button */}
          <div className="pt-4">
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-800 text-white font-bold text-sm shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Export...</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>Download {format.toUpperCase()}</span>
                </>
              )}
            </button>
            <div className="text-center text-[11px] text-neutral-500 mt-2">
              Your editable project remains unchanged and safe.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
