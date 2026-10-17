import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Download,
  Layers,
  Type,
  Square,
  Image as ImageIcon,
  Wrench,
  Hand,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize,
} from 'lucide-react';
import type {
  CanvasDocument,
  CustomFont,
  EditingSection,
  LayerObject,
  ShapeType,
} from '../types/editor.ts';
import {
  createTextLayer,
  createShapeLayer,
  createImageLayer,
  reorderLayers,
  duplicateLayer,
  deleteLayer,
  toggleLayerVisibility,
  toggleLayerLock,
  updateLayer,
  isPointInLayer,
} from '../utils/editorLogic.ts';
import { renderDocument, createThumbnail } from '../utils/canvasRenderer.ts';
import { saveProject } from '../utils/storage.ts';
import { PropertiesPanel } from './PropertiesPanel.tsx';
import { DedicatedEditingScreen } from './DedicatedEditingScreen.tsx';
import { LayerManagerModal } from './LayerManagerModal.tsx';
import { ShapePickerModal } from './ShapePickerModal.tsx';
import { CanvasSettingsModal } from './CanvasSettingsModal.tsx';

interface EditorScreenProps {
  initialDocument: CanvasDocument;
  customFonts: CustomFont[];
  onBackToHome: () => void;
  onOpenExport: (doc: CanvasDocument) => void;
}

export const EditorScreen: React.FC<EditorScreenProps> = ({
  initialDocument,
  customFonts,
  onBackToHome,
  onOpenExport,
}) => {
  const [doc, setDoc] = useState<CanvasDocument>(initialDocument);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

  // Undo / Redo history (stack + pointer kept in one state so updates are atomic)
  const [historyState, setHistoryState] = useState<{ stack: CanvasDocument[]; index: number }>({
    stack: [initialDocument],
    index: 0,
  });
  const history = historyState.stack;
  const historyIndex = historyState.index;
  // Used to merge rapid edits (slider drags, typing) into a single undo step
  const lastPushRef = useRef<{ key: string | null; time: number }>({ key: null, time: 0 });

  // UI Modals & Screens
  const [activeEditingSection, setActiveEditingSection] = useState<EditingSection | null>(null);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState<boolean>(false);
  const [isLayerModalOpen, setIsLayerModalOpen] = useState<boolean>(false);
  const [isShapePickerOpen, setIsShapePickerOpen] = useState<boolean>(false);
  const [isCanvasSettingsOpen, setIsCanvasSettingsOpen] = useState<boolean>(false);

  // Canvas zoom & pan
  const [zoom, setZoom] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveReadyRef = useRef(false);
  const autosaveRevisionRef = useRef(0);

  // Track active layer
  const selectedLayer = doc.layers.find((l) => l.id === selectedLayerId) || null;

  // Auto-fit zoom on mount or resize
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const padding = 32;
    const availW = vp.clientWidth - padding;
    const availH = vp.clientHeight - padding;
    const fitScale = Math.min(availW / doc.width, availH / doc.height, 0.95);
    setZoom(Math.max(0.1, Number(fitScale.toFixed(3))));
  }, [doc.width, doc.height]);

  // Re-render master canvas whenever document changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    void renderDocument(doc, canvas, 1);
  }, [doc]);

  // Debounced offline autosave. Manual Save remains available for an immediate save.
  useEffect(() => {
    if (!autosaveReadyRef.current) {
      autosaveReadyRef.current = true;
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    const revision = ++autosaveRevisionRef.current;
    autosaveTimerRef.current = setTimeout(async () => {
      try {
        const thumbnail = await createThumbnail(doc);
        if (revision !== autosaveRevisionRef.current) return;
        await saveProject({ ...doc, thumbnail, updatedAt: Date.now() });
      } catch (error) {
        console.error('Autosave failed:', error);
      }
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [doc]);

  // Push history state. Edits sharing the same coalesceKey within 700ms replace the
  // latest entry instead of adding a new one, so one slider drag = one undo step.
  const MAX_HISTORY = 100;
  const pushState = useCallback((newDoc: CanvasDocument, coalesceKey?: string) => {
    const now = Date.now();
    const coalesce =
      !!coalesceKey &&
      lastPushRef.current.key === coalesceKey &&
      now - lastPushRef.current.time < 700;
    lastPushRef.current = { key: coalesceKey ?? null, time: now };

    setHistoryState((prev) => {
      const base = prev.stack.slice(0, prev.index + 1);
      if (coalesce && base.length > 1) {
        base[base.length - 1] = newDoc;
        return { stack: base, index: base.length - 1 };
      }
      base.push(newDoc);
      const trimmed = base.length > MAX_HISTORY ? base.slice(base.length - MAX_HISTORY) : base;
      return { stack: trimmed, index: trimmed.length - 1 };
    });
  }, []);

  const handleDocChange = (newDoc: CanvasDocument, recordHistory = true, coalesceKey?: string) => {
    setDoc(newDoc);
    if (recordHistory) {
      pushState(newDoc, coalesceKey);
    }
  };

  // Undo / Redo handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevDoc = history[historyIndex - 1];
      lastPushRef.current = { key: null, time: 0 };
      setHistoryState((s) => ({ ...s, index: s.index - 1 }));
      setDoc(prevDoc);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      lastPushRef.current = { key: null, time: 0 };
      setHistoryState((s) => ({ ...s, index: s.index + 1 }));
      setDoc(nextDoc);
    }
  };

  // Selection Handler: automatically opens Properties Panel as required!
  const selectLayer = (id: string | null) => {
    setSelectedLayerId(id);
    if (id !== null) {
      setIsPropertiesOpen(true);
    } else {
      setIsPropertiesOpen(false);
    }
  };

  // Dedicated Editing Screen: Confirm (✓)
  // Requirement 30: User taps ✓ -> automatically closes Dedicated Editing Screen AND closes Properties Panel.
  // Object is NOT merged or flattened! It remains independently editable.
  const handleConfirmDedicatedEdit = () => {
    setActiveEditingSection(null);
    setIsPropertiesOpen(false);
  };

  // Layer manipulations
  const handleUpdateActiveLayer = (updated: LayerObject) => {
    const nextLayers = updateLayer(doc.layers, updated.id, updated);
    handleDocChange({ ...doc, layers: nextLayers }, true, `layer:${updated.id}`);
  };

  const handleToggleActiveVisibility = () => {
    if (!selectedLayerId) return;
    const nextLayers = toggleLayerVisibility(doc.layers, selectedLayerId);
    handleDocChange({ ...doc, layers: nextLayers });
  };

  const handleToggleActiveLock = () => {
    if (!selectedLayerId) return;
    const nextLayers = toggleLayerLock(doc.layers, selectedLayerId);
    handleDocChange({ ...doc, layers: nextLayers });
  };

  const handleMoveActiveUp = () => {
    if (!selectedLayerId) return;
    const nextLayers = reorderLayers(doc.layers, selectedLayerId, 'up');
    handleDocChange({ ...doc, layers: nextLayers });
  };

  const handleMoveActiveDown = () => {
    if (!selectedLayerId) return;
    const nextLayers = reorderLayers(doc.layers, selectedLayerId, 'down');
    handleDocChange({ ...doc, layers: nextLayers });
  };

  const handleDuplicateActive = () => {
    if (!selectedLayerId) return;
    const { layers: nextLayers, newLayer } = duplicateLayer(doc.layers, selectedLayerId);
    if (newLayer) {
      handleDocChange({ ...doc, layers: nextLayers });
      setSelectedLayerId(newLayer.id);
      setIsPropertiesOpen(true);
    }
  };

  const handleDeleteActive = () => {
    if (!selectedLayerId) return;
    const nextLayers = deleteLayer(doc.layers, selectedLayerId);
    handleDocChange({ ...doc, layers: nextLayers });
    setSelectedLayerId(null);
    setIsPropertiesOpen(false);
  };

  const handleRenameActive = (newName: string) => {
    if (!selectedLayerId) return;
    const nextLayers = updateLayer(doc.layers, selectedLayerId, { name: newName });
    handleDocChange({ ...doc, layers: nextLayers });
  };

  // Add Object Handlers
  const handleAddText = () => {
    const textLayer = createTextLayer(
      'New Text Object',
      Math.round(doc.width / 2 - 200),
      Math.round(doc.height / 2 - 60)
    );
    const nextLayers = [...doc.layers, textLayer];
    handleDocChange({ ...doc, layers: nextLayers });
    setSelectedLayerId(textLayer.id);
    setIsPropertiesOpen(true);
  };

  const handleAddShape = (shapeType: ShapeType) => {
    const shapeLayer = createShapeLayer(
      shapeType,
      Math.round(doc.width / 2 - 150),
      Math.round(doc.height / 2 - 150),
      300,
      300
    );
    const nextLayers = [...doc.layers, shapeLayer];
    handleDocChange({ ...doc, layers: nextLayers });
    setSelectedLayerId(shapeLayer.id);
    setIsPropertiesOpen(true);
  };

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const src = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const imgLayer = createImageLayer(
          src,
          img.naturalWidth || 800,
          img.naturalHeight || 800,
          doc.width,
          doc.height
        );
        const nextLayers = [...doc.layers, imgLayer];
        handleDocChange({ ...doc, layers: nextLayers });
        setSelectedLayerId(imgLayer.id);
        setIsPropertiesOpen(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Save Project to IndexedDB. Returns true when the project was written successfully.
  const handleSave = async (): Promise<boolean> => {
    setSaveStatus('Saving...');
    try {
      const thumbnail = await createThumbnail(doc);
      const docWithThumb: CanvasDocument = {
        ...doc,
        thumbnail,
        updatedAt: Date.now(),
      };
      await saveProject(docWithThumb);
      setDoc(docWithThumb);
      setSaveStatus('Saved!');
      setTimeout(() => setSaveStatus(null), 2500);
      return true;
    } catch (err) {
      console.error('Error saving project:', err);
      setSaveStatus('Error saving');
      setTimeout(() => setSaveStatus(null), 2500);
      return false;
    }
  };

  // Wait for the save to finish BEFORE returning home, otherwise the Home screen
  // can reload its project list before the new/updated project is stored.
  const handleBack = async () => {
    await handleSave();
    onBackToHome();
  };

  // Hand Icon Drag / Object Move System
  // User presses and holds Hand Icon at bottom-right of bounding box -> drag -> object follows smoothly!
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({
    clientX: 0,
    clientY: 0,
    initialX: 0,
    initialY: 0,
  });

  const handleHandStart = (e: React.PointerEvent) => {
    if (!selectedLayer || selectedLayer.isLocked) return;
    e.stopPropagation();
    isDraggingRef.current = true;
    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const startObjX = selectedLayer.x;
    const startObjY = selectedLayer.y;
    const activeId = selectedLayer.id;
    let latestDoc = doc;

    const onPointerMove = (moveEv: PointerEvent) => {
      const dx = (moveEv.clientX - startClientX) / zoom;
      const dy = (moveEv.clientY - startClientY) / zoom;
      const nextX = Math.round(startObjX + dx);
      const nextY = Math.round(startObjY + dy);

      setDoc((prev) => {
        const nextLayers = updateLayer(prev.layers, activeId, { x: nextX, y: nextY });
        const updated = { ...prev, layers: nextLayers };
        latestDoc = updated;
        return updated;
      });
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      isDraggingRef.current = false;
      pushState(latestDoc);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Tap-to-select objects directly on Canvas
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Convert click coordinates to canvas document space
    const clickX = (e.clientX - rect.left) / zoom;
    const clickY = (e.clientY - rect.top) / zoom;

    // Hit test layers from top to bottom
    const reversed = [...doc.layers].reverse();
    const hit = reversed.find((layer) => {
      if (!layer.isVisible) return false;
      return isPointInLayer(layer, clickX, clickY);
    });

    if (hit) {
      selectLayer(hit.id);
    } else {
      selectLayer(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden select-none">
      {/* 1. TOP HEADER TOOLBAR */}
      <header className="h-14 px-3 sm:px-4 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <input
            type="text"
            value={doc.name}
            onChange={(e) => setDoc({ ...doc, name: e.target.value })}
            onBlur={() => {
              if (history[historyIndex]?.name !== doc.name) pushState(doc);
            }}
            className="bg-transparent hover:bg-neutral-800 focus:bg-neutral-800 border-b border-transparent focus:border-blue-500 rounded-md px-2 py-1 text-sm font-bold text-neutral-100 max-w-[140px] sm:max-w-[220px] truncate focus:outline-hidden"
          />
        </div>

        {/* Undo / Redo & Save / Export */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-2 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-2 rounded-xl text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-neutral-800 mx-1" />

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors cursor-pointer"
            title="Save Project"
          >
            {saveStatus === 'Saved!' ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">{saveStatus || 'Save'}</span>
          </button>

          {/* Export Button */}
          <button
            onClick={() => onOpenExport(doc)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-900/40 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </header>

      {/* 2. CANVAS VIEWPORT */}
      <main
        ref={viewportRef}
        onPointerDown={handleCanvasPointerDown}
        className="flex-1 relative overflow-hidden bg-neutral-950 flex items-center justify-center p-4 cursor-default"
      >
        {/* Floating Zoom Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => setZoom((z) => Math.max(0.1, Number((z - 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1.5 text-neutral-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              const vp = viewportRef.current;
              if (vp) {
                const fitScale = Math.min((vp.clientWidth - 32) / doc.width, (vp.clientHeight - 32) / doc.height, 1);
                setZoom(Number(fitScale.toFixed(3)));
              }
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            title="Reset to Fit"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scaled Canvas Container */}
        <div
          data-testid="canvas-artboard"
          onPointerDown={handleCanvasPointerDown}
          style={{
            width: doc.width * zoom,
            height: doc.height * zoom,
          }}
          className="relative transition-transform duration-75 ease-out shadow-2xl rounded-xs flex items-center justify-center cursor-pointer"
        >
          {/* Transparency checkerboard background under canvas */}
          <div className="absolute inset-0 bg-[repeating-conic-gradient(#1f2937_0_25%,#111827_0_50%)] bg-[length:16px_16px] pointer-events-none rounded-xs" />

          {/* Master Output Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-contain rounded-xs"
          />

          {/* BOUNDING BOX & HAND MOVE ICON FOR SELECTED OBJECT */}
          {selectedLayer && selectedLayer.isVisible && (
            <div
              style={{
                position: 'absolute',
                left: selectedLayer.x * zoom,
                top: selectedLayer.y * zoom,
                width: selectedLayer.width * zoom,
                height: selectedLayer.height * zoom,
                transform: selectedLayer.rotation
                  ? `rotate(${selectedLayer.rotation}deg)`
                  : undefined,
                transformOrigin: 'center center',
              }}
              className="pointer-events-auto"
            >
              {/* Bounding box: Approx 20% opacity as explicitly requested in Requirement #7 & #46 */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPropertiesOpen(true);
                }}
                className="w-full h-full border-2 border-blue-500 bg-blue-500/20 rounded-xs relative transition-all cursor-pointer"
                style={{
                  boxShadow: '0 0 0 1px rgba(255, 255, 255, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Corner accent points */}
                <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-xs" />
                <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-xs" />
                <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-blue-600 rounded-full shadow-xs" />

                {/* Hand Icon at Bottom-Right Corner: Hand Icon Move System (Requirement #8 & #46) */}
                <div
                  onPointerDown={handleHandStart}
                  className="absolute -bottom-5 -right-5 w-10 h-10 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-xl border-2 border-white cursor-grab active:cursor-grabbing z-30 transition-transform hover:scale-110 active:scale-95 touch-none"
                  title="Press, hold & drag to move object"
                  aria-label="Hand move handle"
                >
                  <Hand className="w-5 h-5 drop-shadow-xs" />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 3. AUTOMATIC PROPERTIES PANEL (slides up when object selected) */}
      {isPropertiesOpen && selectedLayer && (
        <PropertiesPanel
          layer={selectedLayer}
          onOpenSection={(sec) => setActiveEditingSection(sec)}
          onClose={() => setIsPropertiesOpen(false)}
          onToggleVisibility={handleToggleActiveVisibility}
          onToggleLock={handleToggleActiveLock}
          onMoveUp={handleMoveActiveUp}
          onMoveDown={handleMoveActiveDown}
          onDuplicate={handleDuplicateActive}
          onDelete={handleDeleteActive}
          onRename={handleRenameActive}
        />
      )}

      {/* 4. BOTTOM MAIN TOOLBAR */}
      {/* Requirement #5: Layer | Text | Shape | Import Image | Other Tools */}
      <nav className="h-16 px-2 bg-neutral-900 border-t border-neutral-800 flex items-center justify-around shrink-0 z-20">
        {/* Layer */}
        <button
          onClick={() => setIsLayerModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Layers className="w-5 h-5 text-neutral-300" />
          <span className="text-[10px] font-medium tracking-wide">Layer</span>
        </button>

        {/* Text */}
        <button
          onClick={handleAddText}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Type className="w-5 h-5 text-blue-400" />
          <span className="text-[10px] font-medium tracking-wide">Text</span>
        </button>

        {/* Shape */}
        <button
          onClick={() => setIsShapePickerOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Square className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] font-medium tracking-wide">Shape</span>
        </button>

        {/* Import Image */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ImageIcon className="w-5 h-5 text-emerald-400" />
          <span className="text-[10px] font-medium tracking-wide">Import Image</span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageImport}
          className="hidden"
        />

        {/* Other Tools */}
        <button
          onClick={() => setIsCanvasSettingsOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <Wrench className="w-5 h-5 text-neutral-300" />
          <span className="text-[10px] font-medium tracking-wide">Other Tools</span>
        </button>
      </nav>

      {/* 5. DEDICATED EDITING SCREEN (Opens on tapping any property in Properties Panel) */}
      {activeEditingSection && selectedLayer && (
        <DedicatedEditingScreen
          layer={selectedLayer}
          section={activeEditingSection}
          customFonts={customFonts}
          onChange={handleUpdateActiveLayer}
          onConfirm={handleConfirmDedicatedEdit}
        />
      )}

      {/* 6. MODALS */}
      <LayerManagerModal
        isOpen={isLayerModalOpen}
        onClose={() => setIsLayerModalOpen(false)}
        layers={doc.layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={(id) => {
          selectLayer(id);
          setIsLayerModalOpen(false);
        }}
        onToggleVisibility={(id) => {
          const next = toggleLayerVisibility(doc.layers, id);
          handleDocChange({ ...doc, layers: next });
        }}
        onToggleLock={(id) => {
          const next = toggleLayerLock(doc.layers, id);
          handleDocChange({ ...doc, layers: next });
        }}
        onMoveUp={(id) => {
          const next = reorderLayers(doc.layers, id, 'up');
          handleDocChange({ ...doc, layers: next });
        }}
        onMoveDown={(id) => {
          const next = reorderLayers(doc.layers, id, 'down');
          handleDocChange({ ...doc, layers: next });
        }}
        onDuplicate={(id) => {
          const { layers: next, newLayer } = duplicateLayer(doc.layers, id);
          handleDocChange({ ...doc, layers: next });
          if (newLayer) setSelectedLayerId(newLayer.id);
        }}
        onDelete={(id) => {
          const next = deleteLayer(doc.layers, id);
          handleDocChange({ ...doc, layers: next });
          if (selectedLayerId === id) {
            setSelectedLayerId(null);
            setIsPropertiesOpen(false);
          }
        }}
      />

      <ShapePickerModal
        isOpen={isShapePickerOpen}
        onClose={() => setIsShapePickerOpen(false)}
        onSelectShape={handleAddShape}
      />

      <CanvasSettingsModal
        isOpen={isCanvasSettingsOpen}
        onClose={() => setIsCanvasSettingsOpen(false)}
        width={doc.width}
        height={doc.height}
        backgroundColor={doc.backgroundColor}
        onUpdateCanvas={(w, h, bg) => {
          handleDocChange({
            ...doc,
            width: w,
            height: h,
            backgroundColor: bg,
          });
        }}
        onClearAll={() => {
          handleDocChange({ ...doc, layers: [] });
          setSelectedLayerId(null);
          setIsPropertiesOpen(false);
        }}
        onResetZoom={() => {
          const vp = viewportRef.current;
          if (vp) {
            const fitScale = Math.min((vp.clientWidth - 32) / doc.width, (vp.clientHeight - 32) / doc.height, 1);
            setZoom(Number(fitScale.toFixed(3)));
          }
        }}
      />
    </div>
  );
};
