const{ ipcRenderer } = require('electron')
const mm = require('music-metadata');
var fs = require('fs');
var $ = jQuery = require('jquery');


var args = ipcRenderer.sendSync('fromMain', "");
var path_dir = args[0];

var list_files = args[1];
delete args

function unitAjustSize(fileSizeInBytes){
    if (fileSizeInBytes < 1048576) return (fileSizeInBytes / 1024).toFixed(0) + " Kb";
    else if (fileSizeInBytes < 1073741824) return (fileSizeInBytes / 1048576).toFixed(0) + " Mb";
    else return (fileSizeInBytes / 1073741824).toFixed(0) + " GB";
}

function unitAjustTemp(tempTotal){
    var hours = Math.floor(tempTotal / (60 * 60));

    var divisor_for_minutes = tempTotal % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    return hours +":"+ minutes +":"+seconds
}

async function getMetadata(list_files){

    var count = 0;
    var perc = 0;
    var tempTotal = 0;
    var fileSizeInBytes = 0
    var samplerate = 0
    for (const element of list_files) {
        var stats = fs.statSync(element)
        fileSizeInBytes += stats["size"]
        
        let metadata = await mm.parseFile(element);
        samplerate += metadata.format.sampleRate 
        tempTotal += metadata.format.duration

        count += 1;

        perc = parseInt(count/list_files.length*100)
        $('.progress-bar').css('width', perc+'%').attr('aria-valuenow', perc); 
    }
    return [tempTotal, fileSizeInBytes, samplerate]
}


async function chanegValues(){
    var total_args = await getMetadata(list_files);
    var formato = "WAV";
    var quantidade = list_files.length.toString();
    var tempTotal = unitAjustTemp(total_args[0]).toString();
    var tamTotal = unitAjustSize(total_args[1]).toString();
    var tempMedio = unitAjustTemp(total_args[0]/list_files.length).toString()
    
    $("#Progress").modal("toggle")

    $("#formato").text(formato);
    $("#quantidade").text(quantidade);
    $("#tamTotal").text(tamTotal);
    $("#tempMedio").text(tempMedio);
    $("#tempTotal").text(tempTotal);

}


window.onload = function () {
    $("#Progress").modal('show')
}

chanegValues()