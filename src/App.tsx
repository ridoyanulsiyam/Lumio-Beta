import { useState, useEffect } from 'react';
import type { CanvasDocument, CustomFont } from './types/editor.ts';
import {
  getAllProjects,
  initializeAllCustomFonts,
  getSetting,
  saveSetting,
} from './utils/storage.ts';
import { HomeScreen } from './components/HomeScreen.tsx';
import { EditorScreen } from './components/EditorScreen.tsx';
import { ExportScreen } from './components/ExportScreen.tsx';

type Screen = 'home' | 'editor' | 'export';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [currentDocument, setCurrentDocument] = useState<CanvasDocument | null>(null);
  const [recentProjects, setRecentProjects] = useState<CanvasDocument[]>([]);
  const [customFonts, setCustomFonts] = useState<CustomFont[]>([]);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize theme, custom fonts, and saved projects on mount
  useEffect(() => {
    async function initApp() {
      try {
        // Theme
        const savedTheme = await getSetting<string>('theme', 'dark');
        const darkModeActive = savedTheme === 'dark';
        setIsDark(darkModeActive);
        if (darkModeActive) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }

        // Custom Fonts
        const loadedFonts = await initializeAllCustomFonts();
        setCustomFonts(loadedFonts);

        // Projects
        const projects = await getAllProjects();
        setRecentProjects(projects);
      } catch (e) {
        console.error('Initialization error:', e);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, []);

  const handleToggleDark = async () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    await saveSetting('theme', nextDark ? 'dark' : 'light');
  };

  const handleOpenProject = (doc: CanvasDocument) => {
    setCurrentDocument(doc);
    setActiveScreen('editor');
  };

  const handleBackToHome = async () => {
    // Refresh project list
    const projects = await getAllProjects();
    setRecentProjects(projects);
    setActiveScreen('home');
  };

  const handleOpenExport = (doc: CanvasDocument) => {
    setCurrentDocument(doc);
    setActiveScreen('export');
  };

  const handleBackToEditor = () => {
    setActiveScreen('editor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-wider uppercase">Loading Lumio...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {activeScreen === 'home' && (
        <HomeScreen
          recentProjects={recentProjects}
          onOpenProject={handleOpenProject}
          onProjectsUpdated={setRecentProjects}
          isDark={isDark}
          onToggleDark={handleToggleDark}
          customFonts={customFonts}
          onFontsUpdated={setCustomFonts}
        />
      )}

      {activeScreen === 'editor' && currentDocument && (
        <EditorScreen
          initialDocument={currentDocument}
          customFonts={customFonts}
          onBackToHome={handleBackToHome}
          onOpenExport={handleOpenExport}
        />
      )}

      {activeScreen === 'export' && currentDocument && (
        <ExportScreen
          document={currentDocument}
          onBack={handleBackToEditor}
        />
      )}
    </div>
  );
}
