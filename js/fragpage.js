const { ipcRenderer} = require('electron')
const $ = jQuery = require('jquery');
var WaveSurfer = require('wavesurfer.js');
const colormap = require('colormap');
const {PythonShell} = require('python-shell');
var path = require('path');

var args = ipcRenderer.sendSync('fromMain', "");
var path_dir = args[0];

var list_files = args[1];
delete args

var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;

var wavesurfer;
var preview_wavesurfer;

document.getElementById("btnVoltar").addEventListener("click", function(){ 
    window.location.replace("../html/infopage.html"); 
});


document.addEventListener('DOMContentLoaded', function() {
    var cmap = colormap({
            colormap: 'cool',
            nshades: 256,
            format: 'float'
            });;

    wavesurfer = new WaveSurfer.create({
            container: '#waveform',
            waveColor: '#4ACA4E',
            progressColor: '#765FC9',
            plugins: [
                WaveSurfer.spectrogram.create({
                    container: '#wave-spectrogram',
                    fftSamples: 256, 
                    colorMap: cmap   
                })
            ]
        });
    
    preview_wavesurfer = new WaveSurfer.create({
            container: '#preview-waveform',
            waveColor: '#4ACA4E',
            progressColor: '#765FC9',
            plugins: [
                WaveSurfer.spectrogram.create({
                    container: '#preview-spectrogram',
                    fftSamples: 256, 
                    colorMap: cmap   
                })
            ]
        });
});

document.addEventListener('DOMContentLoaded', function() {
    // Zoom slider
    let slider = document.getElementById("zoom");
    let slider_preview = document.getElementById("zoom_preview");

    slider.value = wavesurfer.params.minPxPerSec;
    slider.min = wavesurfer.params.minPxPerSec;
    // Allow extreme zoom-in, to see individual samples
    slider.max = 1000;

    slider.addEventListener('input', function() {
        wavesurfer.zoom(Number(this.value));
    });

    slider_preview.value = preview_wavesurfer.params.minPxPerSec;
    slider_preview.min = preview_wavesurfer.params.minPxPerSec;
    // Allow extreme zoom-in, to see individual samples
    slider_preview.max = 1000;

    slider_preview.addEventListener('input', function() {
        preview_wavesurfer.zoom(Number(this.value));
    });

    // set initial zoom to match slider value
    wavesurfer.zoom(slider.value);
    preview_wavesurfer.zoom(slider_preview.value);

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
            playpause.classList.add("pause");
            playpause.innerHTML = pause_icon;
            wavesurfer.load(list_files[currentTrack]); 
        }
    });

    var playpause_preview = document.getElementById("playpause_preview");
    playpause_preview.addEventListener('click', function(e){
        if (playpause_preview.classList.contains("active")) {
            if (playpause_preview.classList.contains("pause")) {
                playpause_preview.classList.remove("pause");
                preview_wavesurfer.play();
                playpause_preview.innerHTML = pause_icon;
                
            } else{
                playpause_preview.classList.add("pause");
                preview_wavesurfer.pause();
                playpause_preview.innerHTML = play_icon;
            }
            
        } else {
            playpause_preview.classList.add('active');
            playpause_preview.classList.add("pause");
            playpause_preview.innerHTML = pause_icon;
            preview_wavesurfer.load(list_files[currentTrack]); 
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

    preview_wavesurfer.on('error', function(e) {
        console.warn(e);
    });

    // Go to the next track on finish
    preview_wavesurfer.on('finish', function() {
        playpause_preview.classList.remove('active');
        playpause_preview.classList.remove('pause')
        playpause_preview.innerHTML = play_icon;
    });
    

    let skip_prev = document.getElementById("skip_prev")
    skip_prev.addEventListener('click', function(e) {
        if (currentTrack > 0 ) {
            currentTrack -= 1;
            if (playpause.classList.contains('active')) {
                playpause.innerHTML = play_icon;
                playpause.classList.add("pause");
            }
            wavesurfer.load(list_files[currentTrack]); 


            playpause_preview.classList.remove('active');
            playpause_preview.classList.remove("pause");
            preview_wavesurfer.pause();
            playpause_preview.innerHTML = play_icon;
            playpause_preview.disabled = true
            slider_preview.disabled = true
        }
        
    });

    let skip_next = document.getElementById("skip_next")
    skip_next.addEventListener('click', function(e) {
        if (currentTrack < list_files.length ) {
            currentTrack += 1;
            if (playpause.classList.contains('active')) {
                playpause.innerHTML = play_icon;
                playpause.classList.add("pause");
            }          
            wavesurfer.load(list_files[currentTrack]); 
            
            playpause_preview.classList.remove('active');
            playpause_preview.classList.remove("pause");
            preview_wavesurfer.pause();
            playpause_preview.innerHTML = play_icon;
            playpause_preview.disabled = true
            slider_preview.disabled = true
        }
    });

    let save_dir = document.getElementById("saveDir");
    let label_dir = document.getElementById("path");
    save_dir.addEventListener('click', function(e){
        let value = ipcRenderer.sendSync('show-open-dialog', "");
        if (value != undefined) {
            label_dir.value = value;
        }
    });

    let avancar = document.getElementById("avancar");
    let preview = document.getElementById("preview");
    preview.addEventListener('click', function(e){
        preview.disabled = true
        avancar.disabled = true
        preview.innerHTML = '<div class="spinner-grow text-dark" role="status"><span class="visually-hidden">Loading...</span></div>';
        let pvw = true;
        let audio_dir = list_files[currentTrack];
        let temp_dir = path.join(__dirname, '../assets/');
        let frag_min = document.getElementById("minFrag").value;
        let frag_max = document.getElementById("maxFrag").value; 
        let rate = document.getElementById("sampleRate").value; 
        let duration = document.getElementById("duration").value;
        let frame_length = document.getElementById("frameSize").value; 
        let fft_length = document.getElementById("nFFT").value; 
        let stride = document.getElementById("strides").value; 
        let subtype = 'PCM_16'; 
        let spec = false;

        let options = {
            scriptPath: path.join(__dirname, '../py/'),
            args: [pvw, audio_dir, temp_dir, frag_min, frag_max, rate, duration, frame_length, fft_length, stride, subtype, spec]
        };
        
        var frag_script_python = new PythonShell('fragment_audio.py', options);
        frag_script_python.on('message', function (message) {
            // received a message sent from the Python script (a simple "print" statement)
            preview.innerHTML = 'Preview'
            if (message == "True"){
                playpause_preview.classList.add('active');
                playpause_preview.classList.add("pause");
                preview_wavesurfer.load(path.join(__dirname, '../assets/frag_temp.wav'));
                playpause_preview.removeAttribute("disabled");
                slider_preview.removeAttribute("disabled");
            }else{
                $("#Error").modal('show');
            }     
            preview.disabled = false;
            avancar.disabled = false;
        });
        
    });

    
    avancar.addEventListener('click', function(e) {

        let pvw = false;
        let audio_dir = path_dir;
        let save_dir = document.getElementById("path").value;
        let frag_min = document.getElementById("minFrag").value;
        let frag_max = document.getElementById("maxFrag").value; 
        let rate = document.getElementById("sampleRate").value; 
        let duration = document.getElementById("duration").value;
        let frame_length = document.getElementById("frameSize").value; 
        let fft_length = document.getElementById("nFFT").value; 
        let stride = document.getElementById("strides").value; 
        let subtype = 'PCM_16'; 
        let spec = document.getElementById("SwitchCheck").checked;
        
        if (save_dir != '') {
            args = [pvw, 
                    audio_dir, 
                    save_dir, 
                    frag_min, 
                    frag_max, 
                    rate, 
                    duration, 
                    frame_length, 
                    fft_length, 
                    stride, 
                    subtype, 
                    spec]

            ipcRenderer.send('argsToMain', args);
            window.location.replace("../html/loadpage.html");
        }
    });
});
