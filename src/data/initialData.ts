/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PresetOption, Profile, VirtualPC } from '../types';

export const PRESETS: PresetOption[] = [
  {
    key: 'FIVEM_MODS',
    label: 'مجلد mods الخاص بـ FiveM',
    defaultPath: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app\\mods',
    icon: 'FolderTree',
  },
  {
    key: 'FIVEM_PLUGINS',
    label: 'مجلد plugins الخاص بـ FiveM',
    defaultPath: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app\\plugins',
    icon: 'Cpu',
  },
  {
    key: 'FIVEM_APPDATA',
    label: 'مجلد FiveM Application Data الرئيسي',
    defaultPath: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app',
    icon: 'FolderGit',
  },
  {
    key: 'GTA5_MAIN',
    label: 'مجلد GTA V الرئيسي',
    defaultPath: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
    icon: 'Gamepad2',
  },
  {
    key: 'GTA5_SFX',
    label: 'مجلد SFX الصوتي لـ GTA V (داخل x64)',
    defaultPath: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V\\x64\\audio\\sfx',
    icon: 'Music',
  },
  {
    key: 'CUSTOM',
    label: 'تحديد مسار مخصص بالكامل... (Custom Path)',
    defaultPath: 'C:\\MyCustomGraphicFolder',
    icon: 'Settings',
  },
];

// Two high-quality factory built-in presets representing Ultra-realism and FPS performance boosting!
export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'profile-ultra-cinematic',
    name: 'بروفايل مظهر واقعي (Ultra Realism) 🎬',
    description: 'تحسين شامل للطقس والسحاب والانعكاسات السينمائية يدعمه ملف تهيئة settings.xml جودة فائقة (Ultra) للحصول على تجربة لعب فخمة.',
    bgColor: 'from-cyan-600 to-blue-800',
    graphicsQuality: 'ULTRA_HIGH',
    cleanTargets: ['FIVEM_MODS', 'FIVEM_PLUGINS'],
    whitelist: ['dxgi.dll', 'ReShade.ini', 'enbseries'],
    sourceFiles: [
      { name: 'NVE_Sky_Mod.asi', size: '1.2 MB', type: 'file', targetKey: 'FIVEM_PLUGINS' },
      { name: 'Cinematic_Clouds.rpf', size: '210 MB', type: 'file', targetKey: 'FIVEM_MODS' },
      { name: 'VisualV_Lights.rpf', size: '85 MB', type: 'file', targetKey: 'FIVEM_MODS' },
    ]
  },
  {
    id: 'profile-fps-booser',
    name: 'بروفايل أداء فريمات قصوى (FPS Boost) ⚡',
    description: 'التركيز على سلاسة اللعب والتخلص من التعليق (اللاق)، حيث يقفل الظلال ويقلل مستوى الرؤية اللاسلكية عبر settings.xml المناسب للأجهزة المتوسطة والضعيفة.',
    bgColor: 'from-amber-600 to-orange-850',
    graphicsQuality: 'LOW_NORMAL',
    cleanTargets: ['FIVEM_MODS', 'FIVEM_PLUGINS'],
    whitelist: ['dxgi.dll', 'ReShade.ini'],
    sourceFiles: [
      { name: 'Low_Details_Grass.rpf', size: '4.5 MB', type: 'file', targetKey: 'FIVEM_MODS' },
      { name: 'Remove_Shadows_Filter.asi', size: '150 KB', type: 'file', targetKey: 'FIVEM_PLUGINS' },
    ]
  }
];

// Seed virtual state folders matching standard structure
export const INITIAL_PC_STATE: VirtualPC = {
  folders: {
    'FIVEM_MODS': {
      path: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app\\mods',
      files: [
        { name: 'old_resident_graphics.rpf', size: '650 MB', type: 'file' },
        { name: 'shadow_recolor.rpf', size: '15 MB', type: 'file' },
      ],
    },
    'FIVEM_PLUGINS': {
      path: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app\\plugins',
      files: [
        { name: 'old_speedometer.asi', size: '400 KB', type: 'file' },
        { name: 'shitty_handling.asi', size: '550 KB', type: 'file' },
      ],
    },
    'FIVEM_APPDATA': {
      path: 'C:\\Users\\Gaming-PC\\AppData\\Local\\FiveM\\FiveM.app',
      files: [
        { name: 'FiveM.exe', size: '15.4 MB', type: 'file' },
        { name: 'CitizenFX.ini', size: '3 KB', type: 'file' },
        { name: 'caches', size: '400 MB', type: 'folder' },
      ],
    },
    'GTA5_MAIN': {
      path: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V',
      files: [
        { name: 'gta5.exe', size: '82.5 MB', type: 'file' },
        { name: 'dxgi.ini', size: '15 KB', type: 'file' },
        { name: 'old_reshade_file.dll', size: '3.4 MB', type: 'file' },
      ],
    },
    'GTA5_SFX': {
      path: 'C:\\Program Files\\Rockstar Games\\Grand Theft Auto V\\x64\\audio\\sfx',
      files: [
        { name: 'resident.rpf', size: '840 MB', type: 'file' },
        { name: 'weapons.rpf', size: '450 MB', type: 'file' },
      ],
    },
    'CUSTOM': {
      path: 'C:\\MyCustomGraphicFolder',
      files: [
        { name: 'backup_hud_texture.zip', size: '12 MB', type: 'file' },
      ],
    },
  },
};
