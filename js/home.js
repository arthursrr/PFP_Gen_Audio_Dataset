const{ ipcRenderer } = require('electron')
const fs = require('fs')
const glob = require('glob').Glob

let $ = jQuery = require('jquery')

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();
  
    for (const f of event.dataTransfer.files) {
        // Using the path attribute to get absolute file path
        if (fs.lstatSync(f.path).isDirectory()) //confirma se o endereço passado é um diretorio 
        {
            glob(f.path + '/**/*.wav', {}, (err, files)=>{
                if (files.length > 0) {
                    ipcRenderer.send('toMain', [f.path, files]);
                    window.location.replace("../html/infopage.html")
                } else {
                    $("#notWAV").modal('show');
                }
            })

                
        }else{
            $("#notDir").modal('show');
        }
      }
});
  
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