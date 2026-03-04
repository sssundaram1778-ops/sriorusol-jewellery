const { app, BrowserWindow, shell, Menu } = require('electron')
const path = require('path')

// Disable hardware acceleration for better compatibility
app.disableHardwareAcceleration()

// Production URL - your Vercel deployment
const PRODUCTION_URL = 'https://sriorusol-jeweller.vercel.app'

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 400,
    minHeight: 600,
    icon: path.join(__dirname, '../dist/icons/icon-512x512.svg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    titleBarStyle: 'default',
    show: false,
    autoHideMenuBar: true
  })

  // Remove menu bar for cleaner look
  Menu.setApplicationMenu(null)

  // Load the production website URL for real-time database access
  mainWindow.loadURL(PRODUCTION_URL)

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow navigation within the app domain
    if (url.startsWith(PRODUCTION_URL)) {
      return { action: 'allow' }
    }
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  app.whenReady().then(createWindow)

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
}
