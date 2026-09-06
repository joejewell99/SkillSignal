const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function apiRequest(path, { token, timeoutMs = 10000, ...options } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: options.signal ?? controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. The AI search may still be running, so try a shorter brief or run it again.');
    }
    throw new Error('Could not reach the SkillSignal API. Start the backend with mvn spring-boot:run.');
  } finally {
    clearTimeout(timeoutId);
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const statusMessages = {
      401: 'Your sign-in session has expired or is no longer valid. Please sign in again.',
      403: 'You do not have permission to perform this action.',
      429: 'Your AI allowance has been used. Please try again when it resets.',
      500: 'Something went wrong on the server. Please try again shortly.',
      503: 'This service is temporarily unavailable. Please try again shortly.',
    };
    const error = new Error(data?.message || statusMessages[response.status] || `The request could not be completed (${response.status}). Please try again.`);
    error.status = response.status;
    throw error;
  }

  return data;
}
