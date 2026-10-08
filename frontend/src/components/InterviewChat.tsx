import type { InterviewStatus } from '../types/interview';
import './InterviewChat.css';

export interface InterviewChatProps {
  status: InterviewStatus;
}

export function InterviewChat({ status }: InterviewChatProps) {
  const inProgress = status === 'in_progress';

  return (
    <section className="interview-chat" aria-label="Interview conversation">
      <ol className="interview-chat__turns" />
      <p className="interview-chat__empty">
        {inProgress
          ? 'The interview is in progress. Questions will appear here.'
          : 'The conversation will appear here once the interview begins.'}
      </p>
      {inProgress ? (
        <p className="interview-chat__state" role="status">
          Interview in progress
        </p>
      ) : null}
    </section>
  );
}
