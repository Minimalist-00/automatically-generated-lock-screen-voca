export const playTTS = (text: string, rate: number = 1.0) => {
  if (!window.speechSynthesis) {
    console.warn("Web Speech API is not supported in this browser.");
    return;
  }
  
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US'; // Default to US English
  utterance.rate = rate;

  // Try to find a good native English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
  
  // Prefer specific high-quality voices if available (macOS/Chrome/iOS defaults)
  const preferredVoice = englishVoices.find(voice => 
    voice.name.includes('Samantha') || // macOS/iOS good voice
    voice.name.includes('Google US English') || // Chrome good voice
    voice.name.includes('Alex')
  ) || englishVoices[0]; // fallback to first English voice

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
};
