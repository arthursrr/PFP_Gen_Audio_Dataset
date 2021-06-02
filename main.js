// Modulos para controlar a vida util da aplicacao e criar uma janela de navegador nativo
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow () {
  // Cria a janela de navegador.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // carregar o index.html do aplicativo.
  mainWindow.loadFile('index.html')
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

// Neste arquivo voce pode incluir o resto do codigo principal especifico do seu aplicativo.
// Voce também pode colocar eles em arquivos separados e requeridos-as aqui.