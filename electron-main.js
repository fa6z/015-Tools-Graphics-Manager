import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    title: "مساعد التعديلات والنسخ الاحتياطي",
    webPreferences: {
      preload: path.join(__dirname, 'electron-preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    autoHideMenuBar: true, // Hides the top menu bar for a cleaner gaming look
  });

  // Load the built index.html from dist directory
  win.loadFile(path.join(__dirname, 'dist/index.html'));
  
  // Security protection: Anti-debug & DevTools blocking to prevent code inspection
  win.webContents.on('devtools-opened', () => {
    win.webContents.closeDevTools();
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Helper for formatting sizes
function formatSize(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} Bytes`;
}

// IPC Handlers
ipcMain.handle('dialog:selectFolder', async (event, defaultPath) => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: defaultPath || undefined
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

ipcMain.handle('dialog:selectFiles', async (event, options) => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile', 'multiSelections'],
    defaultPath: options?.defaultPath || undefined,
    filters: [
      { name: 'Mod Files', extensions: ['dll', 'asi', 'rpf', 'lua', 'ini', 'xml', 'zip', 'rar'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (result.canceled) {
    return [];
  } else {
    const filesInfo = [];
    for (const filePath of result.filePaths) {
      try {
        const stats = fs.statSync(filePath);
        filesInfo.push({
          name: path.basename(filePath),
          size: formatSize(stats.size),
          type: 'file',
          realPath: filePath
        });
      } catch (err) {
        console.error(err);
      }
    }
    return filesInfo;
  }
});

ipcMain.handle('fs:exists', async (event, p) => {
  return fs.existsSync(p);
});

ipcMain.handle('fs:mkdir', async (event, p) => {
  try {
    fs.mkdirSync(p, { recursive: true });
    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
});

ipcMain.handle('fs:readDir', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    const files = fs.readdirSync(folderPath, { withFileTypes: true });
    const result = [];
    for (const file of files) {
      const fullPath = path.join(folderPath, file.name);
      try {
        const stats = fs.statSync(fullPath);
        result.push({
          name: file.name,
          size: file.isDirectory() ? 'مجلد' : formatSize(stats.size),
          type: file.isDirectory() ? 'folder' : 'file',
          realPath: fullPath,
        });
      } catch (e) {
        result.push({
          name: file.name,
          size: '0 Bytes',
          type: file.isDirectory() ? 'folder' : 'file',
          realPath: fullPath,
        });
      }
    }
    return result;
  } catch (err) {
    console.error(err);
    return [];
  }
});

ipcMain.handle('fs:copyFile', async (event, src, dest) => {
  try {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      await fs.promises.mkdir(destDir, { recursive: true });
    }
    
    // Safely remove destination beforehand to prevent merge conflicts or corrupted overwrites
    if (fs.existsSync(dest)) {
      const destStats = await fs.promises.stat(dest);
      if (destStats.isDirectory()) {
        await fs.promises.rm(dest, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(dest);
      }
    }
    
    // Check if source is a file or a folder
    const srcStats = await fs.promises.stat(src);
    if (srcStats.isDirectory()) {
      // Helper to copy directory recursively asynchronously
      await copyDirectoryRecursiveAsync(src, dest);
    } else {
      await fs.promises.copyFile(src, dest);
    }
    return true;
  } catch (err) {
    console.error(`Error copying from ${src} to ${dest}:`, err);
    throw err;
  }
});

async function copyDirectoryRecursiveAsync(src, dest) {
  await fs.promises.mkdir(dest, { recursive: true });
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDirectoryRecursiveAsync(srcPath, destPath);
    } else {
      await fs.promises.copyFile(srcPath, destPath);
    }
  }
}

ipcMain.handle('fs:deleteFile', async (event, p) => {
  try {
    if (fs.existsSync(p)) {
      const stats = await fs.promises.stat(p);
      if (stats.isDirectory()) {
        await fs.promises.rm(p, { recursive: true, force: true });
      } else {
        await fs.promises.unlink(p);
      }
    }
    return true;
  } catch (err) {
    console.error(err);
    throw err;
  }
});

ipcMain.handle('shell:showItemInFolder', async (event, p) => {
  if (fs.existsSync(p)) {
    shell.showItemInFolder(p);
    return true;
  }
  return false;
});

ipcMain.handle('shell:openPath', async (event, p) => {
  if (fs.existsSync(p)) {
    await shell.openPath(p);
    return true;
  }
  return false;
});

ipcMain.handle('fs:archiveBackup', async (event, profileId, files) => {
  try {
    let docPath = '';
    try {
      docPath = app.getPath('documents');
    } catch (e) {
      const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\pcd';
      docPath = path.join(homeDir, 'Documents');
    }
    const backupBaseDir = path.join(docPath, 'Rockstar Games', 'GTA V', 'Backups', profileId);
    if (!fs.existsSync(backupBaseDir)) {
      await fs.promises.mkdir(backupBaseDir, { recursive: true });
    }

    const archivedFiles = [];
    for (const file of files) {
      if (!file.realPath) continue;
      
      const destName = `${file.targetKey}_${file.name}`;
      const destPath = path.join(backupBaseDir, destName);
      
      if (fs.existsSync(file.realPath)) {
        const stats = await fs.promises.stat(file.realPath);
        if (stats.isDirectory()) {
          await copyDirectoryRecursiveAsync(file.realPath, destPath);
        } else {
          await fs.promises.copyFile(file.realPath, destPath);
        }
        archivedFiles.push({
          ...file,
          realPath: destPath,
        });
      }
    }
    return archivedFiles;
  } catch (err) {
    console.error('Error in fs:archiveBackup:', err);
    throw err;
  }
});

ipcMain.handle('fs:deleteBackupFolder', async (event, profileId) => {
  try {
    let docPath = '';
    try {
      docPath = app.getPath('documents');
    } catch (e) {
      const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\pcd';
      docPath = path.join(homeDir, 'Documents');
    }
    const backupBaseDir = path.join(docPath, 'Rockstar Games', 'GTA V', 'Backups', profileId);
    if (fs.existsSync(backupBaseDir)) {
      await fs.promises.rm(backupBaseDir, { recursive: true, force: true });
    }
    return true;
  } catch (err) {
    console.error('Error in fs:deleteBackupFolder:', err);
    return false;
  }
});

ipcMain.handle('fs:writeSettingsXml', async (event, targetPath, quality) => {
  try {
    let finalPath = targetPath;
    if (!finalPath) {
      try {
        const docPath = app.getPath('documents');
        finalPath = path.join(docPath, 'Rockstar Games', 'GTA V', 'settings.xml');
      } catch (pathErr) {
        // Fallback standard path in Windows
        const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\pcd';
        finalPath = path.join(homeDir, 'Documents', 'Rockstar Games', 'GTA V', 'settings.xml');
      }
    }
    const destDir = path.dirname(finalPath);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }

    let xml = '';
    if (quality === 'ULTRA_HIGH') {
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Settings>
  <video>
    <Width value="1920"/>
    <Height value="1080"/>
    <RefreshRate value="60"/>
    <ShadowQuality value="3"/>
    <ReflectionQuality value="3"/>
    <WaterQuality value="3"/>
    <TextureQuality value="2"/>
    <ShaderQuality value="3"/>
    <ParticlesQuality value="3"/>
    <GrassQuality value="3"/>
    <Tessellation value="3"/>
    <Shadow_Softshadows value="4"/>
    <AnisotropicFiltering value="16"/>
    <MSAA value="4"/>
    <TXAA value="1"/>
  </video>
</Settings>`;
    } else if (quality === 'LOW_NORMAL') {
      xml = `<?xml version="1.0" encoding="UTF-8"?>
<Settings>
  <video>
    <Width value="1280"/>
    <Height value="720"/>
    <RefreshRate value="120"/>
    <ShadowQuality value="0"/>
    <ReflectionQuality value="0"/>
    <WaterQuality value="0"/>
    <TextureQuality value="0"/>
    <ShaderQuality value="0"/>
    <ParticlesQuality value="0"/>
    <GrassQuality value="0"/>
    <Tessellation value="0"/>
    <Shadow_Softshadows value="0"/>
    <AnisotropicFiltering value="0"/>
    <MSAA value="0"/>
    <TXAA value="0"/>
  </video>
</Settings>`;
    } else {
      return false;
    }

    fs.writeFileSync(finalPath, xml, 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing settings.xml:', err);
    throw err;
  }
});

ipcMain.handle('fs:downloadUpdate', async (event, url, tag) => {
  try {
    let downloadsPath = '';
    try {
      downloadsPath = app.getPath('downloads');
    } catch (e) {
      const homeDir = process.env.USERPROFILE || process.env.HOME || 'C:\\Users\\pcd';
      downloadsPath = path.join(homeDir, 'Downloads');
    }
    
    if (!fs.existsSync(downloadsPath)) {
      await fs.promises.mkdir(downloadsPath, { recursive: true });
    }

    const destName = `015_Tools_Graphics_Manager_${tag}_Update.zip`;
    const destPath = path.join(downloadsPath, destName);

    await downloadFileWithRedirect(url, destPath, (progress) => {
      const wins = BrowserWindow.getAllWindows();
      if (wins.length > 0) {
        wins[0].webContents.send('download-progress', progress);
      }
    });

    try {
      shell.showItemInFolder(destPath);
    } catch (e) {
      console.error('shell:showItemInFolder error:', e);
    }
    return { success: true, path: destPath };
  } catch (err) {
    console.error('Error in fs:downloadUpdate:', err);
    throw err;
  }
});

function downloadFileWithRedirect(fileUrl, fileDest, onProgress) {
  return new Promise((resolve, reject) => {
    const triggerDownload = (currentUrl) => {
      const protocol = currentUrl.startsWith('https') ? https : http;
      const options = {
        headers: {
          'User-Agent': '015-Tools-Graphics-Manager-Updater'
        }
      };
      
      const req = protocol.get(currentUrl, options, (res) => {
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          if (res.headers.location) {
            triggerDownload(res.headers.location);
            return;
          }
        }

        if (res.statusCode !== 200) {
          reject(new Error(`Server returned status code: ${res.statusCode}`));
          return;
        }

        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const fileStream = fs.createWriteStream(fileDest);

        res.on('data', (chunk) => {
          downloaded += chunk.length;
          fileStream.write(chunk);
          if (totalSize > 0) {
            const progress = Math.round((downloaded / totalSize) * 100);
            onProgress(progress);
          } else {
            const fakeProgress = Math.min(98, Math.round((downloaded / (8 * 1024 * 1024)) * 100));
            onProgress(fakeProgress);
          }
        });

        res.on('end', () => {
          fileStream.end();
          onProgress(100);
          resolve(fileDest);
        });

        res.on('error', (err) => {
          fileStream.destroy();
          reject(err);
        });
      });

      req.on('error', (err) => {
        reject(err);
      });
    };

    triggerDownload(fileUrl);
  });
}

