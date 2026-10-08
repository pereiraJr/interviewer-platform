import './ConsentBanner.css';

export interface ConsentBannerProps {
  notice: string;
  onAccept: () => void;
  onDecline: () => void;
  busy?: boolean;
}

export function ConsentBanner({
  notice,
  onAccept,
  onDecline,
  busy = false,
}: ConsentBannerProps) {
  return (
    <section className="consent-banner" role="region" aria-label="Recording consent">
      <p className="consent-banner__notice">{notice}</p>
      <div className="consent-banner__actions">
        <button
          type="button"
          className="consent-banner__accept"
          onClick={onAccept}
          disabled={busy}
        >
          Accept
        </button>
        <button
          type="button"
          className="consent-banner__decline"
          onClick={onDecline}
          disabled={busy}
        >
          Decline
        </button>
      </div>
    </section>
  );
}
