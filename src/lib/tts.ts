// Global audio instance to allow cancelling previous speech
let currentAudio: HTMLAudioElement | null = null;

export const playTTS = async (text: string, rate: number = 1.0) => {
  // Cancel any ongoing speech
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      console.error('Failed to fetch TTS audio');
      return;
    }

    const data = await response.json();
    if (data.audioContent) {
      const audioSource = `data:audio/mp3;base64,${data.audioContent}`;
      currentAudio = new Audio(audioSource);
      
      // We can adjust playback rate if needed (though Google TTS handles some pacing itself)
      currentAudio.playbackRate = rate;
      
      await currentAudio.play();
    }
  } catch (error) {
    console.error('Error playing TTS:', error);
  }
};
