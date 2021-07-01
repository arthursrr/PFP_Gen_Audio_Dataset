//Autor: Arthur Serra
/*  ========================== playlistpage.js ============================
 *  Este script apresenta ao usuario duas playlists, uma com os audio de
 *  referencia e outra com os audios fragmentados. Lado a lado de tal forma
 *  que o usuario possa avaliar o processo gerado.
 *  =======================================================================
*/
const{ ipcRenderer } = require('electron'); //Importa funcao de comunicacao com o processo principal
const mm = require('music-metadata');       //Importa biblioteca obtencao de metadados de audios
var fs = require('fs');                     //Importa sistema de arquivos
var $ = jQuery = require('jquery');         //Importa comandos JQuery
var WaveSurfer = require('wavesurfer.js');  //Importa biblioteca de visualizacao de ondas e espectro
var path = require('path');                 //Importa sistema de arquivos

var args = ipcRenderer.sendSync('fromMain', ""); //[Array] faz uma chamada ao evento do processo principal para obter o diretorio geral e sua lista de arquivos  
var path_dir = args[0];                          //[String] caminho do diretorio geral
var list_files = args[1];                        //[Array] caminho de todos os arquivos do diretorio princial
delete args

var list_generated_files = ipcRenderer.sendSync('destTofromMain', "");  //[Array] Faz uma consulta ao processo principal para obter os caminho gerados pelo processo de fragmentacao

//ICONES DE PLAY E PAUSE
var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;
var currentTrack_corte = 0;

var wavesurfer;         //[Object] Instancia gerenciamento dos audio de referencia
var corte_wavesurfer;   //[Object] Instancia gerenciamento dos audios fragmentados

async function getDurationTrack(track, id){
    /* Esta funcao recebe um numero inteiro que representa a duracao
     * de tempo em segundos de uma determinada faixa e transforma 
     * para o formato mm:ss
     * <ATRIBUTOS>
     *      track: [String] caminho do arquivo
     *      id:    [String] identificador no formulario infopage.html   
     * <RETORNO>
     *      [null]
    */
    let metadata = await mm.parseFile(track);           //obtem os metadados do uma arquivo de audio
    let secs = metadata.format.duration;                //extrai a duracao total em segundos dos metadados

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60); //obtem os minutos inteiros

    var divisor_for_seconds = divisor_for_minutes % 60; 
    var seconds = Math.ceil(divisor_for_seconds);       //obtem os segundos inteiro fora os minutos

    $(id).text(minutes+":"+seconds)                     //Atualiza o texto no fomulario html via JQuery
}

function player(audios, ws, ct){
    /* Esta funcao produz um player de audio dado um array de caminhos
     * <ATRIBUTOS>
     *      audios: [Array] caminhos dos arquivo
     *      ws:     [Object] Instancia da biblioteca de exibicao
     *      ct:     [Inteiro] indice do audio
     * <RETORNO>
     *      [null]
    */
    ct = 0
    // CARREGA UMA FAIXA DADOS UM INDICE ATUAL
    let setCurrentSong = function(index) {
        audios[ct].classList.remove('active');
        audios[ct].childNodes[1].innerHTML = play_icon;
        ct = index;
        audios[ct].classList.add('active');
        audios[ct].childNodes[1].innerHTML = pause_icon;
        ws.load(audios[ct].attributes.href.nodeValue);
    };

    // CARREGA UM AUDIO DADO EVENTO DE CLICK
    Array.prototype.forEach.call(audios, function(link, index) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (audios[index].classList.contains('active')) {
                //CASO O AUDIO DE ESTEJA CARREGADO e FEITO APENAS UM GERENCIAMENTO DE PLAY E PAUSE
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
                //CASO O AUDIO AINDA NAO ESTEJA CARREGADO
                setCurrentSong(index);
            }  
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    //instacia o objeto de vizualizacao do audio de referencia
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4ACA4E',
        progressColor: '#765FC9',
        height: 100
    });
    //instacia o objeto de vizualizacao do audio de fragmentado
    corte_wavesurfer = WaveSurfer.create({
        container: '#waveform-corte',
        waveColor: '#4ACA4E',
        progressColor: '#765FC9',
        height: 100
    });
});

document.addEventListener('DOMContentLoaded', function(){
    let naudio = 9;                                                 //[Inteiro] Define a quantidade de audio aparecerar por vez em uma coluna da pagina
    
    let beg_pos = 0;                                                //[Inteiro] Indice do primeiro audio na pagina em relacao a lista de todos oa audios
    let end_pos;                                                    //[Inteiro] Indice do ultimo audio na pagina em relacao a lista de todos oa audios

    let playlist = document.getElementById('playlist');             //[Objeto] Carrega o elemento de visualizacao da playlist de referencia
    let playlist_corte = document.getElementById('playlist-corte'); //[Objeto] Carrega o elemento de visualizacao da playlist fragmentada

    let npage = document.getElementsByClassName('npage');           //[Objeto] Carrega o elemento de posicao na paginacao

    let currentPage = 1;                                            //[Inteiro] pagina atual
    let lastPage = Math.ceil(list_files.length/naudio)

    npage[0].innerHTML = currentPage+"/"+lastPage;                  //Define o valor da pagina atual no formulario
    
    if (list_files.length > naudio) {
        //Valida de o total de arquivos e inferior ao limite de exibicao por vez
        end_pos = naudio;
        for (let index = 0; index < naudio; index++) {
            //Produz os containers de exibicao da playlist de referencia
            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);

            //Produz os containers de exibicao da playlist fragmentada
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
            //Produz os containers de exibicao da playlist de referencia
            $('#playlist').append('<div class="destaque list-group-item list-group-item-action audio d-flex " id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            ' </div> <div class="col-9" id="nome">'
            +path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);

            //Produz os containers de exibicao da playlist fragmentada
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

    let links = document.querySelectorAll('.audio');                //[Array] obtem os cominhos de cada container de audio de referencia em em exibicao
    let links_corte = document.querySelectorAll('.audio_corte');    //[Array] obtem os cominhos de cada container de audio fragmentado em em exibicao

    player(links, wavesurfer, currentTrack);                        //inicia o player de referencia
    player(links_corte, corte_wavesurfer, currentTrack_corte);      //inicia o player fragmentado

    wavesurfer.on('ready', function(e) {
        //play caso carregado
        wavesurfer.play();
    });

    wavesurfer.on('error', function(e) {
        //mostra warnings no console
        console.warn(e);
    });

    wavesurfer.on('finish', function() {
        //Pausa a faixa caso acabada
        links[currentTrack].classList.remove('active');
        links[currentTrack].classList.remove('pause')
        links[currentTrack].childNodes[1].innerHTML = play_icon;
    });

    corte_wavesurfer.on('ready', function(e) {
        //play caso carregado
        corte_wavesurfer.play();
    });

    corte_wavesurfer.on('error', function(e) {
        //mostra warnings no console
        console.warn(e);
    });

    // Go to the next track on finish
    corte_wavesurfer.on('finish', function() {
        //Pausa a faixa caso acabada
        links_corte[currentTrack_corte].classList.remove('active');
        links_corte[currentTrack_corte].classList.remove('pause')
        links_corte[currentTrack_corte].childNodes[1].innerHTML = play_icon;
    });

    let prev = document.getElementById("prev")      //Elemento de paginacao voltar
    prev.addEventListener('click', function(e) {      
        if (currentPage > 1) {
            //Caso nao seja a pagina inicial
            currentPage -= 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            playlist_corte.innerHTML = '';
            
            //Define o range de exibicao
            end_pos = beg_pos;
            if ((beg_pos - naudio) >= 0) {
                beg_pos -= naudio;
            } else {
                beg_pos = 0;
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)                       //[Array] Lista de caminhos dos audios de referencia em exibicao
            let currentAudio_corte = list_generated_files.slice(beg_pos, end_pos)       //[Array] Lista de caminhos dos audios fragmentados em exibicao

            for (let index = 0; index < currentAudio.length; index++) {
                //Carrega os elementos dos novos audios de referencia
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);                //obtem duracao de cada faixa

                //Carrega os elementos dos novos audios fragmentados
                $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
                index+' href='+currentAudio_corte[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio_corte[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

                getDurationTrack(currentAudio_corte[index], ".duracao"+index);          //obtem duracao de cada faixa
            }
        }
        links = document.querySelectorAll('.audio');                //[Array] Lista de audio de referencia em exibicao
        links_corte = document.querySelectorAll('.audio_corte')     //[Array] Lista de audio fragmentados em exibicao
               
        player(links, wavesurfer, currentTrack);                    //inicia o player de referencia
        player(links_corte, corte_wavesurfer, currentTrack_corte);  //inicia o player fragmentado
    });

    let next = document.getElementById("next")      //Elemento de paginacao avancar
    next.addEventListener('click', function(e) {
        if (currentPage < lastPage) {
            //Caso nao seja a pagina Final
            currentPage += 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            playlist_corte.innerHTML = '';

            //Define o range de exibicao
            beg_pos = end_pos;
            if (end_pos+naudio < list_files.length) {
                end_pos += naudio;
            } else {
                end_pos = list_files.length
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)                       //[Array] Lista de caminhos dos audios de referencia em exibicao       
            let currentAudio_corte = list_generated_files.slice(beg_pos, end_pos)       //[Array] Lista de caminhos dos audios fragmentados em exibicao

            for (let index = 0; index < currentAudio.length; index++) {
                //Carrega os elementos dos novos audios de referencia
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index);                //obtem duracao de cada faixa

                //Carrega os elementos dos novos audios fragmentados
                $('#playlist-corte').append('<div class="list-group-item list-group-item-action audio_corte d-flex" id=audio'+
                index+' href='+currentAudio_corte[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio_corte[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

                getDurationTrack(currentAudio_corte[index], ".duracao"+index);          //obtem duracao de cada faixa
            }
        }
        links = document.querySelectorAll('.audio');                    //[Array] Lista de audio de referencia em exibicao
        links_corte = document.querySelectorAll('.audio_corte')         //[Array] Lista de audio fragmentados em exibicao
               
        player(links, wavesurfer, currentTrack);                        //inicia o player de referencia
        player(links_corte, corte_wavesurfer, currentTrack_corte);      //inicia o player fragmentado
    });

    let avancar = document.getElementById("avancar");   //Elemento do botao avancar
    avancar.addEventListener('click', function(e) {
        //Ativo ao clicar
        window.location.replace("../html/home.html");   //retorna a pagina inicial da aplicacao
    });
});