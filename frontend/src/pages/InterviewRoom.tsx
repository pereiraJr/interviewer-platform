import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConsentBanner } from '../components/ConsentBanner';
import { InterviewChat } from '../components/InterviewChat';
import { StatusMessage } from '../components/StatusMessage';
import {
  InterviewsApiError,
  recordConsent,
  startOrResumeInterview,
} from '../services/interviewsApi';
import type { ConsentDecision, InterviewSession } from '../types/interview';
import './InterviewRoom.css';

type LoadState = 'loading' | 'error' | 'ready';

export function InterviewRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>('loading');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/', { replace: true });
      return;
    }

    let active = true;
    setState('loading');

    startOrResumeInterview(id)
      .then((result) => {
        if (!active) {
          return;
        }
        setSession(result);
        setState('ready');
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }
        if (error instanceof InterviewsApiError && error.status === 404) {
          navigate('/', { replace: true });
          return;
        }
        setState('error');
      });

    return () => {
      active = false;
    };
  }, [id, attempt, navigate]);

  const handleDecision = useCallback(
    (decision: ConsentDecision) => {
      if (!session) {
        return;
      }

      setSubmitting(true);
      recordConsent(session.id, decision)
        .then((updated) => {
          if (decision === 'declined') {
            navigate('/', { replace: true });
            return;
          }
          setSession(updated);
        })
        .catch(() => {
          navigate('/', { replace: true });
        })
        .finally(() => {
          setSubmitting(false);
        });
    },
    [session, navigate],
  );

  if (state === 'loading') {
    return (
      <StatusMessage variant="loading">
        <p>Entering the interview room…</p>
      </StatusMessage>
    );
  }

  if (state === 'error' || !session) {
    return (
      <StatusMessage variant="error">
        <p>We couldn&apos;t open the interview room.</p>
        <button type="button" onClick={() => setAttempt((value) => value + 1)}>
          Retry
        </button>
      </StatusMessage>
    );
  }

  const showConsent = session.status === 'consent_pending';

  return (
    <section className="interview-room">
      <header className="interview-room__header">
        <p className="interview-room__eyebrow">Interview Room</p>
        <h2 className="interview-room__role">{session.job.title}</h2>
        <p className="interview-room__description">{session.job.description}</p>
      </header>

      {showConsent ? (
        <ConsentBanner
          notice={session.notice.text}
          onAccept={() => handleDecision('accepted')}
          onDecline={() => handleDecision('declined')}
          busy={submitting}
        />
      ) : null}

      <InterviewChat status={session.status} />
    </section>
  );
}
