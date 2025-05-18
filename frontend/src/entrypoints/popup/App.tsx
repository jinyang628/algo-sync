import { useRef, useState } from 'react';

import { Mic, MicOff } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function VoiceRecorder() {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [timer, setTimer] = useState<string>('00:00');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      let seconds = 0;
      setTimer('00:00');
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        clearInterval(intervalRef.current);
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `voice_${Date.now()}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      };

      recorder.start();
      setIsRecording(true);
      intervalRef.current = window.setInterval(() => {
        seconds++;
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        setTimer(`${m}:${s}`);
      }, 1000);
    } catch (err: any) {
      alert(
        err.name === 'NotAllowedError'
          ? 'Please manually enable microphone access.\n\nGo to chrome://extensions.\nFind this extension and click "Details".\nScroll down to "Site settings" and click it.\nSet microphone to "Allow"'
          : `Error: ${err.message}`,
      );
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop(); // triggers onstop handler
    }
  };

  return (
    <div className="flex h-[200px] w-[200px] flex-col items-center justify-center space-y-3 p-4">
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
    </div>
  );
}
