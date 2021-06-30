//Autor: Arthur Serra
/*  ========================== fragpage.js ================================
 *  Este script produz todos os eventos de controle da pagina fragpage.html
 *  Tendo como principal evento definir e pre-visualizar paramentros de fragmentação
 *  ===================================================================
*/

const { ipcRenderer} = require('electron')      //Importa função de comunicação com o processo principal
const $ = jQuery = require('jquery');           //Importa comandos JQuery
var WaveSurfer = require('wavesurfer.js');      //Importa biblioteca de visualização de ondas e espectro
const colormap = require('colormap');           //Importa biblioteca de mapa de cores para o espectrograma
const {PythonShell} = require('python-shell');  //Importa biblioteca de integração com script Python
var path = require('path');                     //Importa sistema de arquivos

var args = ipcRenderer.sendSync('fromMain', ""); //[Array] faz uma chamada ao evento do processo principal para obter o diretorio geral e sua lista de arquivos  
var path_dir = args[0];                          //[String] caminho do diretorio geral
var list_files = args[1];                        //[Array] caminho de todos os arquivos do diretorio princial
delete args

//ICONES DE PLAY E PAUSE
var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;   //[Inteiro] Indice da faixa a ser carregada

var wavesurfer;         //[Object] Objeto gerenciamento de audio de referencia
var preview_wavesurfer; //[Object] Objeto gerenciamento de audio de cortado

document.getElementById("btnVoltar").addEventListener("click", function(){ 
    window.location.replace("../html/infopage.html"); //volta para a pagina anterior ao clicar no botao
});


document.addEventListener('DOMContentLoaded', function() {
    //Carrega um mapa de cores
    var cmap = colormap({
            colormap: 'cool',
            nshades: 256,
            format: 'float'
            });;

    //instacia o objeto de vizualização de referencia
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
    
    //instacia o objeto de vizualização cortado
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
    // Zoom maximo
    slider.max = 1000;

    slider.addEventListener('input', function() {
        wavesurfer.zoom(Number(this.value));
    });

    //Zoom slider
    slider_preview.value = preview_wavesurfer.params.minPxPerSec;
    slider_preview.min = preview_wavesurfer.params.minPxPerSec;
    // Zoom maximo
    slider_preview.max = 1000;

    slider_preview.addEventListener('input', function() {
        preview_wavesurfer.zoom(Number(this.value));
    });

    // Configura valores iniciais do slider 
    wavesurfer.zoom(slider.value);
    preview_wavesurfer.zoom(slider_preview.value);

    var playpause = document.getElementById("playpause");   //Elemendo do comando play/pause para audio de referencia
    playpause.addEventListener('click', function(e){
        //Ao envento de click
        if (playpause.classList.contains("active")) {
            //Caso ja tenha audio carregado inicia gerenciador de play/pause
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
            //Caso nao haja audio carregado
            playpause.classList.add('active');
            playpause.classList.add("pause");
            playpause.innerHTML = pause_icon;
            wavesurfer.load(list_files[currentTrack]); 
        }
    });

    var playpause_preview = document.getElementById("playpause_preview"); //Elemendo do comando play/pause para audio cortado
    playpause_preview.addEventListener('click', function(e){
        //Ao envento de click
        if (playpause_preview.classList.contains("active")) {
            //Caso ja tenha audio carregado inicia gerenciador de play/pause
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
            //Caso nao haja audio carregado
            playpause_preview.classList.add('active');
            playpause_preview.classList.add("pause");
            playpause_preview.innerHTML = pause_icon;
            preview_wavesurfer.load(list_files[currentTrack]); 
        }
    });

    //Carrega o primeiro audio
    playpause.classList.add('active');
    playpause.classList.add("pause");
    wavesurfer.load(list_files[currentTrack]);

    wavesurfer.on('error', function(e) {
        //mostra warnings no console
        console.warn(e);
    });

    wavesurfer.on('finish', function() {
        //Pausa a faixa caso acabada
        playpause.classList.remove('active');
        playpause.classList.remove('pause')
        playpause.innerHTML = play_icon;
    });

    preview_wavesurfer.on('error', function(e) {
        //mostra warnings no console
        console.warn(e);
    });

    preview_wavesurfer.on('finish', function() {
        //Pausa a faixa caso acabada
        playpause_preview.classList.remove('active');
        playpause_preview.classList.remove('pause')
        playpause_preview.innerHTML = play_icon;
    });
    

    let skip_prev = document.getElementById("skip_prev")    //Elemento para avançar faixa de referencia
    skip_prev.addEventListener('click', function(e) {
        if (currentTrack > 0 ) {
            //Caso nao seja a primeira faixa 
            currentTrack -= 1;
            if (playpause.classList.contains('active')) {
                playpause.innerHTML = play_icon;
                playpause.classList.add("pause");
            }
            wavesurfer.load(list_files[currentTrack]); 

            //Reseta o status e desabilita o preview até q seja carregado novamente
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
            //Caso nao seja a ultima faixa
            currentTrack += 1;
            if (playpause.classList.contains('active')) {
                playpause.innerHTML = play_icon;
                playpause.classList.add("pause");
            }          
            wavesurfer.load(list_files[currentTrack]); 

            //Reseta o status e desabilita o preview até q seja carregado novamente
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
        let value = ipcRenderer.sendSync('show-open-dialog', "");   //[String] Faz uma requisição ao script principal
        if (value != undefined) {
            //Caso algum diretorio tenha sido corretamente selecionado
            label_dir.value = value;
        }
    });

    let avancar = document.getElementById("avancar");       //Elemento para avançar para a proxima pagina
    let preview = document.getElementById("preview");       //Elemento para carregar uma amostra de fragmentação
    preview.addEventListener('click', function(e){
        //Ao clicar no elemento preview
        preview.disabled = true                             //Desabilita o botao de preview                     
        avancar.disabled = true                             //Desabilita o botao de de avançar
        //Adiciona icone de carregamento
        preview.innerHTML = '<div class="spinner-grow text-dark" role="status"><span class="visually-hidden">Loading...</span></div>';
        let pvw = true;                                                 //[Boolean] Flag de preview
        let audio_dir = list_files[currentTrack];                       //[String]  Caminho do diretorio de referencia
        let temp_dir = path.join(__dirname, '../assets/');              //[String]  Caminho do audio preview temporario
        let frag_min = document.getElementById("minFrag").value;        //[Inteiro] Limite minimo de fragmentação para cada parte do epectro
        let frag_max = document.getElementById("maxFrag").value;        //[Inteiro] Limite maximo de fragmentação para cada parte do epectro
        let rate = document.getElementById("sampleRate").value;         //[Inteiro] Taxa de amostragem geral
        let duration = document.getElementById("duration").value;       //[Inteiro] Duração geral em segundos
        let frame_length = document.getElementById("frameSize").value;  //[Inteiro] Tamanho da janela deslizante da transformada de fourier
        let fft_length = document.getElementById("nFFT").value;         //[Inteiro] Tamanho das transformadas (A metade deste valor define a quantidade de frequencias)
        let stride = document.getElementById("strides").value;          //[Inteiro] Tamanho dos passos de janelamento
        let subtype = 'PCM_16';                                         //[String]  Formato de condificação do audio resultante
        let spec = false;                                               //[Boolean] Flag para definir se os espectrogramas tambem serao salvos

        //Dicionario de argumentos para execução do script Python
        let options = {
            scriptPath: path.join(__dirname, '../py/'),                                                                             //[String] caminho do diretorio de armazenamento do script
            args: [pvw, audio_dir, temp_dir, frag_min, frag_max, rate, duration, frame_length, fft_length, stride, subtype, spec]   //[Array] argumento de execução
        };
        

        var frag_script_python = new PythonShell('fragment_audio.py', options); //[Objeto] Instancia de execução do script python
        frag_script_python.on('message', function (message) {
            //Evento inicia a execução do script python e aguardo um retorno atraves do argumento message
            //Os comando subsequentes são executados ao fim do processo python. 
            preview.innerHTML = 'Preview'
            if (message == "True"){
                //Caso o fim do processo resulte em 'True', nao houve problema na execução
                playpause_preview.classList.add('active');
                playpause_preview.classList.add("pause");
                preview_wavesurfer.load(path.join(__dirname, '../assets/frag_temp.wav'));   //Carrega o arquivo temporario resultante
                playpause_preview.removeAttribute("disabled");                              //Habilita o botão de play/pause da seção preview
                slider_preview.removeAttribute("disabled");                                 //Habilita o botão sliders do seção preview
            }else{
                //Caso o script python nao tem sido executado corretamente
                $("#Error").modal('show');                                                  //Chamada do elemento modal de erro via JQuery
            }     
            preview.disabled = false;   //Habilita o botao de preview
            avancar.disabled = false;   //Habilita o botao de avanço
        });
        
    });

    avancar.addEventListener('click', function(e) {

        let pvw = false;                                                 //[Boolean] Flag de preview
        let audio_dir = path_dir;                                        //[String]  Caminho do diretorio de referencia
        let save_dir = document.getElementById("path").value;            //[String]  Caminho do audio preview temporario
        let frag_min = document.getElementById("minFrag").value;         //[Inteiro] Limite minimo de fragmentação para cada parte do epectro
        let frag_max = document.getElementById("maxFrag").value;         //[Inteiro] Limite maximo de fragmentação para cada parte do epectro
        let rate = document.getElementById("sampleRate").value;          //[Inteiro] Taxa de amostragem geral
        let duration = document.getElementById("duration").value;        //[Inteiro] Duração geral em segundos
        let frame_length = document.getElementById("frameSize").value;   //[Inteiro] Tamanho da janela deslizante da transformada de fourier
        let fft_length = document.getElementById("nFFT").value;          //[Inteiro] Tamanho das transformadas (A metade deste valor define a quantidade de frequencias)
        let stride = document.getElementById("strides").value;           //[Inteiro] Tamanho dos passos de janelamento
        let subtype = 'PCM_16';                                          //[String]  Formato de condificação do audio resultante
        let spec = document.getElementById("SwitchCheck").checked;       //[String]  Formato de condificação do audio resultante
        
        if (save_dir != '') {
            //Caso o diretorio de destino seja um diretorio valido
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

            ipcRenderer.send('argsToMain', args);               //Envia o array de argumentos para o script principal
            window.location.replace("../html/loadpage.html");   //Avança para a proxima pagina (loadpage.html)
        }
    });
});
