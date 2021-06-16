// Todas as APIs do Node.js estão disponíveis no processo de preload.
// Tem a mesma sandbox como uma extencao do Chrome.
const { contextBridge, ipcRenderer } = require('electron')
const path = require('path')
var log = require('electron-log');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })

contextBridge.exposeInMainWorld('electron', {
  startDrag: (fileName) => {
    ipcRenderer.send('ondragstart', path.join(process.cwd(), fileName))
  }
})