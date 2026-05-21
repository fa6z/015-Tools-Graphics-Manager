/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Play, 
  ChevronRight, 
  FolderOpen
} from 'lucide-react';
import { Profile, PresetPathKey } from '../types';

interface ProfileCardProps {
  profile: Profile;
  onApply: (profile: Profile) => void;
  onEdit: (profile: Profile) => void;
  onDelete: (id: string) => void;
}

export default function ProfileCard({
  profile,
  onApply,
  onEdit,
  onDelete,
}: ProfileCardProps) {
  
  const PRESET_LABELS: Record<PresetPathKey, string> = {
    FIVEM_MODS: 'mods',
    FIVEM_PLUGINS: 'plugins',
    FIVEM_APPDATA: 'رئيسي FiveM',
    GTA5_MAIN: 'رئيسي GTA V',
    GTA5_SFX: 'x64/sfx',
    CUSTOM: 'مسار مخصص',
  };

  // Extract all unique target destinations inside this profile
  const uniqueTargets = Array.from(new Set(profile.sourceFiles.map(f => f.targetKey)));

  return (
    <div 
      className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-xl hover:shadow-[0_0_20px_rgba(34,211,238,0.06)] transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.08] flex flex-col justify-between relative group"
      id={`profile-card-${profile.id}`}
    >
      {/* Visual Header Banner representing profile */}
      <div className={`bg-gradient-to-r ${profile.bgColor} px-5 py-4 relative overflow-hidden border-b border-white/5`}>
        {/* Ambient Overlay Design */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
        
        {/* Glowing Indicator Dot for Immersive feel */}
        <div className="absolute top-4 right-4">
          <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></div>
        </div>

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex flex-wrap gap-1 items-center pb-1">
              <span className="text-[9px] uppercase tracking-wider font-extrabold bg-black/40 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/10">
                {uniqueTargets.length > 1 ? 'توزيع ذكي لعدة مسارات' : `مسار: ${PRESET_LABELS[uniqueTargets[0]] || 'مخصص'}`}
              </span>
              {profile.isBackup && (
                <span className="text-[9.5px]/none font-extrabold bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded shadow-[0_0_8px_rgba(245,158,11,0.25)] flex items-center gap-1">
                  📦 نسخة احتياطية مطورة
                </span>
              )}
              {profile.graphicsQuality && profile.graphicsQuality !== 'DEFAULT' && (
                <span className={`text-[9.5px]/none font-extrabold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${
                  profile.graphicsQuality === 'ULTRA_HIGH' 
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.1)]' 
                    : 'bg-amber-950/80 text-amber-300 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]'
                }`}>
                  {profile.graphicsQuality === 'ULTRA_HIGH' ? 'جرافيكس: Ultra ✨' : 'جرافيكس: Low FPS ⚡'}
                </span>
              )}
            </div>
            <h3 className="text-sm font-black text-white mt-1 leading-tight">
              {profile.name}
            </h3>
          </div>

          <div className="flex gap-1 bg-black/30 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => onEdit(profile)}
              className="p-1.5 hover:bg-white/10 text-slate-200 transition-colors rounded cursor-pointer"
              title="تعديل المودات والمسارات لهذا البروفايل"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            </button>
            <button
              onClick={() => onDelete(profile.id)}
              className="p-1.5 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 transition-colors rounded cursor-pointer"
              title="حذف البروفايل"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-white/85 leading-relaxed mt-2 relative z-10 line-clamp-2">
          {profile.description}
        </p>
      </div>

      {/* Main Stats and configuration info */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4 bg-black/15">
        
        {/* Source files included with specific targets */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
            <span className="text-slate-300">ملفات النقل والتثبيت ({profile.sourceFiles.length}):</span>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/20 px-1.5 py-0.2 rounded">
              {profile.sourceFiles.length} ملفات
            </span>
          </div>
          
          <div className="bg-black/40 rounded-xl p-2 px-3 border border-white/5 max-h-[110px] overflow-y-auto space-y-1">
            {profile.sourceFiles.map((file, idx) => (
              <div 
                key={`${file.name}-${idx}`} 
                className="flex justify-between items-center text-[10px] text-slate-350 font-mono py-1 border-b border-white/5 last:border-b-0"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className="truncate block" dir="ltr" title={file.name}>
                    • {file.name}
                  </span>
                  {file.isCompressed && (
                    <span className="text-[7px] font-sans font-bold text-amber-300 bg-amber-950/50 border border-amber-500/20 px-1 py-0.2 rounded shrink-0" title={`المساحة المضغوطة: ${file.size}`}>
                      ZIP 📦
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-cyan-400/80 font-semibold bg-white/[0.03] px-1.5 py-0.2 rounded border border-white/5 shrink-0">
                  {PRESET_LABELS[file.targetKey]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Protection whitelist preview */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            الملفات المستهدفة بالحماية بالوايت ليست ({profile.whitelist.length}):
          </div>
          
          <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
            {profile.whitelist.length > 0 ? (
              profile.whitelist.map((wl, idx) => (
                <span 
                  key={`${wl}-${idx}`} 
                  className="bg-emerald-950/30 border border-emerald-500/10 text-emerald-300 text-[9px] font-mono px-2 py-0.5 rounded-full"
                  dir="ltr"
                >
                  {wl}
                </span>
              ))
            ) : (
              <span className="text-[9px] text-slate-500 italic block">
                لا توجد ملفات بيضاء مفعلة
              </span>
            )}
          </div>
        </div>

        {/* Selected paths list display */}
        <div className="border-t border-white/5 pt-3 space-y-1 text-xs">
          <div className="text-[9px] text-slate-500 font-bold uppercase">الوجهات المجهّزة للحقن في المجلدات:</div>
          <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
            {uniqueTargets.map((t) => (
              <span key={t} className="bg-white/5 border border-white/10 px-2 py-0.5 rounded font-mono">
                {PRESET_LABELS[t as PresetPathKey]}
              </span>
            ))}
          </div>
        </div>

        {/* Clean targets preview badge to show what gets wiped */}
        {profile.cleanTargets && profile.cleanTargets.length > 0 && (
          <div className="space-y-1 text-xs pt-1">
            <div className="text-[9px] text-rose-400 font-bold uppercase flex items-center gap-1">
              <span>🧹 تصفير المجلدات القديمة تلقائياً قبل التثبيت لـ:</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {profile.cleanTargets.map((t) => (
                <span key={t} className="bg-rose-950/40 border border-rose-900/40 text-rose-300 px-2 py-0.5 rounded font-mono text-[9px] font-bold">
                  {PRESET_LABELS[t] || t} 🧹
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Apply action button */}
        <div className="pt-2">
          <button
            onClick={() => onApply(profile)}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-lg shadow-cyan-500/10 transition-all duration-300 select-none flex items-center justify-center gap-1.5 cursor-pointer transform hover:translate-y-[-1px]"
          >
            <Play className="w-3.5 h-3.5 fill-current text-black" />
            <span>نقل وتفعيل مودات البروفايل الحالية</span>
            <ChevronRight className="w-3 h-3 transform transition-transform group-hover:translate-x-1 animate-pulse" />
          </button>
        </div>
      </div>
    </div>
  );
}
