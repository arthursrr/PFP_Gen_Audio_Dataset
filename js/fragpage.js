const{ ipcRenderer} = require('electron')
var fs = require('fs');
var $ = jQuery = require('jquery');
var WaveSurfer = require('wavesurfer.js');
var colormap = require('colormap');


var path = require('path');

var args = ipcRenderer.sendSync('fromMain', "");
var path_dir = args[0];

var list_files = args[1];
delete args

var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;

var wavesurfer;

document.getElementById("btnVoltar").addEventListener("click", function(){ 
    window.location.replace("../html/infopage.html"); 
});


document.addEventListener('DOMContentLoaded', function() {
    var cmap = colormap({
            colormap: 'greens',
            nshades: 256,
            format: 'float'
            });;

    wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4ACA4E',
            progressColor: '#072708',
            plugins: [
                WaveSurfer.spectrogram.create({
                    container: '#wave-spectrogram',
                    fftSamples: 256, 
                    colorMap: cmap   
                })
            ]
        });
});

document.addEventListener('DOMContentLoaded', function() {
    // Zoom slider
    let slider = document.getElementById("zoom");

    slider.value = wavesurfer.params.minPxPerSec;
    slider.min = wavesurfer.params.minPxPerSec;
    // Allow extreme zoom-in, to see individual samples
    slider.max = 1000;

    slider.addEventListener('input', function() {
        wavesurfer.zoom(Number(this.value));
    });

    // set initial zoom to match slider value
    wavesurfer.zoom(slider.value);

    var playpause = document.getElementById("playpause");
    playpause.addEventListener('click', function(e){
        if (playpause.classList.contains("active")) {
            if (playpause.classList.contains("pause")) {
                playpause.classList.remove("pause");
                wavesurfer.play();
                playpause.innerHTML = pause_icon;
                
            } else{
                playpause.classList.add("pause");
                wavesurfer.pause();
                playpause.innerHTML = play_icon;
            }
            
        } else {
            playpause.classList.add('active');
            playpause.innerHTML = pause_icon;
            wavesurfer.load(list_files[currentTrack]); 
        }
    });

    playpause.classList.add('active');
    playpause.classList.add("pause");
    wavesurfer.load(list_files[currentTrack]);

    wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Go to the next track on finish
    wavesurfer.on('finish', function() {
        playpause.classList.remove('active');
        playpause.classList.remove('pause')
        playpause.innerHTML = play_icon;
    });

    

    let skip_prev = document.getElementById("skip_prev")
    skip_prev.addEventListener('click', function(e) {
        if (currentTrack > 0 ) {
            currentTrack -= 1;
            playpause.classList.add('active');
            playpause.innerHTML = pause_icon;
            wavesurfer.load(list_files[currentTrack]); 
        }
        
    });

    let skip_next = document.getElementById("skip_next")
    skip_next.addEventListener('click', function(e) {
        if (currentTrack < list_files.length ) {
            currentTrack += 1;
            playpause.classList.add('active');
            playpause.innerHTML = pause_icon;
            wavesurfer.load(list_files[currentTrack]); 
        }
    });

    let save_dir = document.getElementById("saveDir");
    let label_dir = document.getElementById("path");

    save_dir.addEventListener('click', function(e){
        label_dir.innerHTML = ipcRenderer.sendSync('show-open-dialog', "")[0];
    });

    let avancar = document.getElementById("avancar");
    avancar.addEventListener('click', function(e) {
        //window.location.replace("../html/fragpage.html");
    });
});
