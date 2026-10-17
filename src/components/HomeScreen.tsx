import React, { useState } from 'react';
import {
  Plus,
  Settings,
  Layers,
  Sparkles,
  Clock,
  Trash2,
  FolderOpen,
  ChevronRight,
  ShieldCheck,
  LayoutTemplate,
} from 'lucide-react';
import type { CanvasDocument, CustomFont } from '../types/editor.ts';
import { DOCUMENT_PRESETS } from '../utils/presets.ts';
import { createDefaultDocument, createTextLayer, createShapeLayer } from '../utils/editorLogic.ts';
import { deleteProject } from '../utils/storage.ts';
import { NewDocumentModal } from './NewDocumentModal.tsx';
import { SettingsModal } from './SettingsModal.tsx';

interface HomeScreenProps {
  recentProjects: CanvasDocument[];
  onOpenProject: (doc: CanvasDocument) => void;
  onProjectsUpdated: (projects: CanvasDocument[]) => void;
  isDark: boolean;
  onToggleDark: () => void;
  customFonts: CustomFont[];
  onFontsUpdated: (fonts: CustomFont[]) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  recentProjects,
  onOpenProject,
  onProjectsUpdated,
  isDark,
  onToggleDark,
  customFonts,
  onFontsUpdated,
}) => {
  const [isNewDocOpen, setIsNewDocOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleCreateDocument = (
    name: string,
    width: number,
    height: number,
    backgroundColor: string
  ) => {
    setIsNewDocOpen(false);
    const newDoc = createDefaultDocument(name, width, height, backgroundColor);
    onOpenProject(newDoc);
  };

  const handleCreateFromPreset = (presetName: string, w: number, h: number) => {
    const newDoc = createDefaultDocument(presetName, w, h, '#ffffff');
    onOpenProject(newDoc);
  };

  const handleCreateDemoTemplate = () => {
    const doc = createDefaultDocument('Sample Design', 1080, 1080, '#0f172a');
    const shape = createShapeLayer('star', 340, 260, 400, 400);
    shape.shapeData!.fillColor = '#3b82f6';
    shape.effects.outerGlow.enabled = true;
    shape.effects.outerGlow.color = '#60a5fa';

    const text = createTextLayer('CREATIVE\nSTUDIO', 190, 420);
    text.width = 700;
    text.height = 240;
    text.textData!.fontSize = 72;
    text.textData!.color = '#ffffff';
    text.textData!.letterSpacing = 4;
    text.effects.dropShadow.enabled = true;
    text.effects.dropShadow.distance = 16;

    doc.layers = [shape, text];
    onOpenProject(doc);
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Delete this saved project?')) {
      await deleteProject(id);
      onProjectsUpdated(recentProjects.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="px-5 py-4 border-b border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight flex items-center gap-1.5">
              <span>Lumio</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Studio
              </span>
            </h1>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Mobile Graphic & Image Editor
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            title="Settings & Preferences"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-7">
        {/* Hero Action: New Document & Quick Presets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Start Creating
            </h2>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> 100% Offline
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Big Primary New Document Button */}
            <button
              onClick={() => setIsNewDocOpen(true)}
              className="sm:col-span-1 p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/20 flex flex-col justify-between items-start transition-all transform active:scale-98 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <div className="font-bold text-base leading-snug">New Document</div>
                <div className="text-xs text-blue-100/80 mt-0.5">
                  Custom size or standard preset
                </div>
              </div>
            </button>

            {/* Quick Preset Buttons */}
            <div className="sm:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {DOCUMENT_PRESETS.slice(0, 3).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    handleCreateFromPreset(preset.name, preset.width, preset.height)
                  }
                  className="p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-all flex flex-col justify-between text-left cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 w-fit text-neutral-600 dark:text-neutral-300 group-hover:text-blue-600 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="mt-2">
                    <div className="font-bold text-xs truncate">{preset.name.replace('Instagram ', '')}</div>
                    <div className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                      {preset.width} × {preset.height}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Projects Section */}
        {/* Requirement #3: RECENT PROJECTS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Recent Projects ({recentProjects.length})</span>
            </h2>
            {recentProjects.length > 0 && (
              <span className="text-xs text-neutral-400">Tap any project to resume editing</span>
            )}
          </div>

          {recentProjects.length === 0 ? (
            /* Empty State */
            <div className="p-8 sm:p-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/40 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div className="max-w-xs mx-auto space-y-1">
                <div className="font-bold text-sm">No Recent Projects Yet</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Projects you create and save will appear here with all layers and effects completely editable.
                </div>
              </div>
              <div className="pt-2 flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsNewDocOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Create New Canvas
                </button>
                <button
                  onClick={handleCreateDemoTemplate}
                  className="px-4 py-2 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <LayoutTemplate className="w-3.5 h-3.5" />
                  <span>Try Sample Design</span>
                </button>
              </div>
            </div>
          ) : (
            /* Projects Grid */
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {recentProjects.map((project) => (
                <div
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  className="group relative rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all cursor-pointer flex flex-col"
                >
                  {/* Thumbnail Stage */}
                  <div className="aspect-square w-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                    {project.thumbnail ? (
                      <img
                        src={project.thumbnail}
                        alt={project.name}
                        className="w-full h-full object-contain p-2"
                      />
                    ) : (
                      <div className="text-neutral-400 flex flex-col items-center gap-1">
                        <Layers className="w-8 h-8 opacity-40" />
                        <span className="text-[10px]">{project.layers.length} Layers</span>
                      </div>
                    )}

                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => handleDeleteProject(e, project.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-red-600 text-white transition-colors opacity-90 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
                      title="Delete Project"
                      aria-label="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Project Info */}
                  <div className="p-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <div className="font-bold text-xs truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {project.name}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {project.width} × {project.height} • {project.layers.length}L
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modals */}
      <NewDocumentModal
        isOpen={isNewDocOpen}
        onClose={() => setIsNewDocOpen(false)}
        onCreate={handleCreateDocument}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isDark={isDark}
        onToggleDark={onToggleDark}
        customFonts={customFonts}
        onFontsUpdated={onFontsUpdated}
      />
    </div>
  );
};
