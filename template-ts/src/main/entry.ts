import { app, BrowserWindow } from "electron";
import createProtocol from "./protocol";
const isDevelopment = process.env.CVE_ENV === 'development'

app.on('ready', () => {
  let win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.on('ready-to-show', () => { win.show() })
  if (isDevelopment) {
    win.loadURL(`http://localhost:${process.env.CVE_PORT}`)
  } else {
    createProtocol('app')
    win.loadURL('app://./index.html')
  }
  win.webContents.openDevTools()
})
