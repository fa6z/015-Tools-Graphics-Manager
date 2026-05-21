const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  selectFolder: (defaultPath) => ipcRenderer.invoke('dialog:selectFolder', defaultPath),
  selectFiles: (options) => ipcRenderer.invoke('dialog:selectFiles', options),
  readDir: (p) => ipcRenderer.invoke('fs:readDir', p),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),
  deleteFile: (p) => ipcRenderer.invoke('fs:deleteFile', p),
  exists: (p) => ipcRenderer.invoke('fs:exists', p),
  mkdir: (p) => ipcRenderer.invoke('fs:mkdir', p),
  showItemInFolder: (p) => ipcRenderer.invoke('shell:showItemInFolder', p),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  writeSettingsXml: (p, quality) => ipcRenderer.invoke('fs:writeSettingsXml', p, quality),
  archiveBackup: (profileId, files) => ipcRenderer.invoke('fs:archiveBackup', profileId, files),
  deleteBackupFolder: (profileId) => ipcRenderer.invoke('fs:deleteBackupFolder', profileId),
  downloadUpdate: (url, tag) => ipcRenderer.invoke('fs:downloadUpdate', url, tag),
  onDownloadProgress: (callback) => {
    const fn = (event, val) => callback(val);
    ipcRenderer.on('download-progress', fn);
    return () => ipcRenderer.removeListener('download-progress', fn);
  }
});
