import { MessageList } from './MessageList';
import { RecordButton } from './RecordButton';
import type { RecorderState } from '../hooks/useRecorder';
import type { InterviewStatus, Message } from '../types/interview';
import './InterviewChat.css';

export interface InterviewChatProps {
  status: InterviewStatus;
  sessionId: string;
  messages: Message[];
  canRecord: boolean;
  recorderState: RecorderState;
  recorderError?: string | null;
  onStartRecording: () => void;
  onStopAndSave: () => void;
}

export function InterviewChat({
  status,
  sessionId,
  messages,
  canRecord,
  recorderState,
  recorderError,
  onStartRecording,
  onStopAndSave,
}: InterviewChatProps) {
  const inProgress = status === 'in_progress';

  return (
    <section className="interview-chat" aria-label="Interview conversation">
      {inProgress ? (
        <p className="interview-chat__state" role="status">
          Interview in progress
        </p>
      ) : null}

      <MessageList messages={messages} sessionId={sessionId} />

      {canRecord ? (
        <RecordButton
          state={recorderState}
          onStart={onStartRecording}
          onStopSave={onStopAndSave}
          error={recorderError}
        />
      ) : null}
    </section>
  );
}
