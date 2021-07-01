//Autor: Arthur Serra
/*  ========================== Loadpage.js ================================
 *  Este script nada mais e que uma barra de progesso do processo de fragmentacao
 *  ===================================================================
*/
const{ ipcRenderer } = require('electron');     //Importa funcao de comunicacao com o processo principal
var $ = jQuery = require('jquery');             //Importa comandos JQuery
var path = require('path');                     //Importa sistema de arquivos
const glob = require('glob').Glob;              //Importa sistema de arquivos
const fs = require('fs');                       //Importa sistema de arquivos
const {PythonShell} = require('python-shell');  //Importa biblioteca de integracao com script Python

var args = ipcRenderer.sendSync('fromMain', ""); //[Array] faz uma chamada ao evento do processo principal para obter o diretorio geral e sua lista de arquivos  
var path_dir = args[0];                          //[String] caminho do diretorio geral
var list_files = args[1];                        //[Array] caminho de todos os arquivos do diretorio princial
delete args

var frag_args = ipcRenderer.sendSync('argsfromMain', "");   //[Array] faz uma chamada ao evento do processo principal para obter os parametros de fragmentacao  
var dest_files = frag_args[2]+'/Audios'                     //[String] Complemento do diretorio de armazenamento dos audio fragmentados

async function run(){
    /* Esta funcao recebe executa o processo de fragmentacao python de forma assincrona
     * <ATRIBUTOS>
     *      [null]   
     * <RETORNO>
     *      [null]
    */
    const { success, err = '', results } = await new Promise(
        (resolve, reject) =>{
            //gera promessa de resolucao

            //Dicionario de argumentos para execucao do script Python 
            let options = {
                scriptPath: path.join(__dirname, '../py/'),     //[String] caminho do diretorio de armazenamento do script
                args: frag_args                                 //[Array] argumento de execucao
            };
            
            PythonShell.run('fragment_audio.py', options, function (err, results) {
                if (err){
                    //Caso um erro seja gerado na chamada
                    reject({ success: false, err });
                }
                if (results[0] == "False") {
                    //Caso um erro tenha ocorrido na execucao do script
                    $("#Error").modal('show');      //Ativa modal de erro via JQuery
                }
                resolve({ success: true, results });
              });
        }
    );
}

document.addEventListener('DOMContentLoaded', function() {
    //Quando o documento for carregado
    run();

    //CONTADORES AUXILIARES
    var frag_audio = 0;                                 //[Inteiro] Quantidade de audios processados
    var perc = 0;                                       //[Inteiro] Percentual de audios processados
    let aux_perc = perc;                                

    let att_perc = document.getElementById("perc");     //Elemento com o valor da porcentagem de audio processado 

    let delay = 1000; // 1 segundo                      //[Inteiro] Define o delay em milissegundos do processo de atualizacao de progresso

    let avancar = document.getElementById("avancar");   //Elemento do botao de avanco
    let voltar = document.getElementById("voltar");     //Elemento do botao de voltar

    var iID = setInterval(function(){
                                    /*A cada intervalo de 1 segundo esta funcao e executada
                                    */
                                    if (frag_audio >= list_files.length) {
                                        //Caso o botao a quantidade de audio processados seja igual a quantidade de arquivos enviados
                                        avancar.disabled = false;   //Habilita o botal de avanco
                                        clearInterval(iID);         //Encerra o loop de checagem
                                    }else{
                                        //Valida a existencia do arquivo de destino
                                        if (fs.existsSync(dest_files)) {
                                            let files = fs.readdirSync(dest_files);             //[Array] caminhos dos arquivos processados 
                                            frag_audio = files.length;                          //[Inteiro] quantidade de arquivos processados 
                                            perc = parseInt(frag_audio/list_files.length*100)   //[Inteiro] percentual de arquivos processados
                                             
                                            if (aux_perc < perc){
                                                //Condicao para evitar escrita de valores repetido no formulario HTML
                                                att_perc.innerHTML = perc+"%"                                           //Atualiza o valor do percentual no formulario
                                                $('.progress-bar').css('width', perc+'%').attr('aria-valuenow', perc);  //Atualiza a barra de progresso via JQuery
                                                aux_perc = perc;
                                            }
                                        }
                                    }
                },delay);

    avancar.addEventListener('click', function(){
        //Evento ativado ao clicar no botao avancar
        glob(dest_files +'/*.wav', {}, (err, files)=>{
            ipcRenderer.send('destToMain', files);                  //Envia ao script principal a lista de arquivos processados
            window.location.replace("../html/playlistpage.html");   //Redireciona a pagina para playlistpage.html
        })
    });

    voltar.addEventListener("click", function(){
        //Evento ativado ao clicar no botao voltar
        window.location.replace("../html/fragpage.html");           //Redireciona a pagina para fragpage.html
    });
    
});



