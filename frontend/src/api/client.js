const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

export async function apiRequest(path, { token, ...options } = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);
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
      throw new Error('Request timed out. Check that the Spring Boot backend is running on port 8080.');
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
