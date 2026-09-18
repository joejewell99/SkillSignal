import { useEffect, useState } from 'react';

export default function useMessageRateLimit() {
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [warningVisible, setWarningVisible] = useState(false);

  useEffect(() => {
    function receiveRateLimit(event) {
      const retryAfterSeconds = Number(event.detail?.retryAfterSeconds ?? 0);
      if (!Number.isFinite(retryAfterSeconds) || retryAfterSeconds <= 0) {
        return;
      }
      setCooldownSeconds((current) => Math.max(current, Math.ceil(retryAfterSeconds)));
      setWarningVisible(true);
    }

    function receiveWarning() {
      setWarningVisible(true);
    }

    window.addEventListener('skillsignal:message-rate-limited', receiveRateLimit);
    window.addEventListener('skillsignal:message-rate-warning', receiveWarning);
    return () => {
      window.removeEventListener('skillsignal:message-rate-limited', receiveRateLimit);
      window.removeEventListener('skillsignal:message-rate-warning', receiveWarning);
    };
  }, []);

  useEffect(() => {
    if (!warningVisible) {
      return undefined;
    }

    function dismissWarning(event) {
      if (event.key === 'Enter') {
        event.preventDefault();
        setWarningVisible(false);
      }
    }

    window.addEventListener('keydown', dismissWarning);
    return () => window.removeEventListener('keydown', dismissWarning);
  }, [warningVisible]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [cooldownSeconds]);

  return {
    cooldownSeconds,
    warningVisible,
    dismissWarning: () => setWarningVisible(false),
  };
}
