import unittest
import fragment_audio as fa

class Test(unittest.TestCase):
    def test_audio_to_spec(self):
        """
        Teste de transformacao de audio para espectrograma
        """
        result = type(fa.audio_to_spectrogram("D:/arthu/Documents/PFP_Gen_Audio_Dataset/PFP_Gen_Audio_Dataset/assets/frag_temp.wav")).__name__
        self.assertEqual(result, 'EagerTensor')
    
    def test_spec_to_audio(self):
        """
        Teste de transformacao de espectrograma para audio
        """
        result = type(fa.griffin_lim(fa.audio_to_spectrogram("D:/arthu/Documents/PFP_Gen_Audio_Dataset/PFP_Gen_Audio_Dataset/assets/frag_temp.wav"))).__name__
        self.assertEqual(result, 'EagerTensor')
    
    def test_audio_preview(self):
        """
        Teste função de preview
        """
        result = fa.Preview_fragment_spectrogram("D:/arthu/Documents/PFP_Gen_Audio_Dataset/PFP_Gen_Audio_Dataset/assets/frag_temp.wav","D:/arthu/Documents/PFP_Gen_Audio_Dataset/PFP_Gen_Audio_Dataset/assets/")
        self.assertEqual(result, True)
    
    def test_audio_fragmentation(self):
        """
        Teste função de fragmentacao
        """
        result = fa.fragment_spectrogram("D:/arthu/Documents/PFP_Gen_Audio_Dataset/PFP_Gen_Audio_Dataset/assets/","D:/arthu/Documents/Save/")
        self.assertEqual(result, True)

if __name__ == '__main__':
    unittest.main()