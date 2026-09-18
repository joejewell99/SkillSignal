import { writeFile } from 'node:fs/promises';

const port = process.argv[2] ?? '9223';
const width = Number(process.argv[3] ?? 390);
const height = Number(process.argv[4] ?? 844);
const targetUrl = process.argv[5];
const screenshotPath = process.argv[6];
const pages = await fetch(`http://localhost:${port}/json`).then((response) => response.json());
const page = pages.find((candidate) => candidate.type === 'page');

if (!page) {
  throw new Error(`No browser page is available on debugging port ${port}.`);
}

const socket = new WebSocket(page.webSocketDebuggerUrl);
const expression = `JSON.stringify({
  url: location.href,
  innerWidth,
  clientWidth: document.documentElement.clientWidth,
  scrollWidth: document.documentElement.scrollWidth,
  bodyWidth: document.body.scrollWidth,
  landmarks: ['.public-page', '.try-it-out-section', '.try-it-out-shell', '.match-discovery-stage', '.match-discovery-hero']
    .map((selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      const styles = getComputedStyle(element);
      return {
        selector,
        left: Math.round(bounds.left),
        right: Math.round(bounds.right),
        width: Math.round(bounds.width),
        minWidth: styles.minWidth,
        paddingLeft: styles.paddingLeft,
        paddingRight: styles.paddingRight,
        gridTemplateColumns: styles.gridTemplateColumns,
      };
    })
    .filter(Boolean),
  overflow: [...document.querySelectorAll('*')]
    .map((element) => {
      const bounds = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        className: typeof element.className === 'string' ? element.className : '',
        left: Math.round(bounds.left),
        right: Math.round(bounds.right),
        width: Math.round(bounds.width),
      };
    })
    .filter((element) => element.left < 0 || element.right > document.documentElement.clientWidth)
    .slice(0, 40),
})`;

socket.addEventListener('open', () => {
  socket.send(JSON.stringify({
    id: 1,
    method: 'Emulation.setDeviceMetricsOverride',
    params: { width, height, deviceScaleFactor: 1, mobile: false },
  }));
});

socket.addEventListener('message', async (event) => {
  const message = JSON.parse(event.data);
  if (message.id === 1) {
    if (targetUrl) {
      socket.send(JSON.stringify({ id: 2, method: 'Page.navigate', params: { url: targetUrl } }));
      return;
    }

    socket.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true },
    }));
    return;
  }

  if (message.id === 2) {
    setTimeout(() => socket.send(JSON.stringify({
      id: 3,
      method: 'Runtime.evaluate',
      params: { expression, returnByValue: true },
    })), 1000);
    return;
  }

  if (message.id === 4) {
    await writeFile(screenshotPath, Buffer.from(message.result.data, 'base64'));
    socket.close();
    return;
  }

  if (message.id !== 3) {
    return;
  }

  const result = JSON.parse(message.result.result.value);
  console.log(JSON.stringify(result, null, 2));
  if (screenshotPath) {
    socket.send(JSON.stringify({
      id: 4,
      method: 'Page.captureScreenshot',
      params: { format: 'png', fromSurface: true },
    }));
    return;
  }

  socket.close();
});
