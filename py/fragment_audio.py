from glob import glob
import os
import numpy as np
import soundfile as sf
import tensorflow as tf

def audio_to_spectrogram(path, rate=16000, duration = 30, frame_length=256, fft_length=255, stride=64, fmin=0, fmax=8000):
    """
    Esta função recebe um audio como entrada e retorna o espectrograma equivalente do mesmo em um tensor. 
    Os valores adotados como padrão nos argumentos resultado em um tensor com dimensão de frequencia igual a 128.
    Recomenda-se utilizar frame_lenght uma potencia de 2, assim para o stride quando para o FFT_length.
    Para esses valores default o fft_length = frame_length - 1 para manter o numero de frequencias pares. 

    [ARGS]
        rate: Numero de quadros por segundo do audio
        duration: Duração do audio em segundos
        frame_length: Largura da janela que percorrera o audio
        fft_length: tamanho do FFT para cada janela 
        stride: tamanho dos saltos
        fmin: frequencia minima
        fmax: frequencia maxima
    [RETUNR]
        tensor format [Time, Frequence]
    """
    if os.path.isfile(path):
        raw_audio = tf.io.read_file(path)
        audio_tensor = tf.audio.decode_wav(raw_audio, desired_channels=1, desired_samples=rate*duration)
        audio_tensor = tf.squeeze(audio_tensor.audio.numpy(), axis=[-1])
        spectrogram = tf.math.abs(tf.signal.stft(audio_tensor, 
                                frame_length=frame_length, 
                                frame_step=stride, 
                                fft_length=fft_length, 
                                window_fn=tf.signal.hann_window, 
                                pad_end=True))
    else:
        spectrogram = None
        
    return spectrogram

def griffin_lim(S, frame_length=256, fft_length=255, stride=64):
    '''
    Esta função recebe tensor contendo um spectrograma e efetua a tranformada inversa através do algoritmo Griffin-Lim.
    Extremamente importante que os argumentos frame_length, fft_length e stride sejam extamente iguais aos mesmos no processo de codificação do espetrograma
    TensorFlow implementation of Griffin-Lim Based on https://github.com/Kyubyong/tensorflow-exercises/blob/master/Audio_Processing.ipynb

    [ARGS]
        frame_length: Largura da janela que percorrera o audio
        fft_length: tamanho do FFT para cada janela 
        stride: tamanho dos saltos
    [RETUNR]
        tensor format: waveform
    '''
    S = tf.expand_dims(S, 0)
    S_complex = tf.identity(tf.cast(S, dtype=tf.complex64))
    y = tf.signal.inverse_stft(S_complex, frame_length, stride, fft_length=fft_length)
    for i in range(100):
        est = tf.signal.stft(y, frame_length, stride, fft_length=fft_length)
        angles = est / tf.cast(tf.maximum(1e-16, tf.abs(est)), tf.complex64)
        y = tf.signal.inverse_stft(S_complex * angles, frame_length, stride, fft_length=fft_length)
    waveform = tf.squeeze(y, 0)
    
    return waveform

def fragment_spectrogram(audio_dir, save_dir, frag_range = [0.1, 0.7], rate=16000, duration=30 ,frame_length=256, fft_length=255, stride=64, subtype='PCM_16'):
    '''
    Esta função recebe o path da base de audio WAV produz a fragmentação e salva os audio novos num path tambem informado.
    Esse processo sem auxilio de GPU pode levar algum tempo.
    Recomendo presevar os demais paramentros exceto rate e duracao
    [ARGS]
        audio_dir: diretorio onde os audio WAV estao armazenados
        save_dir: Diretorio onde serao salvos os novos audios
        frag_range: tupla de porcetagem de valores limites para os cortes
        rate: Numero de quadros por segundo do audio
        duration: Duração do audio em segundos
        frame_length: Largura da janela que percorrera o audio
        fft_length: tamanho do FFT para cada janela 
        stride: tamanho dos saltos
    [RETUNR]
        tensor format: waveform
    '''
    
    cortes = [] #lista de proporcao de cortes
    data_spec = None
    i_patch = 0

    audio_paths = glob(audio_dir+"**/*.wav") #lista de paths de audios

    if os.path.isdir(save_dir):
        for i in audio_paths:
            #transforma o audio em um espectrograma
            spec = audio_to_spectrogram(i, rate=rate, duration=duration, frame_length=frame_length, fft_length=fft_length, stride=stride)

            #expande a dimensao do tensor
            spec = tf.expand_dims(spec, axis=0)
            
            #salva valores das dimensoes iniciais do spectrograma
            n_times = spec.get_shape().as_list()[1]
            n_freq = spec.get_shape().as_list()[2]
            
            #variavel de armazenamento auxiliar
            data_spec = None

            if len(cortes) == 0:
                frag_min = int(frag_range[0] * n_freq)
                frag_max = int(frag_range[1] * n_freq)
                n_patch = len(audio_paths) * (n_times//n_freq)

                cortes = np.random.randint(frag_min, frag_max, size=n_patch)

            ini = 0
            end = ini+n_freq

            #processo de janelamento
            while end < n_times:
                if data_spec == None:
                    data_spec = spec[:,ini:end,:]
                else:
                    data_spec = tf.concat([data_spec, spec[:,ini:end,:]], 0)
                ini = end
                end = ini+n_freq
            
            #aplicando fragmentação
            data_spec = data_spec.numpy()
            for k in range(data_spec.shape[0]):
                time_cortes = np.random.permutation(np.arange(n_freq))[:cortes[i_patch]]
                data_spec[k, time_cortes, :] = 0.0
                i_patch += 1
            data_spec = np.reshape(data_spec, (n_times-(n_times%n_freq), n_freq))
            
            #transformando spectrograma para onda
            wave = griffin_lim(data_spec, frame_length=frame_length, fft_length=fft_length, stride=stride)
            
            #salva audio fragmentado
            sf.write(save_dir+'/'+os.path.basename(i), wave, rate, subtype=subtype)
        return True
    return False