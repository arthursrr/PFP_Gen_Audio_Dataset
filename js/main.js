//Autor: Arthur Serra
/*  ========================== main.js ================================
 *  Modulos para controlar a vida util da aplicacao e criar uma janela 
 *  de navegador nativo (Chromium).
 *  Este script tambem funciona como intermediario de comunicação entre
 *  os processos.
 *  ===================================================================
*/

const { app, BrowserWindow, ipcMain, dialog} = require('electron'); /*Importa funções do framework electron.js*/

var path_dir = null;              /*[String] caminho do diretorio dos arquivos de referencia*/
var save_dir = null;              /*[String] caminho do diretorio de armazenamento dos aquivos produzidos*/
var list_files = null;            /*[Array]  caminhos de todos os arquivos do diretorio de referencia*/
var list_generated_files = null;  /*[Array]  caminhos de todos os arquivos do diretorio produzido pela aplicação*/
var frag_args = null;             /*[Array]  lista de variaveis do processo de produção Python*/

function createWindow () {
	// Cria a janela de navegador.
	const mainWindow = new BrowserWindow({
		width: 1280,    //largura inicial da janela
		height: 720,    //altura inicial da janela
		webPreferences: {
			nodeIntegration: true,      //permite a importação de bibliotecas do Node.js
			contextIsolation: false,    //permite que outros Scripts alem deste possa fazer importações
			enableRemoteModule: true    //Permite chamadas de dialogo remoto com o sistema operacional
		}  
	})
	// carregar o home.html do aplicativo.
	mainWindow.loadFile('./html/home.html')
	// mainWindow.webContents.openDevTools()    //Habilida o console de depuração durante a execução da aplicação
}

/* Este método sera chamado quando o Electron tiver terminado
 * inicializacao e esta pronto para criar janelas de navegador.
 * Algumas APIs podem ser usadas somente depois que este evento ocorre.
*/
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


/*EVENTOS DE COMUNICAÇÃO ENTRE OS PROCESSOS*/
//inicia varios envento de escuta para definir os valores das variaveis 
ipcMain.on("toMain", (event, args) => {
	path_dir = args[0]
	list_files = args[1]
});

ipcMain.on("destToMain", (event, args) => {
	list_generated_files = args;
});

ipcMain.on("argsToMain", (event, args) => {
	frag_args = args
});

ipcMain.on("argsfromMain", (event, args) => {
	event.returnValue = frag_args
});

ipcMain.on("fromMain", (event, args) => {
	event.returnValue = [path_dir, list_files]
});

ipcMain.on("destTofromMain", (event, args) => {
	event.returnValue = list_generated_files
});

/*Este evento é especial, pois faz uma chamada de dialogo com o 
* explorador de arquivos do sistema operacional nativo
*/
ipcMain.on('show-open-dialog', (event, arg)=> {
	save_dir = dialog.showOpenDialogSync({
		properties: ['openDirectory'] //Apenas diretorios podem ser enxergados pela janela de dialogo
	});
	event.returnValue = save_dir
})