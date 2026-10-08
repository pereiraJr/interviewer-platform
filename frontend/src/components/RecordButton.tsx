import type { RecorderState } from '../hooks/useRecorder';
import './RecordButton.css';

export interface RecordButtonProps {
  state: RecorderState;
  onStart: () => void;
  onStopSave: () => void;
  error?: string | null;
}

export function RecordButton({ state, onStart, onStopSave, error }: RecordButtonProps) {
  const recording = state === 'recording';
  const saving = state === 'saving';
  const label = saving ? 'Saving…' : recording ? 'Stop & Save' : state === 'error' ? 'Retry recording' : 'Record';
  const hint = saving
    ? 'Saving your answer…'
    : recording
      ? 'Recording… press Stop & Save when you are done.'
      : error ?? 'Press Record to answer.';

  return (
    <div className="record-button">
      <button
        type="button"
        className={`record-button__control record-button__control--${state}`}
        onClick={recording ? onStopSave : onStart}
        disabled={saving}
        aria-pressed={recording}
      >
        {label}
      </button>
      <p className="record-button__hint" role="status">
        {hint}
      </p>
    </div>
  );
}
