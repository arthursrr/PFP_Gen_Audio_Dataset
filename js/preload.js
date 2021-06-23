// Todas as APIs do Node.js estão disponíveis no processo de preload.
// Tem a mesma sandbox como uma extencao do Chrome.
const { contextBridge, ipcRenderer } = require('electron')
const fs = require('fs')

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const dependency of ['chrome', 'node', 'electron']) {
      replaceText(`${dependency}-version`, process.versions[dependency])
    }
  })

contextBridge.exposeInMainWorld(
    "api", {
        send: (channel, data) => {
                ipcRenderer.send(channel, data);

        },
        receive: (channel, func) => {
                ipcRenderer.on(channel, (event, ...args) => func(...args));
        }
    }
);

contextBridge.exposeInMainWorld(
  "fs", {
      isDir: (arg) => {
        return fs.lstatSync(arg).isDirectory();          
      }
  }
);