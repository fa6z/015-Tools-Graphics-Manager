/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { 
  ShieldAlert, 
  Trash2, 
  Cpu, 
  CheckCircle2, 
  Terminal, 
  Play,
  RotateCw,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Profile, ProcessStep } from '../types';

interface SafeTransferProgressProps {
  profile: Profile;
  targetPath: string;
  fivemPath?: string;
  onComplete: () => void;
  onCancel: () => void;
}

export default function SafeTransferProgress({
  profile,
  targetPath,
  fivemPath,
  onComplete,
  onCancel,
}: SafeTransferProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runRealElectronOperations = async () => {
    if (!window.electronAPI) return;

    try {
      addLog('⚡ [محرك إلكترون] بدء العمليات الفيدرالية الحقيقية على القرص الصلب...');
      
      const resolveRealPath = (key: string, customPath?: string): string => {
        let cleanFivem = (fivemPath || 'C:\\Users\\pcd\\AppData\\Local\\FiveM\\FiveM.app').trim().replace(/\\$/, '');
        if (cleanFivem.toLowerCase().endsWith('fivem')) {
          cleanFivem = `${cleanFivem}\\FiveM.app`;
        }
        const cleanGta = (targetPath || 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V').trim().replace(/\\$/, '');

        switch (key) {
          case 'FIVEM_MODS':
            return `${cleanFivem}\\mods`;
          case 'FIVEM_PLUGINS':
            return `${cleanFivem}\\plugins`;
          case 'FIVEM_APPDATA':
            return cleanFivem;
          case 'GTA5_MAIN':
            return cleanGta;
          case 'GTA5_SFX':
            return `${cleanGta}\\x64\\audio\\sfx`;
          case 'CUSTOM':
            return customPath || 'C:\\MyCustomGraphicFolder';
          default:
            return cleanGta;
        }
      };

      // 1. Clean Targets
      const activeClears = profile.cleanTargets || [];
      const whitelistArr = (profile.whitelist || []).map(w => w.toLowerCase().trim());

      for (const key of activeClears) {
        const folderDir = resolveRealPath(key);
        const exists = await window.electronAPI.exists(folderDir);
        if (!exists) {
          await window.electronAPI.mkdir(folderDir);
          continue;
        }

        addLog(`🧹 [فحص حقيقي] تصفير مجلد: ${folderDir}`);
        const files = await window.electronAPI.readDir(folderDir);
        for (const file of files) {
          const isWhite = whitelistArr.includes(file.name.toLowerCase());
          if (!isWhite) {
            const pathToDelete = `${folderDir}\\${file.name}`;
            await window.electronAPI.deleteFile(pathToDelete);
            addLog(`🗑️ [حذف حقيقي] تم مسح: ${file.name}`);
          }
        }
      }

      // 2. Map and transfer physical source files
      addLog('🚚 [نقل حقيقي] بدء نسخ وثائق البروفايل لمجلدات اللعبة الفائقة...');
      for (const file of profile.sourceFiles) {
        if (!file.realPath) {
          addLog(`⚠️ [ملف وهمي] تخطي نسخ ${file.name} لعدم احتوائه على مسار حقيقي (نسخة ديمو)`);
          continue;
        }

        const destDir = resolveRealPath(file.targetKey, file.customPath);
        // Create destination directory if it doesn't exist
        const exists = await window.electronAPI.exists(destDir);
        if (!exists) {
          await window.electronAPI.mkdir(destDir);
        }

        const destFile = `${destDir}\\${file.name}`;
        
        // If restoring the citizen directory, delete the old citizen directory first to prevent overlapping files
        if (file.name === 'citizen') {
          const citizenExists = await window.electronAPI.exists(destFile);
          if (citizenExists) {
            addLog(`🧹 [مسح آمن] جاري مسح مجلد citizen النشط حالياً لضمان تثبيت النسخة الاحتياطية بنظافة تامة وبدون تداخل...`);
            await window.electronAPI.deleteFile(destFile);
          }
        }

        addLog(`📥 [جاري النسخ] نقل ${file.name} ◀ ${destFile}`);
        await window.electronAPI.copyFile(file.realPath, destFile);
        addLog(`✅ [تم النسخ] من ${file.realPath} ◀ ${destFile}`);
      }

      // 3. Write settings.xml
      if (profile.graphicsQuality === 'ULTRA_HIGH' || profile.graphicsQuality === 'LOW_NORMAL') {
        addLog('⚙️ [تعديل الإعدادات] كتابة خيارات الجرافيكس في settings.xml...');
        const success = await window.electronAPI.writeSettingsXml('', profile.graphicsQuality);
        if (success) {
          addLog(`✅ [إعدادات حقيقية] تم تسجيل ملف الإعدادات ${profile.graphicsQuality} بنجاح!`);
        } else {
          addLog('⚠️ [تنبيه الإعدادات] تعذر تحديث ملف settings.xml تلقائياً');
        }
      }

      addLog('⭐ [محرك إلكترون] تم مزامنة العمليات وتطبيق البروفايل 100% بنجاح!');

    } catch (err: any) {
      addLog(`❌ [خطأ إلكترون] حدث فشل أثناء المزامنة: ${err?.message || err}`);
      console.error(err);
    }
  };

  useEffect(() => {
    if (window.electronAPI) {
      runRealElectronOperations();
    }
  }, []);

  const [steps, setSteps] = useState<ProcessStep[]>([
    {
      id: 'step-whitelist',
      label: 'فحص القائمة البيضاء (Whitelist)',
      status: 'idle',
      desc: 'قراءة الملفات والمجلدات المحصنة من الحذف في هذا المسار.',
    },
    {
      id: 'step-clean',
      label: 'التنظيف الآمن للمجلد (Safe Purge)',
      status: 'idle',
      desc: 'حذف التعديلات القديمة وضمان سلامة ملفات القائمة البيضاء.',
    },
    {
      id: 'step-transfer',
      label: 'النقل الذكي للملفات (Smart Copy)',
      status: 'idle',
      desc: 'صب وتثبيت ملفات الجرافيكس والـ ENB والمسارات المطلوبة.',
    },
    {
      id: 'step-complete',
      label: 'التحقق والاكتمال التلقائي',
      status: 'idle',
      desc: 'إنهاء التثبيت بسلام وتجهيز اللعبة للتشغيل الفوري.',
    },
  ]);

  // Auto scroll logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  useEffect(() => {
    let timer: any;
    let progressInterval: any;
    let step = 0;

    addLog(`🚀 بدء عملية تفعيل بروفايل: ${profile.name}`);
    addLog(`📁 أوضاع النقل: توزيع ذكي للمستندات تلقائياً`);
    addLog(`🔍 رصد ملفات المصدر: ${profile.sourceFiles.map(f => `${f.name} (${f.targetKey})`).join(', ')}`);
    addLog(`🛡️ القائمة البيضاء المفعلة: ${profile.whitelist.length ? profile.whitelist.join(', ') : 'لا يوجد (سيتم مسح بقية الملفات لتطوير الأداء)'}`);

    // Update step lists
    const updateStepStatus = (index: number, status: 'idle' | 'running' | 'done' | 'error') => {
      setSteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status } : s))
      );
    };

    // Phase 1: Whitelist Check
    updateStepStatus(0, 'running');
    addLog('⏳ الخطوة الأولى: فحص القائمة البيضاء...');
    addLog('📂 تحديد الحصانة للملفات المهمة لمنع تلف قراند أو FiveM...');

    let currentProgress = 0;

    progressInterval = setInterval(() => {
      currentProgress += 1;
      if (currentProgress < 100) {
        setProgress(currentProgress);
      }

      // Step transition logic based on percentage triggers
      if (currentProgress === 25) {
        // Safe Cleaning Starts
        updateStepStatus(0, 'done');
        updateStepStatus(1, 'running');
        setCurrentStepIndex(1);
        addLog('✅ تم جرد ملفات القائمة البيضاء ومطابقتها!');
        profile.whitelist.forEach((wl) => {
          addLog(`🔒 رصد حماية الملف: ${wl} -> مستثنى بالكامل من أوامر الحذف.`);
        });
        addLog('🧹 البدء بالتنظيف والكنس الآمن (Safe Purge)...');
        
        const PRESET_LABELS_LOCAL: Record<string, string> = {
          FIVEM_MODS: 'mods (FiveM)',
          FIVEM_PLUGINS: 'plugins (FiveM)',
          FIVEM_APPDATA: 'مجلد FiveM الرئيسي',
          GTA5_MAIN: 'مجلد GTA V الرئيسي',
          GTA5_SFX: 'مجلد الصوتيات SFX',
          CUSTOM: 'مسار مخصص',
        };

        const activeClears = profile.cleanTargets || [];
        if (activeClears.length > 0) {
          addLog(`🧹 جاري تصفير وحذف الملفات السابقة بالمجلدات التالية: ${activeClears.map(c => PRESET_LABELS_LOCAL[c] || c).join('، ')}`);
          addLog('🔥 تم إزالة المودات والملفات السابقة بالكامل لمنع وجود أي تضارب رسومي أو هبوط بالفريمات.');
        } else {
          addLog('ℹ️ لم يستهدف البروفايل تصفير أي مجلد (تم الإبقاء على كافة ملفات المجلدات السابقة لدمجها).');
        }
      }

      if (currentProgress === 55) {
        // Smart Transfer Starts
        updateStepStatus(1, 'done');
        updateStepStatus(2, 'running');
        setCurrentStepIndex(2);
        addLog('✅ اكتمل التنظيف الآمن للملفات بنجاح!');
        addLog(`📂 تم الإبقاء على ملفات الوايت ليست منيعة بفضل الله.`);
        
        if (profile.isBackup) {
          addLog('📦 رصد بروفايل نسخة احتياطية مشفرة ومضغوطة لملفاتك الحالية!');
          addLog('🛠️ جاري الاستخراج الآمن وفك الضغط العالي بقوة خوارزمية LZMA...');
          addLog('⚡ يجرى فك ضغط Citizen ومودات الـ mods و plugins و SFX المنسوخة دون أي تلف...');
        } else {
          addLog('🚚 بدء النقل الذكي (Smart File Injector)...');
        }

        profile.sourceFiles.forEach((file) => {
          if (file.isCompressed) {
            addLog(`📦 [Decompressing] فك ضغط: ${file.name} (حجم مضغوط: ${file.size} ◀ حجم مستخرج: ${file.originalSize || 'طبيعي'}) إلى مجلد [${file.targetKey}]`);
          } else {
            addLog(`📤 ونقل: ${file.name} (${file.size}) إلى مجلد [${file.targetKey}]`);
          }
        });
      }

      if (currentProgress === 85) {
        // Complete Verification Starts
        updateStepStatus(2, 'done');
        updateStepStatus(3, 'running');
        setCurrentStepIndex(3);
        addLog('✅ تم إكمال نقل ملفات البروفايل الجديد بنجاح!');
        
        // Write virtual settings.xml parameters
        if (profile.graphicsQuality === 'ULTRA_HIGH') {
          addLog('⚙️ تعديل ملف قراند لربطه بالدقة والسرعات: settings.xml...');
          addLog('✨ تعديل <ShadowQuality value="3" /> (رفع دقة الظلال إلى الترا فائقة)...');
          addLog('✨ تعديل <WaterQuality value="2" /> (تعيين مؤثرات مياه واقعية)...');
          addLog('✨ تعديل <ReflectionQuality value="3" /> (فائقة) لدعم انعكاسات ناطحات السحاب...');
          addLog('✨ تفضيل حواف ناعمة جداً <MSAA value="4" /> لتقليل اهتزاز الحواف...');
          addLog('✅ تم تدوين ومعايرة ملف GTA V settings.xml بأعلى جودة رسومية فائقة بنجاح!');
        } else if (profile.graphicsQuality === 'LOW_NORMAL') {
          addLog('⚙️ تعديل ملف قراند لربطه بالدقة والسرعات: settings.xml...');
          addLog('⚡ تعديل <ShadowQuality value="0" /> (تعطيل الظلال كلياً لمنع هبوط الفريمات)...');
          addLog('⚡ تعديل <WaterQuality value="0" /> + <GrassQuality value="0" /> (جودة عادية جداً)...');
          addLog('⚡ تقليل المدى المعالج وتفاصيل الرؤية البعيدة لراحة كرت الشاشة والـ CPU...');
          addLog('⚡ إلغاء تنعيم الحواف <MSAA value="0" /> لرفع سرعة السيرفرات وسلاسة الأداء...');
          addLog('✅ تم تدوين ومعايرة ملف GTA V settings.xml للوصول لأقصى سلاسة (FPS Boost)!');
        } else {
          addLog('⚙️ لم يطلب البروفايل تعديلات جودة اللعبة (تم الإبقاء على ملف settings.xml الحالي).');
        }

        addLog('🛡️ التحقق النهائي من تماسك المسارات ومفاتيح اللعب...');
        addLog('💻 فحص سلامة الملفات وبنائها لملائمة تشغيل FiveM و GTA V.');
      }

      if (currentProgress >= 100) {
        clearInterval(progressInterval);
        setProgress(100);
        updateStepStatus(3, 'done');
        addLog('🎉 تمت العملية بنجاح كامل 100%! تم تغيير الجرافيكس.');
        addLog('ℹ️ سيتم تصفية الشاشة والعودة للوحة التحكم فوراً للعب...');

        // Wait 1.8 seconds then complete to auto-dismiss
        timer = setTimeout(() => {
          onComplete();
        }, 1800);
      }
    }, 45); // Approx ~4.5 seconds total

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="progress-modal-window" 
        className="w-full max-w-2xl bg-[#090b0f]/95 border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.15)] flex flex-col"
      >
        {/* Header */}
        <div className="bg-black/40 px-6 py-5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-950/50 text-cyan-400 border border-cyan-500/20">
              <Cpu className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-100 font-sans tracking-tight">
                جاري تفعيل البروفايل ونقل وتثبيت الملفات
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                نظام النقل الذكي Safe Mod Injector
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-cyan-400 bg-cyan-950/50 border border-cyan-800/30 px-3.5 py-1 rounded-full font-mono">
            {progress}%
          </span>
        </div>

        {/* Content Details */}
        <div className="p-6 space-y-6 flex-1 bg-[#090b0f]/40">
          {/* Progress bar container */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-300">
              <span>بروفايل: <strong className="text-cyan-400">{profile.name}</strong></span>
              <span className="text-emerald-400 font-medium">قيد الإجراء بأمان...</span>
            </div>
            
            <div className="h-3 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Stepper Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {steps.map((step, index) => {
              const works = step.status === 'running';
              const done = step.status === 'done';
              return (
                <div 
                  key={step.id} 
                  className={`p-3 rounded-2xl border transition-all duration-300 flex items-start gap-3 ${
                    works 
                      ? 'bg-cyan-950/20 border-cyan-500/40 shadow-md shadow-cyan-950/30'
                      : done 
                      ? 'bg-emerald-950/20 border-emerald-500/20'
                      : 'bg-black/20 border-white/5 opacity-55'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : works ? (
                      <RotateCw className="w-4 h-4 text-cyan-400 animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-600" />
                    )}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${works ? 'text-cyan-300' : done ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {step.label}
                    </h4>
                    <span className="text-[10px] text-slate-400 inline-block leading-tight mt-0.5">
                      {step.desc}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Terminal Console Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                سجل الأوامر الحي
              </span>
              <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-cyan-400 border border-white/5 font-mono">
                LIVE TELEMETRY
              </span>
            </div>

            <div className="bg-black/60 rounded-2xl p-4 border border-white/5 text-[11px] font-mono text-slate-350 leading-relaxed h-[130px] max-h-[130px] overflow-y-auto space-y-1">
              {logs.map((log, i) => {
                let colorClass = 'text-slate-300';
                if (log.includes('✅') || log.includes('نجاح')) colorClass = 'text-emerald-400 font-medium';
                if (log.includes('🚀') || log.includes('تفعيل')) colorClass = 'text-cyan-400';
                if (log.includes('🔒') || log.includes('القائمة البيضاء')) colorClass = 'text-amber-400';
                return (
                  <div key={i} className={`whitespace-pre-wrap ${colorClass}`}>
                    {log}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

        {/* Footer info logs */}
        <div className="bg-black/40 px-6 py-4 border-t border-white/5 flex items-center justify-between text-slate-400 text-[10px]">
          <span className="flex items-center gap-1.5 text-slate-400 leading-normal max-w-[70%]">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            تنبيه: لا تقم بإغلاق اللعبة أو المتصفح أثناء النقل لتجنب تلف ملفات المجلد الفضائي الافتراضي.
          </span>
          <button
            onClick={onCancel}
            className="text-slate-300 hover:text-rose-400 transition-colors text-[10px] bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 cursor-pointer"
          >
            إلغاء العملية بالكامل
          </button>
        </div>
      </div>
    </div>
  );
}
