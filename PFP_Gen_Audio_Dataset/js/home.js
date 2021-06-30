//Autor: Arthur Serra
/*  ========================== home.js ================================
 *  Este script produz todos os eventos de controle da pagina home.html
 *  ===================================================================
*/

const{ ipcRenderer } = require('electron') //Importa função de comunicação com o processo principal
const fs = require('fs')                   //Importa sistema de arquivos do javaScript
const glob = require('glob').Glob          //Importa sistema de arquivos recursivo para iterar sobre um diretorio
let $ = jQuery = require('jquery')         //Importa comandos JQuery

//Controle de drag&drop
document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
  
    for (const f of event.dataTransfer.files) {
        //confirma se o endereço passado é um diretorio
        if (fs.lstatSync(f.path).isDirectory())  
        {
            //itera sobre todos os arquivos .wav do diretorio obtido
            glob(f.path + '/**/*.wav', {}, (err, files)=>{ 
                //Confirma se há arquivos desse formato
                if (files.length > 0) {
                    //Envia a lista dos arquivos .wav para o processo principal
                    ipcRenderer.send('toMain', [f.path, files]);
                    //Vai para a pagina de informações do diretorio
                    window.location.replace("../html/infopage.html")
                } else {
                    //Abre um modal informando que nao há arquivos .wav no diretorio
                    $("#notWAV").modal('show');
                }
            })
        }else{
            //Abre um modal informando ao usuario que o caminho informado nao corresponde a um diretorio
            $("#notDir").modal('show');
        }
      }
});

//Monitora eventos de Drag&Drop
document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  
document.addEventListener('dragenter', (event) => {
    console.log('File is in the Drop Space');
});
  
document.addEventListener('dragleave', (event) => {
    console.log('File has left the Drop Space');
});