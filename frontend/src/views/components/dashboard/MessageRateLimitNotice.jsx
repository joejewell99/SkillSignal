import React from 'react';

function formatRemainingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function MessageRateLimitNotice({ cooldownSeconds, warningVisible, onDismiss }) {
  if (cooldownSeconds <= 0 && !warningVisible) {
    return null;
  }

  return (
    <section className="message-rate-limit-notice" role="alert" aria-live="assertive">
      <div>
        <strong>{cooldownSeconds > 0 ? 'Messaging paused' : 'Warning: slow down'}</strong>
        <p>
          {cooldownSeconds > 0
            ? 'You continued sending after the warning. Messaging is locked until the timer reaches zero.'
            : 'You are sending messages too quickly. The next message will lock messaging for 1 minute.'}
        </p>
      </div>
      {cooldownSeconds > 0 ? (
        <strong className="message-rate-limit-countdown" aria-label={`${cooldownSeconds} seconds remaining`}>
          {formatRemainingTime(cooldownSeconds)}
        </strong>
      ) : <span className="message-rate-limit-warning-label">Final warning</span>}
      {warningVisible ? (
        <button type="button" className="secondary-button" onClick={onDismiss}>
          Press Enter to continue
        </button>
      ) : null}
    </section>
  );
}
