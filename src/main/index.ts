import { app, BrowserWindow, shell, ipcMain, nativeTheme, session } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
import { registerIpcHandlers } from './ipc/handlers'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '../..')
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

app.setName('Workspace')

let win: BrowserWindow | null = null
const preloadPath = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Workspace',
    width: 1200,
    height: 800,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })

  win.webContents.on('did-finish-load', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    win?.webContents.send('theme-updated', theme)
  })

  nativeTheme.on('updated', () => {
    const theme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light'
    win?.webContents.send('theme-updated', theme)
  })
}

app.whenReady().then(async () => {
  await createWindow()
  if (win) registerIpcHandlers(win)

  // Strict Content-Security-Policy for production (file://) to avoid unsafe-eval and reduce XSS risk.
  // Skipped when loading from Vite dev server so HMR keeps working.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const isMainFrame = details.resourceType === 'mainFrame'
    const isFileProtocol = details.url.startsWith('file://')
    if (isMainFrame && isFileProtocol) {
      const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; ')
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
        },
      })
    } else {
      callback({ responseHeaders: details.responseHeaders })
    }
  })
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})
