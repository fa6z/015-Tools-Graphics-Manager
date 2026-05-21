/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VirtualFile {
  name: string;
  size: string; // e.g. "12.4 MB" or "45 KB"
  type: 'file' | 'folder';
  isNew?: boolean; // Highlight newly transferred files
  isWhitelisted?: boolean; // Highlight files spared from deletion
  isCompressed?: boolean; // Label file as compressed package
  originalSize?: string; // Cache pre-compressed actual size
  extractedFiles?: VirtualFile[]; // Files to restore when unpacking/decompressing
  realPath?: string; // High-fidelity absolute path on user's real computer
}

export type PresetPathKey = 'FIVEM_MODS' | 'FIVEM_PLUGINS' | 'FIVEM_APPDATA' | 'GTA5_MAIN' | 'GTA5_SFX' | 'CUSTOM';

export interface PresetOption {
  key: PresetPathKey;
  label: string; // Friendly Arabic label
  defaultPath: string; // Hardcoded simulation path
  icon: string;
}

export interface ProfileSourceFile extends VirtualFile {
  targetKey: PresetPathKey;
  customPath?: string; // Optional custom path if targetKey === 'CUSTOM'
}

export interface Profile {
  id: string;
  name: string;
  description: string;
  sourceFiles: ProfileSourceFile[]; // Files to be copied with their individual targets
  whitelist: string[]; // List of file/folder names to spare
  bgColor: string; // Card visual style
  graphicsQuality?: 'DEFAULT' | 'LOW_NORMAL' | 'ULTRA_HIGH';
  cleanTargets?: PresetPathKey[];
  isBackup?: boolean; // Represents a captured backup profile
  backupDate?: string;
}

export interface VirtualPC {
  folders: Record<string, {
    path: string;
    files: VirtualFile[];
  }>;
}

export interface ProcessStep {
  id: string;
  label: string;
  status: 'idle' | 'running' | 'done' | 'error';
  desc: string;
}

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      selectFolder: (defaultPath?: string) => Promise<string | null>;
      selectFiles: (options?: { defaultPath?: string }) => Promise<any[]>;
      readDir: (path: string) => Promise<any[]>;
      copyFile: (src: string, dest: string) => Promise<boolean>;
      deleteFile: (path: string) => Promise<boolean>;
      exists: (path: string) => Promise<boolean>;
      mkdir: (path: string) => Promise<boolean>;
      showItemInFolder: (path: string) => Promise<boolean>;
      openPath: (path: string) => Promise<boolean>;
      writeSettingsXml: (path: string, quality: 'ULTRA_HIGH' | 'LOW_NORMAL') => Promise<boolean>;
      archiveBackup: (profileId: string, files: any[]) => Promise<any[]>;
      deleteBackupFolder: (profileId: string) => Promise<boolean>;
      downloadUpdate: (url: string, tag: string) => Promise<{ success: boolean; path: string }>;
      onDownloadProgress: (callback: (progress: number) => void) => () => void;
    };
  }
}
