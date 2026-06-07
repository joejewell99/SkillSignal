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
    throw new Error(data?.message ?? 'Request failed');
  }

  return data;
}
