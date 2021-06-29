const{ ipcRenderer } = require('electron')
const mm = require('music-metadata');
var fs = require('fs');
var $ = jQuery = require('jquery');
var WaveSurfer = require('wavesurfer.js');
var path = require('path');

var wavesurfer; 
var corte_wavesurfer;

var args = ipcRenderer.sendSync('fromMain', "");
var path_dir = args[0];
var list_files = args[1];

var list_generated_files = ipcRenderer.sendSync('destTofromMain', "");


var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;
var currentTrack_corte = 0;

async function getDurationTrack(track, id){
    let metadata = await mm.parseFile(track);
    let secs = metadata.format.duration;

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60);

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);

    $(id).text(minutes+":"+seconds)
}

function player(audios, ws, ct){
    ct = 0
    // Load a track by index and highlight the corresponding link
    let setCurrentSong = function(index) {
        audios[ct].classList.remove('active');
        audios[ct].childNodes[1].innerHTML = play_icon;
        ct = index;
        audios[ct].classList.add('active');
        audios[ct].childNodes[1].innerHTML = pause_icon;
        ws.load(audios[ct].attributes.href.nodeValue);
    };

    // Load the track on click
    Array.prototype.forEach.call(audios, function(link, index) {
        link.addEventListener('click', function(e) {
            
            e.preventDefault();
            if (audios[index].classList.contains('active')) {
                if (audios[index].classList.contains('pause')) {
                    ws.play();
                    audios[index].childNodes[1].innerHTML = pause_icon;
                    audios[index].classList.remove('pause');
                } else {
                    ws.pause();
                    audios[index].childNodes[1].innerHTML = play_icon;
                    audios[index].classList.add('pause');
                }
                            
            } else {
                setCurrentSong(index);
            }  
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4ACA4E',
        progressColor: '#765FC9',
        height: 100
    });
    corte_wavesurfer = WaveSurfer.create({
        container: '#waveform-corte',
        waveColor: '#4ACA4E',
        progressColor: '#765FC9',
        height: 100
    });
});

document.addEventListener('DOMContentLoaded', function(){
    let naudio = 9;
    
    let beg_pos = 0;
    let end_pos;

    let playlist = document.getElementById('playlist');
    let playlist_corte = document.getElementById('playlist-corte');

    let npage = document.getElementsByClassName('npage');

    let currentPage = 1;
    let lastPage = Math.ceil(list_files.length/naudio)

    npage[0].innerHTML = currentPage+"/"+lastPage;
    
    if (list_files.length > naudio) {
        end_pos = naudio;
        for (let index = 0; index < naudio; index++) {

            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);

            $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
            index+' href='+list_generated_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_generated_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_generated_files[index], ".duracao"+index);
        }
    } else {
        end_pos = list_files.length;
        for (let index = 0; index < list_files.length; index++) {

            $('#playlist').append('<div class="destaque list-group-item list-group-item-action audio d-flex " id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            ' </div> <div class="col-9" id="nome">'
            +path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);

            $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
            index+' href='+list_generated_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_generated_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_generated_files[index], ".duracao"+index);
        }
    }

    // The playlist links
    let links = document.querySelectorAll('.audio');

    let links_corte = document.querySelectorAll('.audio_corte');

    player(links, wavesurfer, currentTrack);
    player(links_corte, corte_wavesurfer, currentTrack_corte);

    wavesurfer.on('ready', function(e) {
        wavesurfer.play();
    });

    wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Go to the next track on finish
    wavesurfer.on('finish', function() {
        links[currentTrack].classList.remove('active');
        links[currentTrack].classList.remove('pause')
        links[currentTrack].childNodes[1].innerHTML = play_icon;
    });

    corte_wavesurfer.on('ready', function(e) {
        corte_wavesurfer.play();
    });

    corte_wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Go to the next track on finish
    corte_wavesurfer.on('finish', function() {
        links_corte[currentTrack_corte].classList.remove('active');
        links_corte[currentTrack_corte].classList.remove('pause')
        links_corte[currentTrack_corte].childNodes[1].innerHTML = play_icon;
    });

    

    let prev = document.getElementById("prev")
    prev.addEventListener('click', function(e) {
        
        if (currentPage > 1) {
            currentPage -= 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            playlist_corte.innerHTML = '';
            
            end_pos = beg_pos;
            if ((beg_pos - naudio) >= 0) {
                beg_pos -= naudio;
            } else {
                beg_pos = 0;
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)
            let currentAudio_corte = list_generated_files.slice(beg_pos, end_pos)

            for (let index = 0; index < currentAudio.length; index++) {
    
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);

                $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
                index+' href='+currentAudio_corte[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio_corte[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

                getDurationTrack(currentAudio_corte[index], ".duracao"+index);
            }
        }
        links = document.querySelectorAll('.audio');
        links_corte = document.querySelectorAll('.audio_corte')
               
        player(links, wavesurfer, currentTrack);
        player(links_corte, corte_wavesurfer, currentTrack_corte);
    });

    let next = document.getElementById("next")
    next.addEventListener('click', function(e) {
        if (currentPage < lastPage) {
            currentPage += 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            playlist_corte.innerHTML = '';

            beg_pos = end_pos;
            if (end_pos+naudio < list_files.length) {
                end_pos += naudio;
            } else {
                end_pos = list_files.length
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)
            let currentAudio_corte = list_generated_files.slice(beg_pos, end_pos)

            for (let index = 0; index < currentAudio.length; index++) {
    
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);

                $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
                index+' href='+currentAudio_corte[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio_corte[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

                getDurationTrack(currentAudio_corte[index], ".duracao"+index);
            }
        }
        links = document.querySelectorAll('.audio');
        links_corte = document.querySelectorAll('.audio_corte')
               
        player(links, wavesurfer, currentTrack);
        player(links_corte, corte_wavesurfer, currentTrack_corte);
    });

    let avancar = document.getElementById("avancar");
    avancar.addEventListener('click', function(e) {
        window.location.replace("../html/home.html");
    });
});