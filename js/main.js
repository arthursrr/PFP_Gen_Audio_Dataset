// Modulos para controlar a vida util da aplicacao e criar uma janela de navegador nativo
const { app, BrowserWindow, ipcMain} = require('electron')

var path_dir = null
var list_files = null

function createWindow () {
  // Cria a janela de navegador.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
      //preload: path.join(__dirname, 'preload.js')
    }  
  })
  // carregar o index.html do aplicativo.
  mainWindow.loadFile('./html/home.html')
  mainWindow.webContents.openDevTools()
}

// Este método sera chamado quando o Electron tiver terminado
// inicializacao e esta pronto para criar janelas de navegador.
// Algumas APIs podem ser usadas somente depois que este evento ocorre.
app.whenReady().then(() => {
  createWindow()
  app.on('activate', function () {
    // Em macOS é comum recriar uma janela no aplicativo quando o ícone da doca é clicado e não há outras janelas abertas.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Saia quando todas as janelas estiverem fechadas, exceto em macOS. 
// E comum que as aplicacoes e sua barra de menu permaneçam ativas ate que o usuario saia explicitamente com Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.on("toMain", (event, args) => {
  path_dir = args[0]
  list_files = args[1]
});

ipcMain.on("fromMain", (event, args) => {
  event.returnValue = [path_dir, list_files]
});
