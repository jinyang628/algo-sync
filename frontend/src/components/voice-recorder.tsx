import { useCallback, useEffect, useRef, useState } from 'react';

import { Mic, MicOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onRecordingComplete: (audioFile: File) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timer, setTimer] = useState<string>('00:00');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | number>(0);

  const handleDataAvailable = useCallback((event: BlobEvent) => {
    if (event.data.size > 0) {
      chunksRef.current.push(event.data);
    }
  }, []);

  // Memoized handler for stop event
  const handleStop = useCallback(() => {
    // Clear timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current as number);
      intervalRef.current = 0;
    }

    setIsRecording(false);
    setTimer('00:00');

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (chunksRef.current.length === 0) {
      console.warn('No data recorded.');
      
return;
    }

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
    const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
      type: 'audio/webm',
    });

    onRecordingComplete(audioFile);

    chunksRef.current = [];
    recorderRef.current = null;
  }, [onRecordingComplete]);

  const startRecording = async () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    chunksRef.current = [];
    if (intervalRef.current) {
      clearInterval(intervalRef.current as number);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const options = { mimeType: 'audio/webm' };

      const recorder = new MediaRecorder(stream, options);
      recorderRef.current = recorder;

      recorder.addEventListener('dataavailable', handleDataAvailable);
      recorder.addEventListener('stop', handleStop);

      recorder.start();
      setIsRecording(true);

      let seconds = 0;
      setTimer('00:00');
      intervalRef.current = setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        setTimer(`${m}:${s}`);
      }, 1000);
    } catch (err: any) {
      setIsRecording(false);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      alert(
        err.name === 'NotAllowedError'
          ? 'Please manually enable microphone access.\n\nGo to chrome://extensions.\nFind this extension and click "Details".\nScroll down to "Site settings" and click it.\nSet microphone to "Allow"'
          : `Error: ${err.message}`,
      );
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state === 'recording') {
      recorderRef.current.stop();
    }
  };

  useEffect(() => {
    const currentRecorder = recorderRef.current;
    const currentStream = streamRef.current;
    const currentInterval = intervalRef.current;

    return () => {
      if (currentRecorder) {
        currentRecorder.removeEventListener('dataavailable', handleDataAvailable);
        currentRecorder.removeEventListener('stop', handleStop);
        if (currentRecorder.state === 'recording') {
          currentRecorder.stop();
        }
      }
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
      if (currentInterval) {
        clearInterval(currentInterval as number);
      }
    };
  }, [handleDataAvailable, handleStop]);

  return (
    <>
      <Button
        onClick={isRecording ? stopRecording : startRecording}
        variant={isRecording ? 'default' : 'outline'}
        className="rounded-full"
        size="lg"
      >
        {isRecording ? <MicOff /> : <Mic />}
      </Button>
      <div className="text-sm">
        {isRecording ? `Recording… ${timer}` : 'Click to start recording'}
      </div>
    </>
  );
}
