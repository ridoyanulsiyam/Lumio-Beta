import type { PresetSize } from '../types/editor.ts';

export const DOCUMENT_PRESETS: PresetSize[] = [
  {
    name: 'Instagram Square',
    category: 'Social Media',
    width: 1080,
    height: 1080,
  },
  {
    name: 'Instagram Portrait',
    category: 'Social Media',
    width: 1080,
    height: 1350,
  },
  {
    name: 'Story / Reel / TikTok',
    category: 'Mobile',
    width: 1080,
    height: 1920,
  },
  {
    name: 'YouTube Thumbnail',
    category: 'Video',
    width: 1280,
    height: 720,
  },
  {
    name: 'Full HD Landscape',
    category: 'Wallpaper / Web',
    width: 1920,
    height: 1080,
  },
  {
    name: 'Facebook Post',
    category: 'Social Media',
    width: 1200,
    height: 630,
  },
  {
    name: 'Square Avatar',
    category: 'Profile',
    width: 500,
    height: 500,
  },
];

export const SYSTEM_FONTS = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'system-ui, sans-serif',
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Trebuchet MS, sans-serif',
  'Impact, sans-serif',
  'Comic Sans MS, cursive',
];
