/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  X, 
  ShieldCheck, 
  Settings, 
  FileCheck, 
  FolderOpen,
  UploadCloud,
  Layers,
  Sparkles,
  Undo2,
  Trash2
} from 'lucide-react';
import { Profile, PresetPathKey, ProfileSourceFile } from '../types';

interface ProfileEditorProps {
  onSave: (profile: Profile) => void;
  onCancel: () => void;
  initialProfile?: Profile;
  resolvedPaths: Record<PresetPathKey, string>;
}

export default function ProfileEditor({
  onSave,
  onCancel,
  initialProfile,
  resolvedPaths,
}: ProfileEditorProps) {
  const isEdit = !!initialProfile;

  const [name, setName] = useState(initialProfile?.name || '');
  const [description, setDescription] = useState(initialProfile?.description || '');
  const [bgColor, setBgColor] = useState(initialProfile?.bgColor || 'from-cyan-600 to-blue-800');

  const [graphicsQuality, setGraphicsQuality] = useState<'DEFAULT' | 'LOW_NORMAL' | 'ULTRA_HIGH'>(initialProfile?.graphicsQuality || 'DEFAULT');

  // Whitelist items
  const [whitelist, setWhitelist] = useState<string[]>(initialProfile?.whitelist || []);

  // Source files items
  const [sourceFiles, setSourceFiles] = useState<ProfileSourceFile[]>(initialProfile?.sourceFiles || []);

  // Clean targets specify which folder paths to purge prior to installing files to prevent visual clashes
  const [cleanTargets, setCleanTargets] = useState<PresetPathKey[]>(initialProfile?.cleanTargets || []);
  
  // Drag and drop states
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isDraggingWhitelist, setIsDraggingWhitelist] = useState(false);

  // References to file inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const whitelistInputRef = useRef<HTMLInputElement>(null);

  // New file entry destination State
  const [newFileTargetKey, setNewFileTargetKey] = useState<PresetPathKey>('FIVEM_MODS');
  const [newFileCustomPath, setNewFileCustomPath] = useState('');

  // Manual fallback indicators
  const [isManualFileOpen, setIsManualFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileSize, setNewFileSize] = useState('25 MB');

  const [isManualWhitelistOpen, setIsManualWhitelistOpen] = useState(false);
  const [newWhitelistItem, setNewWhitelistItem] = useState('');

  // History stack for Ctrl + Z Undoing
  const [history, setHistory] = useState<{ sourceFiles: ProfileSourceFile[]; whitelist: string[]; graphicsQuality: 'DEFAULT' | 'LOW_NORMAL' | 'ULTRA_HIGH'; cleanTargets: PresetPathKey[] }[]>([]);

  // Ref container keeping live references to prevent stale closures inside global keydown event
  const stateRef = useRef({ sourceFiles, whitelist, graphicsQuality, cleanTargets, history });
  stateRef.current = { sourceFiles, whitelist, graphicsQuality, cleanTargets, history };

  // Push current values to history stack before mutating them
  const pushStateToHistory = (
    filesToSave: ProfileSourceFile[] = sourceFiles, 
    whitelistToSave: string[] = whitelist,
    qualityToSave: 'DEFAULT' | 'LOW_NORMAL' | 'ULTRA_HIGH' = graphicsQuality,
    cleanTargetsToSave: PresetPathKey[] = cleanTargets
  ) => {
    // Keep max history stack of 30 elements to prevent memory bloating
    setHistory((prev) => [...prev, { sourceFiles: filesToSave, whitelist: whitelistToSave, graphicsQuality: qualityToSave, cleanTargets: cleanTargetsToSave }].slice(-30));
  };

  const toggleCleanTarget = (target: PresetPathKey) => {
    pushStateToHistory();
    setCleanTargets((prev) => {
      if (prev.includes(target)) {
        return prev.filter((t) => t !== target);
      } else {
        return [...prev, target];
      }
    });
  };

  const handleUpdateFileTarget = (idx: number, newTarget: PresetPathKey) => {
    pushStateToHistory();
    setSourceFiles((prev) => 
      prev.map((f, i) => i === idx ? { ...f, targetKey: newTarget } : f)
    );
    // Auto-active clean target for the newly updated path
    setCleanTargets((prev) => {
      if (!prev.includes(newTarget)) {
        return [...prev, newTarget];
      }
      return prev;
    });
  };

  const handleUndo = () => {
    const currentHistory = stateRef.current.history;
    if (currentHistory.length > 0) {
      const lastState = currentHistory[currentHistory.length - 1];
      setSourceFiles(lastState.sourceFiles);
      setWhitelist(lastState.whitelist);
      setGraphicsQuality(lastState.graphicsQuality);
      setCleanTargets(lastState.cleanTargets || []);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  // Global Ctrl + Z Hook (Captured phase to always execute first and most reliably)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl+Z or Cmd+Z is pressed
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        // If user is editing a text input or textarea, we can let them undo their typing 
        // unless they click outside or we capture general state undo.
        // Let's execute state undo smoothly.
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  const PRESET_MAPPINGS: Record<PresetPathKey, string> = {
    FIVEM_MODS: 'مجلد mods (FiveM)',
    FIVEM_PLUGINS: 'مجلد plugins (FiveM)',
    FIVEM_APPDATA: 'المجلد الرئيسي لـ FiveM',
    GTA5_MAIN: 'المجلد الرئيسي لـ GTA V',
    GTA5_SFX: 'مجلد x64/audio/sfx (GTA V)',
    CUSTOM: 'مسار مخصص بالكامل',
  };

  // Whitelist presets for ReShade & ENB
  const handleAddReshadePresets = () => {
    pushStateToHistory();
    const reshadeFiles = [
      'dxgi.dll',
      'dxgi.log',
      'd3d11.dll',
      'd3d11.log',
      'ReShade.ini',
      'ReShadePreset.ini',
      'reshade-shaders',
      'ReShade.log',
      'ReShade64.dll',
      'd3d9.dll',
      'd3d12.dll',
      'enbseries',
      'enbseries.ini',
      'enblocal.ini',
      'enbconversion.ini',
      'd3dcompiler_46.dll',
      'd3dcompiler_47.dll',
      'OpenCamera.asi',
      'vmenu.asi'
    ];
    
    // Add missing files without duplicates
    const updated = [...whitelist];
    reshadeFiles.forEach((file) => {
      if (!updated.some((item) => item.toLowerCase() === file.toLowerCase())) {
        updated.push(file);
      }
    });
    setWhitelist(updated);
  };

  const handleClearAllFiles = () => {
    if (sourceFiles.length === 0) return;
    pushStateToHistory();
    setSourceFiles([]);
  };

  const handleSelectFilesClick = async () => {
    if (window.electronAPI) {
      try {
        const files = await window.electronAPI.selectFiles({ defaultPath: resolvedPaths[newFileTargetKey] });
        if (files && files.length > 0) {
          pushStateToHistory();
          const newUploaded: ProfileSourceFile[] = files.map(file => ({
            name: file.name,
            size: file.size,
            type: 'file',
            targetKey: newFileTargetKey,
            realPath: file.realPath,
            customPath: newFileTargetKey === 'CUSTOM' ? (newFileCustomPath.trim() || 'C:\\MyCustomGraphicFolder') : undefined,
          }));
          setSourceFiles((prev) => [...prev, ...newUploaded]);
          
          setCleanTargets((prev) => {
            if (!prev.includes(newFileTargetKey)) {
              return [...prev, newFileTargetKey];
            }
            return prev;
          });
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSelectWhitelistClick = async () => {
    if (window.electronAPI) {
      try {
        const files = await window.electronAPI.selectFiles();
        if (files && files.length > 0) {
          pushStateToHistory();
          const updated = [...whitelist];
          files.forEach(file => {
            if (!updated.includes(file.name)) {
              updated.push(file.name);
            }
          });
          setWhitelist(updated);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      whitelistInputRef.current?.click();
    }
  };

  // Process files selected via picker or drag & drop for Source Files
  const processUploadedFiles = (fileList: FileList) => {
    pushStateToHistory();
    const newUploaded: ProfileSourceFile[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      newUploaded.push({
        name: file.name,
        size: sizeStr,
        type: 'file',
        targetKey: newFileTargetKey,
        realPath: (file as any).path || undefined,
        customPath: newFileTargetKey === 'CUSTOM' ? (newFileCustomPath.trim() || 'C:\\MyCustomGraphicFolder') : undefined,
      });
    }
    setSourceFiles((prev) => [...prev, ...newUploaded]);
    
    // Auto-active cleaning for this target key to prevent graphic conflicts
    setCleanTargets((prev) => {
      if (!prev.includes(newFileTargetKey)) {
        return [...prev, newFileTargetKey];
      }
      return prev;
    });
  };

  // Drop for source files
  const handleDropSourceFiles = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFiles(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFiles(e.dataTransfer.files);
    }
  };

  // Process whitelist files
  const processWhitelistFiles = (fileList: FileList) => {
    pushStateToHistory();
    const updated = [...whitelist];
    for (let i = 0; i < fileList.length; i++) {
      const name = fileList[i].name;
      if (!updated.includes(name)) {
        updated.push(name);
      }
    }
    setWhitelist(updated);
  };

  // Drop for whitelist files
  const handleDropWhitelist = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingWhitelist(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processWhitelistFiles(e.dataTransfer.files);
    }
  };

  const handleManualAddFile = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newFileName.trim();
    if (cleanName) {
      pushStateToHistory();
      const newFile: ProfileSourceFile = {
        name: cleanName,
        size: newFileSize.trim() || '25 MB',
        type: 'file',
        targetKey: newFileTargetKey,
      };
      if (newFileTargetKey === 'CUSTOM') {
        newFile.customPath = newFileCustomPath.trim() || 'C:\\MyCustomGraphicFolder';
      }
      setSourceFiles((prev) => [...prev, newFile]);
      
      // Auto-active cleaning for this target key to prevent graphic conflicts
      setCleanTargets((prev) => {
        if (!prev.includes(newFileTargetKey)) {
          return [...prev, newFileTargetKey];
        }
        return prev;
      });

      setNewFileName('');
    }
  };

  const handleManualAddWhitelist = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItem = newWhitelistItem.trim();
    if (cleanItem && !whitelist.includes(cleanItem)) {
      pushStateToHistory();
      setWhitelist((prev) => [...prev, cleanItem]);
      setNewWhitelistItem('');
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('الرجاء إدخال اسم البروفايل أولاً!');
      return;
    }
    if (sourceFiles.length === 0) {
      alert('الرجاء إضافة أو رفع ملف واحد على الأقل للبروفايل!');
      return;
    }

    onSave({
      id: initialProfile?.id || `profile-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'بروفايل مخصص لمودات الجرافيك.',
      sourceFiles,
      whitelist,
      bgColor,
      graphicsQuality,
      cleanTargets,
    });
  };

  const BACKGROUND_OPTIONS = [
    { value: 'from-cyan-600 to-blue-800', label: 'أزرق هادئ' },
    { value: 'from-purple-600 to-indigo-900', label: 'بنفسجي داكن' },
    { value: 'from-amber-600 to-orange-850', label: 'برتقالي دافئ' },
    { value: 'from-emerald-600 to-teal-900', label: 'أخضر ملكي' },
    { value: 'from-slate-700 to-slate-905', label: 'رمادي وبسيط' },
  ];

  return (
    <div className="bg-[#090b0f]/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 backdrop-blur-md">
      
      {/* Header and Back Button */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-2xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-white">
              {isEdit ? 'تعديل البروفايل' : 'إعداد بروفايل مخصص'}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              صمم ملفاتك وتلقائياً حدد المجلد المستهدف بدون كتابة أسماء يدوية.
            </p>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-300 hover:text-white transition-all bg-white/5 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs cursor-pointer hover:bg-white/10"
        >
          رجوع للوحة التحكم
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* RIGHT COLUMN: Profile details and destinations */}
        <div className="space-y-4">
          
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 border-b border-white/5 pb-2">بيانات ومظهر البروفايل</h3>
            
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400">اسم البروفايل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all font-sans"
                placeholder="مثال: ريزدنت وسماء واضحة"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-400">شرح بسيط (اختياري)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 px-3.5 py-2 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-all font-sans"
                placeholder="لتذكيرك بمحتويات البروفايل..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400">مظهر بطاقة التعديل</label>
              <div className="grid grid-cols-5 gap-1.5">
                {BACKGROUND_OPTIONS.map((bg) => (
                  <button
                    key={bg.value}
                    type="button"
                    onClick={() => setBgColor(bg.value)}
                    className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border transition-all truncate relative ${
                      bgColor === bg.value 
                        ? 'border-cyan-400 text-white shadow-md' 
                        : 'border-white/5 hover:border-white/10 text-slate-400'
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${bg.value} opacity-20`} />
                    <span className="relative z-10">{bg.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Quality Settings Selection */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black text-slate-300">مستوى جودة اللعبة (settings.xml)</span>
                <span className="text-[8px] bg-cyan-950 text-cyan-400 px-1.5 py-0.2 rounded border border-cyan-800/20 font-bold">ذكي ومؤتمت</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    pushStateToHistory();
                    setGraphicsQuality('DEFAULT');
                  }}
                  className={`flex flex-col text-right p-2.5 rounded-xl border transition-all text-xs text-right cursor-pointer ${
                    graphicsQuality === 'DEFAULT'
                      ? 'bg-cyan-950/20 border-cyan-500/40 text-cyan-300'
                      : 'bg-black/25 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
                >
                  <span className="font-extrabold text-[11px] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-cyan-500 bg-cyan-400" />
                    <span>دون تعديل الدقة (الافتراضي للعبة)</span>
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">يبقي على ملف settings.xml بالجهاز كما هو دون تدخل.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    pushStateToHistory();
                    setGraphicsQuality('ULTRA_HIGH');
                  }}
                  className={`flex flex-col text-right p-2.5 rounded-xl border transition-all text-xs text-right cursor-pointer ${
                    graphicsQuality === 'ULTRA_HIGH'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                      : 'bg-black/25 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
                >
                  <span className="font-extrabold text-[11px] text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-emerald-500 bg-emerald-400" />
                    <span>فائقة وجرافيكس كامل (Ultra / Very High) ✨</span>
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">تفعيل أقصى تفاصيل للظلال والمياه والانعكاسات ومعدل تنعيم الحواف.</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    pushStateToHistory();
                    setGraphicsQuality('LOW_NORMAL');
                  }}
                  className={`flex flex-col text-right p-2.5 rounded-xl border transition-all text-xs text-right cursor-pointer ${
                    graphicsQuality === 'LOW_NORMAL'
                      ? 'bg-amber-950/20 border-amber-500/40 text-amber-300'
                      : 'bg-black/25 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
                >
                  <span className="font-extrabold text-[11px] text-amber-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full border border-amber-500 bg-amber-400 col-span-1" />
                    <span>أداء وسلاسة قصوى (Normal / Low) ⚡</span>
                  </span>
                  <span className="text-[9px] text-slate-500 mt-0.5">تعطيل الظلال والانعكاسات وضغط التفاصيل لرفع الفريمات بأقصى شكل.</span>
                </button>
              </div>
            </div>
          </div>

          {/* Automatic Cleanup Settings to prevent conflicts */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-350">تصفير وتنظيف المجلدات تلقائياً قبل التثبيت 🧹</span>
                <span className="text-[9px] bg-[#ef4444]/10 text-[#fca5a5] px-2 py-0.5 rounded border border-[#ef4444]/20 font-bold">الحماية من تضارب المودات</span>
              </div>
            </div>
            
            <p className="text-[10px] text-slate-400 leading-relaxed">
              تفعيل هذا الخيار يقوم بحذف كافة الملفات والمستندات الموجودة مسبقاً في المجلد المعين قبل تنزيل الملفات الجديدة عليه لضمان عدم حدوث تشوه رسومي أو تعليق، <span className="text-[#22d3ee] font-bold">بإستثناء ملفات الوايت ليست (القائمة البيضاء) والملفات الجديدة التي ترفعها لكي لا تفقدها.</span>
            </p>

            <div className="space-y-1.5 pt-1">
              {Object.entries(PRESET_MAPPINGS).map(([key, label]) => {
                const pathKey = key as PresetPathKey;
                const isCleanActive = cleanTargets.includes(pathKey);
                // Check if any of the sourceFiles actually points here to show an indicator
                const hasFilesPointingHere = sourceFiles.some(f => f.targetKey === pathKey);
                return (
                  <button
                    key={pathKey}
                    type="button"
                    onClick={() => toggleCleanTarget(pathKey)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      isCleanActive
                        ? 'bg-rose-950/20 border-rose-500/30 text-rose-300 hover:bg-rose-955/35'
                        : 'bg-black/25 border-white/5 hover:border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isCleanActive
                          ? 'bg-rose-500 border-rose-400 text-white'
                          : 'bg-black/20 border-white/10 text-transparent'
                      }`}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-bold">{label}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0">
                      {hasFilesPointingHere && (
                        <span className="text-[8.5px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/25" title="يوجد ملفات مضافة في هذا البروفايل تذهب لهذا المسار">
                          نشط بالملفات 📁
                        </span>
                      )}
                      <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded ${
                        isCleanActive 
                          ? 'bg-rose-900/35 text-rose-300 border border-rose-500/10' 
                          : 'bg-slate-900/40 text-slate-500'
                      }`}>
                        {isCleanActive ? 'سيتم تصفير المجلد 🧹' : 'متروك كما هو'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* LEFT COLUMN: Upload files and whitelist */}
        <div className="space-y-4">
          
          {/* Files List Management */}
          <div className="border border-white/5 bg-white/[0.02] p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-200">
                  ملفات ومودات هذا البروفايل ({sourceFiles.length})
                </h3>
                {sourceFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllFiles}
                    className="text-[10px] text-rose-400 bg-rose-950/20 border border-rose-800/20 px-2.5 py-0.5 rounded-lg hover:bg-rose-905 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    title="حذف جميع الملفات المحددة حالياً لتفريغ القائمة"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>حذف الكل</span>
                  </button>
                )}
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-bold">توزيع ذكي لعدة مسارات</span>
            </div>

            {/* Target selector card */}
            <div className="bg-black/55 border border-white/5 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-slate-300">
                  📁 1. المجلد المستهدف لرفع الملفات (المحدد حالياً):
                </label>
                <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/45 px-2 py-0.5 rounded border border-cyan-800/25">التحميل النشط</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={newFileTargetKey}
                  onChange={(e) => setNewFileTargetKey(e.target.value as PresetPathKey)}
                  className="w-full bg-cyan-950/25 border border-cyan-500/20 px-3 py-2 rounded-xl text-xs text-cyan-300 font-bold focus:outline-none focus:border-cyan-400 font-sans"
                >
                  {Object.entries(PRESET_MAPPINGS).map(([key, label]) => (
                    <option key={key} value={key} className="bg-[#0c0f14] text-slate-200">
                      {label}
                    </option>
                  ))}
                </select>
                
                <div className="bg-black/35 px-3 py-2 rounded-xl border border-white/5 flex items-center text-[10px] text-slate-400 font-mono truncate" dir="ltr" title={resolvedPaths[newFileTargetKey]}>
                  <span className="text-slate-500 font-semibold ml-1.5 shrink-0 text-[8.5px] bg-slate-800/40 px-1 py-0.2 rounded border border-white/5">المسار:</span>
                  <span className="truncate text-[9.5px] text-cyan-500">{resolvedPaths[newFileTargetKey] || 'N/A'}</span>
                </div>
              </div>

              {newFileTargetKey === 'CUSTOM' && (
                <div className="space-y-1 pt-1">
                  <label className="block text-[9px] text-slate-400">اكتب المسار المخصص بالكامل:</label>
                  <input
                    type="text"
                    value={newFileCustomPath}
                    onChange={(e) => setNewFileCustomPath(e.target.value)}
                    placeholder="مثال: C:\MyAlternativeFolder"
                    className="w-full bg-black/50 border border-cyan-500/30 px-3 py-2 rounded-xl font-mono text-xs text-cyan-400 focus:outline-none"
                    dir="ltr"
                  />
                </div>
              )}
            </div>

            {/* DRAG AND DROP SOURCE FILES */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingFiles(true); }}
              onDragLeave={() => setIsDraggingFiles(false)}
              onDrop={handleDropSourceFiles}
              onClick={handleSelectFilesClick}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 min-h-[90px] ${
                isDraggingFiles 
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]' 
                  : 'border-[#22d3ee]/20 hover:border-[#22d3ee]/40 bg-cyan-950/5 text-slate-350'
              }`}
            >
              <UploadCloud className="w-5 h-5 text-[#22d3ee] animate-bounce" />
              <span className="text-[11px] font-bold">2. اسحب ملفاتك أو انقر للرفع هنا</span>
              <span className="text-[9.5px] text-[#22d3ee]/70 bg-cyan-950/40 px-3 py-0.5 rounded-full border border-cyan-500/15">
                سيتم وضع الملفات المرفوعة تلقائياً في: <span className="underline font-black">{PRESET_MAPPINGS[newFileTargetKey]}</span>
              </span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) processUploadedFiles(e.target.files);
                }} 
                multiple 
                className="hidden" 
              />
            </div>

            {/* Current Added Files list with individual destination changing logic */}
            {sourceFiles.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                <span className="block text-[10px] font-bold text-slate-400">📝 3. مراجعة وتعديل مسار كل ملف على حدة:</span>
                <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                  {sourceFiles.map((file, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 py-2 bg-slate-900/40 border border-white/5 rounded-xl text-xs hover:border-cyan-500/10 transition-all">
                      <div className="flex flex-col min-w-0 flex-1 pr-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span className="font-mono text-white text-[11px] font-bold truncate" dir="ltr">{file.name}</span>
                          <span className="text-[9px] text-slate-500 font-mono shrink-0">({file.size})</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 mt-1 leading-relaxed">
                          سيتم وضع هذا الملف في مجلد:{' '}
                          <span className="text-cyan-400 font-extrabold bg-[#0d212a] px-1.5 py-0.2 rounded border border-cyan-800/30">
                            {PRESET_MAPPINGS[file.targetKey]}
                          </span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        {/* Selector targeting specific folder for this file */}
                        <select
                          value={file.targetKey}
                          onChange={(e) => handleUpdateFileTarget(idx, e.target.value as PresetPathKey)}
                          className="bg-cyan-950/50 border border-cyan-900 hover:border-cyan-500 text-cyan-300 font-sans font-bold text-[10px] px-2 py-1 rounded-lg cursor-pointer leading-tight focus:outline-none transition-all"
                          title="تغيير مجلد التثبيت لهذا الملف"
                        >
                          {Object.entries(PRESET_MAPPINGS).map(([key, label]) => (
                            <option key={key} value={key} className="bg-[#0c0f14] text-slate-200 text-[10px]">
                              {label.replace('مجلد ', '').replace('المجلد الرئيسي لـ ', '')}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            pushStateToHistory();
                            setSourceFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1.5 cursor-pointer hover:bg-rose-950/20 rounded-lg transition-all"
                          title="حذف الملف"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-black/15 border border-white/5 rounded-xl p-4 text-center">
                <span className="text-[10px] text-slate-500 block">لا توجد ملفات مضافة حالياً. اختر مجلد وارفع ملفاتك بالأعلى للبدء 🚀</span>
              </div>
            )}

            {/* Manual Text alternative trigger (just in case they have a simulated file) */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsManualFileOpen(!isManualFileOpen)}
                className="text-[10px] text-slate-500 hover:text-slate-450 underline"
              >
                {isManualFileOpen ? 'إخفاء الإدخال الكتابي اليدوي' : 'إدخال اسم الملف يدوياً بدلاً من رفعه'}
              </button>

              {isManualFileOpen && (
                <form onSubmit={handleManualAddFile} className="grid grid-cols-12 gap-1.5 pt-2">
                  <input
                    type="text"
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    placeholder="اسم الملف (مثال: d3d11.dll)"
                    className="col-span-7 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-[11px] text-white focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newFileSize}
                    onChange={(e) => setNewFileSize(e.target.value)}
                    placeholder="الحجم"
                    className="col-span-3 bg-black/40 border border-white/10 px-2 py-1.5 rounded-lg text-[11px] text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newFileName}
                    className="col-span-2 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-[10px] rounded-lg transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    أضف
                  </button>
                </form>
              )}
            </div>

          </div>

           {/* Whitelist Settings */}
          <div className="border border-white/5 bg-white/[0.02] p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-200">
                  أمان القائمة البيضاء (الوايت ليست)
                </h3>
                <button
                  type="button"
                  onClick={handleAddReshadePresets}
                  className="bg-cyan-950/80 hover:bg-cyan-900 text-[#06b6d4] border border-cyan-800/40 text-[9px] font-bold px-2 py-0.5 rounded-lg cursor-pointer transition-all hover:scale-105 flex items-center gap-1"
                  title="حماية تلقائية لملفات الريشيد ومنع حذفها"
                >
                  <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
                  <span>تأمين ReShade تلقائياً</span>
                </button>
              </div>
              <span className="text-[9px] text-emerald-400 font-bold bg-[#112420] px-2 py-0.5 rounded border border-emerald-800/20">حماية الملفات المحددة من المسح</span>
            </div>
            
            {whitelist.length > 0 && (
              <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                {whitelist.map((w) => (
                  <div key={w} className="bg-emerald-950/25 border border-emerald-500/10 text-[#a5f3fc] px-2.5 py-0.5 rounded-full text-[9px] font-mono flex items-center gap-1.5">
                    <span dir="ltr">{w}</span>
                    <button
                      type="button"
                      onClick={() => {
                        pushStateToHistory();
                        setWhitelist((prev) => prev.filter((item) => item !== w));
                      }}
                      className="text-slate-400 hover:text-rose-455 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* DRAG AND DROP WHITELIST FILES */}
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDraggingWhitelist(true); }}
              onDragLeave={() => setIsDraggingWhitelist(false)}
              onDrop={handleDropWhitelist}
              onClick={handleSelectWhitelistClick}
              className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 min-h-[85px] ${
                isDraggingWhitelist 
                  ? 'border-emerald-400 bg-emerald-950/20 text-emerald-300' 
                  : 'border-white/10 hover:border-white/20 bg-black/20 text-slate-350'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              <span className="text-[11px] font-bold">ارفع أو اسحب ملفاً لحمايته يدوياً</span>
              <span className="text-[9px] text-slate-500">لن يُحذف هذا الملف إطلاقاً أثناء النقل</span>
              <input 
                type="file" 
                ref={whitelistInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) processWhitelistFiles(e.target.files);
                }} 
                multiple 
                className="hidden" 
              />
            </div>

            {/* Manual whitelist alternative input */}
            <div className="pt-1">
              <button 
                type="button"
                onClick={() => setIsManualWhitelistOpen(!isManualWhitelistOpen)}
                className="text-[10px] text-slate-500 hover:text-slate-450 underline"
              >
                {isManualWhitelistOpen ? 'إخفاء الإدخال الكتابي' : 'كتابة اسم ملف وايت ليست يدوياً'}
              </button>

              {isManualWhitelistOpen && (
                <form onSubmit={handleManualAddWhitelist} className="flex gap-1.5 pt-2">
                  <input
                    type="text"
                    value={newWhitelistItem}
                    onChange={(e) => setNewWhitelistItem(e.target.value)}
                    placeholder="اسم الملف (مثال: eve.asi)"
                    className="flex-1 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg text-[11px] text-white focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newWhitelistItem}
                    className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/10 px-4 text-[10px] font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    أضف
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Footer Buttons */}
      <div className="border-t border-white/5 pt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Undo Action helper */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 text-xs hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer hover:border-cyan-500/20 active:scale-95"
            title="تراجع عن آخر تعديل (Ctrl + Z)"
          >
            <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>تراجع (Ctrl+Z)</span>
            {history.length > 0 && (
              <span className="bg-cyan-500/15 text-cyan-400 text-[10px] font-bold px-1.5 py-0.2 rounded-full border border-cyan-500/10">
                {history.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-350 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            إلغاء التراجع
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-605 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>{isEdit ? 'تعديل وحفظ الملفات' : 'حفظ البروفايل'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
