const{ ipcRenderer } = require('electron')
const mm = require('music-metadata');
var fs = require('fs');
var $ = jQuery = require('jquery');
var WaveSurfer = require('wavesurfer.js');
var path = require('path');


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

async function getDurationTrack(track, id){
    let metadata = await mm.parseFile(track);
    let secs = metadata.format.duration;

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    $(id).text(minutes+":"+seconds)
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
    $("#Progress").modal("toggle")
    return [tempTotal, fileSizeInBytes, samplerate]
}

async function chanegValues(){
    let total_args = await getMetadata(list_files);
    let formato = "WAV";
    let quantidade = list_files.length.toString();
    let tempTotal = unitAjustTemp(total_args[0]).toString();
    let tamTotal = unitAjustSize(total_args[1]).toString();
    let tempMedio = unitAjustTemp(total_args[0]/list_files.length).toString()
    
    $("#formato").text(formato);
    $("#quantidade").text(quantidade);
    $("#tamTotal").text(tamTotal);
    $("#tempMedio").text(tempMedio);
    $("#tempTotal").text(tempTotal);

}

function player(links){
    let currentTrack = 0;
    // Load a track by index and highlight the corresponding link
    let setCurrentSong = function(index) {
        links[currentTrack].classList.remove('active');
        links[currentTrack].childNodes[1].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';
        currentTrack = index;
        links[currentTrack].classList.add('active');
        links[currentTrack].childNodes[1].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
        wavesurfer.load(links[currentTrack].attributes.href.nodeValue);
    };

    // Load the track on click
    Array.prototype.forEach.call(links, function(link, index) {
        link.addEventListener('click', function(e) {
            
            e.preventDefault();
            if (links[index].classList.contains('active')) {
                if (links[index].classList.contains('pause')) {
                    wavesurfer.play();
                    links[index].childNodes[1].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
                    links[index].classList.remove('pause');
                } else {
                    wavesurfer.pause();
                    links[index].childNodes[1].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';
                    links[index].classList.add('pause');
                }
                            
            } else {
                setCurrentSong(index);
            }

            
        });
    });
}


var wavesurfer

window.onload = function () {
    $("#Progress").modal('show');
    chanegValues();
}

document.getElementById("btnVoltar").addEventListener("click", function(){ 
    window.location.replace("../html/home.html"); 
});


document.addEventListener('DOMContentLoaded', function() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4ACA4E',
        progressColor: '#072708',
        height: 120
    });
});

document.addEventListener('DOMContentLoaded', function() {
    let naudio = 10;
    
    let beg_pos = 0;
    let end_pos;

    let playlist = document.getElementById('playlist');
    let npage = document.getElementsByClassName('npage');

    let currentPage = 1;
    let lastPage = Math.ceil(list_files.length/10)

    npage[0].innerHTML = currentPage+"/"+lastPage;
    
    if (list_files.length > naudio) {
        end_pos = naudio;
        for (let index = 0; index < naudio; index++) {

            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>'+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);
        }
    } else {
        end_pos = list_files.length;
        for (let index = 0; index < list_files.length; index++) {

            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>'+
            ' </div> <div class="col-9" id="nome">'
            +path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);
        }
    }

    // The playlist links
    let links = document.querySelectorAll('.audio');  
    player(links);

    // Play on audio load
    wavesurfer.on('ready', function() {
        wavesurfer.play();
    });

    wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Go to the next track on finish
    wavesurfer.on('finish', function() {
        links[currentTrack].classList.remove('active');
        links[currentTrack].classList.remove('pause')
        links[currentTrack].childNodes[1].innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';
    });

    

    let prev = document.getElementById("prev")
    prev.addEventListener('click', function(e) {
        
        if (currentPage > 1) {
            currentPage -= 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            
            
            end_pos = beg_pos;
            if ((beg_pos - naudio) >= 0) {
                beg_pos -= naudio;
            } else {
                beg_pos = 0;
            }

            let currentAudio = list_files.slice(beg_pos, end_pos) 

            for (let index = 0; index < currentAudio.length; index++) {
    
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>'+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);
            }
        }
        links = document.querySelectorAll('.audio');  
               
        player(links);
    });

    let next = document.getElementById("next")
    next.addEventListener('click', function(e) {
        if (currentPage < lastPage) {
            currentPage += 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            
            beg_pos = end_pos;
            if (end_pos+naudio < list_files.length) {
                end_pos += naudio;
            } else {
                end_pos = list_files.length
            }

            let currentAudio = list_files.slice(beg_pos, end_pos) 

            for (let index = 0; index < currentAudio.length; index++) {
    
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>'+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);
            }
            links = document.querySelectorAll('.audio');  
            player(links);
        }
  
    });

    let avancar = document.getElementById("avancar");
    avancar.addEventListener('click', function(e) {
        window.location.replace("../html/fragpage.html");
    });
});
