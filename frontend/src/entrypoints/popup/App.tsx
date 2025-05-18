import VoiceRecorder from '@/components/voice-recorder';

export default function App() {
  const [transcription, setTranscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAudioFile = async (audioFile: File) => {
    console.log('Audio file received:', audioFile);
    setIsLoading(true);
    setError(null);
    setTranscription(null);

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');

    try {
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OpenAI API Error:', data);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }

      console.log('Transcription:', data.text);
      setTranscription(data.text);
    } catch (err: any) {
      console.error('Error sending audio to OpenAI:', err);
      setError(err.message || 'Failed to transcribe audio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[200px] w-[200px] flex-col items-center justify-center space-y-3 p-4">
      <VoiceRecorder onRecordingComplete={handleAudioFile} />
    </div>
  );
}
