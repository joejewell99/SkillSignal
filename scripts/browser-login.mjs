const port = process.argv[2] ?? '9223';
const email = process.argv[3];
const password = process.argv[4];

if (!email || !password) {
  throw new Error('Usage: node scripts/browser-login.mjs <debug-port> <email> <password>');
}

const pages = await fetch(`http://localhost:${port}/json`).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === 'page');

if (!page) {
  throw new Error(`No browser page is available on debugging port ${port}.`);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const loginExpression = `(async () => {
  const response = await fetch('http://localhost:8080/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ${JSON.stringify(email)}, password: ${JSON.stringify(password)} }),
  });
  const auth = await response.json();
  if (!response.ok) throw new Error(auth.message ?? 'Login failed');
  await fetch('http://localhost:8080/api/auth/csrf', { credentials: 'include' });
  localStorage.setItem('skillsignal.auth', JSON.stringify({ ...auth, token: 'cookie' }));
  return { email: auth.email, role: auth.role };
})()`;

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: { expression: loginExpression, awaitPromise: true, returnByValue: true },
  }));
});

socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id !== 1) return;
  if (message.result.exceptionDetails) {
    console.error(message.result.exceptionDetails.exception?.description ?? 'Browser login failed.');
    process.exitCode = 1;
  } else {
    console.log(JSON.stringify(message.result.result.value));
  }
  socket.close();
});
