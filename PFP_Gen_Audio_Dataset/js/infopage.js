//Autor: Arthur Serra
/*  ========================== infopage.js ================================
 *  Este script produz todos os eventos de controle da pagina infopage.html
 *  Tendo como principal evento gerar uma playlist dos dados presentes no
 *  diretorio informado e carregar algumas informações gerais dos dados.
 *  Tais como tamanho, duração media e total.
 *  ===================================================================
*/

const{ ipcRenderer } = require('electron'); //Importa função de comunicação com o processo principal
const mm = require('music-metadata');       //Importa biblioteca obtenção de metadados de audios
var fs = require('fs');                     //Importa sistema de arquivos
var $ = jQuery = require('jquery');         //Importa comandos JQuery
var WaveSurfer = require('wavesurfer.js');  //Importa biblioteca de visualização de ondas e espectro
var path = require('path');                 //Importa sistema de arquivos

var args = ipcRenderer.sendSync('fromMain', ""); //[Array] faz uma chamada ao evento do processo principal para obter o diretorio geral e sua lista de arquivos  
var path_dir = args[0];                          //[String] caminho do diretorio geral
var list_files = args[1];                        //[Array] caminho de todos os arquivos do diretorio princial
delete args

function unitAjustSize(fileSizeInBytes){
    /* Esta função recebe um numero inteiro que representa uma 
     * escala de bytes e transforma em escalas maiores caso necessario
     * <ATRIBUTOS>
     *      fileSizeInBytes: [inteiro] Tamnho dos arquivos em bytes   
     * <RETORNO>
     *      [inteiro] Tamnho dos arquivos em escala maior
    */
    if (fileSizeInBytes < 1048576) return (fileSizeInBytes / 1024).toFixed(0) + " KB";             //Kilobytes
    else if (fileSizeInBytes < 1073741824) return (fileSizeInBytes / 1048576).toFixed(0) + " MB";  //Megabytes
    else return (fileSizeInBytes / 1073741824).toFixed(0) + " GB";                                 //Gigabytes
}

function unitAjustTemp(tempTotal){
    /* Esta função recebe um numero inteiro que representa a duração
     * de tempo em segundos e transforma para o formato HH:MM:SS
     * <ATRIBUTOS>
     *      tempTotal: [inteiro] Duração em segundos   
     * <RETORNO>
     *      [String] Horas:Minutos:Segundos
    */
    var hours = Math.floor(tempTotal / (60 * 60));      //quantas horas inteira há na quantidade de segundos total

    var divisor_for_minutes = tempTotal % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60); //quantos minutos inteiro há na quantidade de segundos fora as horas

    var divisor_for_seconds = divisor_for_minutes % 60;
    var seconds = Math.ceil(divisor_for_seconds);       //quantos segundos restantes fora as horas e os minutos

    return hours +":"+ minutes +":"+seconds
}

async function getDurationTrack(track, id){
    /* Esta função recebe um numero inteiro que representa a duração
     * de tempo em segundos de uma determinada faixa e transforma 
     * para o formato mm:ss
     * <ATRIBUTOS>
     *      track: [String] caminho do arquivo
     *      id:    [String] identificador no formulario infopage.html   
     * <RETORNO>
     *      [null]
    */
    let metadata = await mm.parseFile(track);           //obtem os metadados do uma arquivo de audio
    let secs = metadata.format.duration;                //extrai a duração total em segundos dos metadados

    var divisor_for_minutes = secs % (60 * 60);
    var minutes = Math.floor(divisor_for_minutes / 60); //obtem os minutos inteiros

    var divisor_for_seconds = divisor_for_minutes % 60; 
    var seconds = Math.ceil(divisor_for_seconds);       //obtem os segundos inteiro fora os minutos

    $(id).text(minutes+":"+seconds)                     //Atualiza o texto no fomulario html via JQuery
}

async function getMetadata(list_files){
    /* Esta função recebe um array de caminhos e retorna os valores
     * totais de duração, armazenamentos e taxa de atualização
     * <ATRIBUTOS>
     *      list_files: [Array] caminho do arquivo  
     * <RETORNO>
     *      [Array]
    */
    //variaveis auxiliares
    var count = 0;
    var perc = 0;
    //armazena os volores totais
    var tempTotal = 0;
    var fileSizeInBytes = 0
    var samplerate = 0
    
    for (const element of list_files) {
        var stats = fs.statSync(element)
        fileSizeInBytes += stats["size"]            //obtem o tamanho do arquivo
        let metadata = await mm.parseFile(element); 
        samplerate += metadata.format.sampleRate    //obtem a taxa de atualização do audio
        tempTotal += metadata.format.duration       //obtem a duração do audio em segundos

        count += 1;

        perc = parseInt(count/list_files.length*100)                            //determina a porcentagem de arquivos processados
        $('.progress-bar').css('width', perc+'%').attr('aria-valuenow', perc);  //incrementa a barra de progresso no fomulario html
    }
    
    return [tempTotal, fileSizeInBytes, samplerate]
}

async function chanegValues(){
    /* Esta função atualiza os valores no formulario HTML
     * <ATRIBUTOS>
     *      [null]  
     * <RETORNO>
     *      [null]
    */
    $("#Progress").modal('show');                                               //Mostra um modal com a barra de progresso dos dados via JQuery
    let total_args = await getMetadata(list_files);                             //[Array] Tempo, armazenamento e taxa de atualização total
    let formato = "WAV";                                                        //[String] Formato dos arquivos (Atualmente apenas aquuivos WAV são aceitos)
    let quantidade = list_files.length.toString();                              //[String] Quantidade de audios
    let tempTotal = unitAjustTemp(total_args[0]).toString();                    //[String] Tempo total ajustado para HH:mm:ss
    let tamTotal = unitAjustSize(total_args[1]).toString();                     //[String] Tamanho total da base
    let tempMedio = unitAjustTemp(total_args[0]/list_files.length).toString()   //[String] Duração media dos audios
    
    //COMANDOS JQuery PARA ATUALIZAÇÃO DO FORMULARIO HTML
    $("#formato").text(formato);
    $("#quantidade").text(quantidade);
    $("#tamTotal").text(tamTotal);
    $("#tempMedio").text(tempMedio);
    $("#tempTotal").text(tempTotal);
    
    $("#Progress").modal('hide');   //Ao fim do processo modal de progresso é ocultado
}

//ICONES DE PLAY E PAUSE
var pause_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-pause-fill" viewBox="0 0 15 15"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>';
var play_icon = '<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-play-fill" viewBox="0 0 15 15"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>';

var currentTrack = 0;   //[Inteiro] Indice da faixa a ser carregada

function player(links){
    /* Esta função produz um player de audio dado um array de caminhos
     * <ATRIBUTOS>
     *      links: [Array] caminhos dos arquivo  
     * <RETORNO>
     *      [null]
    */
    currentTrack = 0
    // CARREGA UMA FAIXA DADOS UM INDICE ATUAL
    let setCurrentSong = function(index) {
        links[currentTrack].classList.remove('active');
        links[currentTrack].childNodes[1].innerHTML = play_icon;
        currentTrack = index;
        links[currentTrack].classList.add('active');
        links[currentTrack].childNodes[1].innerHTML = pause_icon;
        wavesurfer.load(links[currentTrack].attributes.href.nodeValue);
    };

    // CARREGA UM AUDIO DADO EVENTO DE CLICK
    Array.prototype.forEach.call(links, function(link, index) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            if (links[index].classList.contains('active')) {            
                //CASO O AUDIO DE ESTEJA CARREGADO É FEITO APENAS UM GERENCIAMENTO DE PLAY E PAUSE
                if (links[index].classList.contains('pause')) {
                    wavesurfer.play();
                    links[index].childNodes[1].innerHTML = pause_icon;
                    links[index].classList.remove('pause');
                } else {
                    wavesurfer.pause();
                    links[index].childNodes[1].innerHTML = play_icon;
                    links[index].classList.add('pause');
                }   
            } else {
                //CASO O AUDIO AINDA NAO ESTEJA CARREGADO
                setCurrentSong(index);
            }
        });
    });
}

var wavesurfer  //[Object] Instancia gerenciamento de audio

window.onload = function () {
    chanegValues(); //executa ao iniciar a pagina
}

document.getElementById("btnVoltar").addEventListener("click", function(){ 
    window.location.replace("../html/home.html"); //volta para a pagina inicial ao clicar no botao
});

document.addEventListener('DOMContentLoaded', function() {
    //instacia o objeto de vizualização ao carregar a pagina
    wavesurfer = WaveSurfer.create({
        container: '#waveform',
        waveColor: '#4ACA4E',
        progressColor: '#765FC9',
        height: 100
    });
});

document.addEventListener('DOMContentLoaded', function() {
    let naudio = 9;                                      //[Inteiro] Define a quantidade de audio aparecerar por vez em uma pagina

    let beg_pos = 0;                                     //[Inteiro] Indice do primeiro audio na pagina em relação a lista de todos oa audios
    let end_pos;                                         //[Inteiro] Indice do ultimo audio na pagina em relação a lista de todos oa audios

    let playlist = document.getElementById('playlist');  //[Objeto] Carrega o elemento de visualização da playlist
    let npage = document.getElementsByClassName('npage');//[Objeto] Carrega o elemento de posição na paginação

    let currentPage = 1;                                 //[Inteiro] pagina atual
    let lastPage = Math.ceil(list_files.length/naudio);  //[Inteiro] numero total de paginas

    npage[0].innerHTML = currentPage+"/"+lastPage;       //Define o valor da pagina atual no formulario
    
    if (list_files.length > naudio) {
        //Checa de o total de arquivos e inferior ao limite de exibição por vez
        end_pos = naudio;
        for (let index = 0; index < naudio; index++) {
            //Produz os containers de exibição da playlist
            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            '</div> <div class="col-9" id="nome">'+
            path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
            
            getDurationTrack(list_files[index], ".duracao"+index);  //obtem duração de cada faixa
        }
    } else {
        end_pos = list_files.length;
        for (let index = 0; index < list_files.length; index++) {
            //Produz os containers de exibição da playlist
            $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
            index+' href='+list_files[index]+
            '> <div class="col-1" id="icone">'+
            play_icon+
            ' </div> <div class="col-9" id="nome">'
            +path.parse(list_files[index]).name+
            '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');

            getDurationTrack(list_files[index], ".duracao"+index);  //obtem duração de cada faixa
        }
    }

    let links = document.querySelectorAll('.audio'); //[Array] obtem os cominhos de cada container de audio em exibição

    player(links);  //inicia o player

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

    let prev = document.getElementById("prev")      //Elemento de paginação voltar
    prev.addEventListener('click', function(e) {
        if (currentPage > 1) {
            //Caso nao seja a pagina inicial
            currentPage -= 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            
            //Define o range de exibição
            end_pos = beg_pos;
            if ((beg_pos - naudio) >= 0) {
                beg_pos -= naudio;
            } else {
                beg_pos = 0;
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)   //[Array] Lista de caminhos dos audios de exibição

            for (let index = 0; index < currentAudio.length; index++) {
                //Carrega os elementos dos novos audios
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index); //obtem duração de cada faixa
            }
        }
        links = document.querySelectorAll('.audio');    //[Array] Lista de audio em exibição
        player(links);                                  //inicia o player
    });

    let next = document.getElementById("next")      //Elemento de paginação avançar
    next.addEventListener('click', function(e) {
        if (currentPage < lastPage) {
            //Caso nao seja a pagina Final
            currentPage += 1; 
            npage[0].innerHTML = currentPage+"/"+lastPage;
            playlist.innerHTML = '';
            
            //Define o range de exibição
            beg_pos = end_pos;
            if (end_pos+naudio < list_files.length) {
                end_pos += naudio;
            } else {
                end_pos = list_files.length
            }

            let currentAudio = list_files.slice(beg_pos, end_pos)   //[Array] Lista de caminhos dos audios de exibição

            for (let index = 0; index < currentAudio.length; index++) {
                 //Carrega os elementos dos novos audios
                $('#playlist').append('<div class="list-group-item list-group-item-action audio d-flex" id=audio'+
                index+' href='+currentAudio[index]+
                '> <div class="col-1" id="icone">'+
                play_icon+
                '</div> <div class="col-9" id="nome">'+
                path.parse(currentAudio[index]).name+
                '</div><div id="duracao" class="col-2 duracao'+index+'"></div></div>');
    
                getDurationTrack(currentAudio[index], ".duracao"+index); //obtem duração de cada faixa
            }
            links = document.querySelectorAll('.audio');    //[Array] Lista de audio em exibição
            player(links);                                  //inicia o player
        }
  
    });

    let avancar = document.getElementById("avancar");
    avancar.addEventListener('click', function(e) {
        //Avança para a proxima pagina
        window.location.replace("../html/fragpage.html");
    });
});
