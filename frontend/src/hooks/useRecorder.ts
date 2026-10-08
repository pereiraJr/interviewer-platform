import { useCallback, useRef, useState } from 'react';

export type RecorderState = 'idle' | 'recording' | 'saving' | 'error';

export const MAX_RECORDING_MS = 120_000;

export interface UseRecorderResult {
  state: RecorderState;
  error: string | null;
  start: () => Promise<void>;
  stopAndSave: () => void;
}

export type SaveRecording = (blob: Blob, durationMs: number) => Promise<void> | void;

export function useRecorder(onSave: SaveRecording): UseRecorderResult {
  const [state, setState] = useState<RecorderState>('idle');
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const durationMs = Date.now() - startedAtRef.current;
        const type = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        releaseStream();
        setState('saving');

        Promise.resolve(onSave(blob, durationMs))
          .then(() => {
            setState('idle');
          })
          .catch(() => {
            setError('We could not save your recording. Please try again.');
            setState('error');
          });
      };

      streamRef.current = stream;
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start();
      setState('recording');
    } catch {
      setError('Microphone access is required to record your answer.');
      setState('error');
    }
  }, [onSave, releaseStream]);

  const stopAndSave = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
  }, []);

  return { state, error, start, stopAndSave };
}
