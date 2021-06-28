const{ ipcRenderer } = require('electron');
var $ = jQuery = require('jquery');
var path = require('path');
const glob = require('glob').Glob;
const {PythonShell} = require('python-shell');
const fs = require('fs');

var args = ipcRenderer.sendSync('fromMain', "");
var path_dir = args[0];
var list_files = args[1];
delete args


var frag_args = ipcRenderer.sendSync('argsfromMain', "");


var dest_files = frag_args[2]+'/Audios'


async function run()
{
    const { success, err = '', results } = await new Promise(
        (resolve, reject) =>
        {
            let options = {
                scriptPath: path.join(__dirname, '../py/'),
                args: frag_args
            };
            
            PythonShell.run('fragment_audio.py', options, function (err, results) {
                if (err)
                {
                    reject({ success: false, err });
                }
                
                console.log('PythonShell results:', results);

                resolve({ success: true, results });
              });
        }
    );

}

document.addEventListener('DOMContentLoaded', function() {

    run();

    var frag_audio = 0;
    var perc = 0;
    let aux_perc = perc;

    let att_perc = document.getElementById("perc");

    let delay = 1000; // 1 segundo

    let avancar = document.getElementById("avancar");

    var iID = setInterval(function(){
                                    if (frag_audio >= list_files.length) {
                                        avancar.disabled = false;
                                        clearInterval(iID);
                                    }else{
                                        if (fs.existsSync(dest_files)) {
                                            let files = fs.readdirSync(dest_files);
                                            frag_audio = files.length;
                                            perc = parseInt(frag_audio/list_files.length*100)
                                             
                                            if (aux_perc < perc){
                                                att_perc.innerHTML = perc+"%"
                                                $('.progress-bar').css('width', perc+'%').attr('aria-valuenow', perc);
                                                aux_perc = perc;
                                            }
                                        }
                                    }
                                    },delay);

    avancar.addEventListener('click', function(){
        window.location.replace("../html/playlistpage.html");
    });
    
});



