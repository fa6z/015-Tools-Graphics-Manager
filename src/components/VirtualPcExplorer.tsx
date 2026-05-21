/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Folder, 
  File, 
  ShieldCheck, 
  Sparkles, 
  Laptop, 
  Layers,
  FileCode
} from 'lucide-react';
import { VirtualPC, PresetPathKey } from '../types';
import { PRESETS } from '../data/initialData';

interface VirtualPcExplorerProps {
  pcState: VirtualPC;
  activePresetKey: PresetPathKey;
  onSelectPresetKey: (key: PresetPathKey) => void;
  whitelistForActiveFolder: string[];
}

export default function VirtualPcExplorer({
  pcState,
  activePresetKey,
  onSelectPresetKey,
  whitelistForActiveFolder,
}: VirtualPcExplorerProps) {
  const selectedFolderData = pcState.folders[activePresetKey] || {
    path: 'C:\\CustomFolder',
    files: [],
  };

  const isWhitelisted = (fileName: string) => {
    return whitelistForActiveFolder.some(
      (wl) => wl.toLowerCase().trim() === fileName.toLowerCase().trim()
    );
  };

  return (
    <div id="pc-explorer-container" className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md transition-all">
      
      {/* Explorer Header */}
      <div className="bg-black/40 px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-white/5">
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            تصفح ملفات جهاز الكمبيوتر
          </span>
        </div>
        <div className="text-[10px] bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 px-3 py-1 rounded-full font-bold">
          مستعرض الملفات والمجلدات
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[400px]">
        
        {/* Sidebar: Presets and Paths */}
        <div className="md:col-span-4 bg-black/20 border-b md:border-b-0 md:border-l border-white/5 p-4 space-y-2">
          <h3 className="text-[10px] font-bold text-slate-400 px-2 uppercase tracking-wider mb-2">
            مجلدات اللعبة والمحاكاة
          </h3>
          <div className="space-y-1.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.key}
                onClick={() => onSelectPresetKey(preset.key)}
                className={`w-full text-right px-3 py-2.5 rounded-xl transition-all text-xs flex flex-col gap-1 border ${
                  activePresetKey === preset.key
                    ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-950/20'
                    : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5 text-slate-300'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 w-full">
                  <span className={`w-1.5 h-1.5 rounded-full ${activePresetKey === preset.key ? 'bg-cyan-400 shadow-[0_0_6px_#22d3ee]' : 'bg-slate-600'}`} />
                  {preset.label}
                </div>
                <span className="text-[9px] font-mono opacity-50 truncate w-full block text-left" dir="ltr">
                  {pcState.folders[preset.key]?.path || preset.defaultPath}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area: File Explorer Output */}
        <div className="md:col-span-8 p-5 flex flex-col bg-transparent">
          
          {/* Current Folder Path Bar */}
          <div className="bg-black/50 p-2.5 rounded-xl border border-white/5 flex items-center gap-2 mb-4">
            <span className="text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 shrink-0">
              المسار الحالي:
            </span>
            <div className="text-xs font-mono text-cyan-400 overflow-x-auto whitespace-nowrap scrollbar-none w-full select-all" dir="ltr">
              {selectedFolderData.path}
            </div>
          </div>

          {/* List of Files */}
          <div className="flex-1 space-y-1.5 max-h-[290px] overflow-y-auto pr-1">
            {selectedFolderData.files && selectedFolderData.files.length > 0 ? (
              selectedFolderData.files.map((file, i) => {
                const whitelisted = isWhitelisted(file.name);
                return (
                  <div
                    key={`${file.name}-${i}`}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      file.isNew
                        ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 animate-pulse'
                        : whitelisted
                        ? 'bg-[#0e211f]/60 border-emerald-500/20 text-cyan-100'
                        : 'bg-white/5 border-white/5 hover:bg-white/[0.08] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-1.5 rounded-lg bg-black/40 text-slate-400 border border-white/5 select-none">
                        {file.type === 'folder' ? (
                          <Folder className="w-4 h-4 text-amber-500 fill-amber-500" />
                        ) : file.name.endsWith('.dll') || file.name.endsWith('.asi') ? (
                          <FileCode className="w-4 h-4 text-cyan-400" />
                        ) : (
                          <File className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="truncate shrink-1">
                        <div className="font-mono text-xs font-medium text-white truncate" dir="ltr">
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
                          <span>{file.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 pr-3">
                      {whitelisted ? (
                        <span className="flex items-center gap-1 text-[9px] px-2.5 py-1 rounded-full font-bold bg-[#112420] border border-emerald-500/30 text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          محمي وباقٍ
                        </span>
                      ) : file.isNew ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/40">
                          حقن جديد ✨
                        </span>
                      ) : (
                        <span className="text-[9px] opacity-45 px-2 py-0.5 rounded border border-white/5 bg-black/20 text-slate-400">
                          يستبدل أثناء الحقن
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500 border border-dashed border-white/10 rounded-2xl">
                <Folder className="w-9 h-9 text-slate-600 mb-2" />
                <span className="text-xs">لا توجد ملفات حالية في المجلد</span>
              </div>
            )}
          </div>

          {/* Quick Guide */}
          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-slate-500 text-[10px]">
            <span className="flex items-center gap-1 font-sans">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              تنبيه: الملفات غير المحمية بالقائمة البيضاء تُزال تلقائياً عند حقن بروفايل مخصص جديد.
            </span>
            <span className="font-mono">
              الملفات: {selectedFolderData.files ? selectedFolderData.files.length : 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
