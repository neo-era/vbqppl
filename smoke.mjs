import { chromium } from 'playwright-core';

const EXE = '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';
const URL = 'http://localhost:4173/';

const browser = await chromium.launch({ executablePath: EXE, args: ['--no-sandbox'] });
const ctx = await browser.newContext({ serviceWorkers: 'allow' });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch((e) => errors.push('GOTO: ' + e.message));
await page.waitForTimeout(1500);

const title = await page.title();
const hasManifest = await page.$eval('link[rel="manifest"]', (el) => el.getAttribute('href')).catch(() => null);
const themeColor = await page.$eval('meta[name="theme-color"]', (el) => el.getAttribute('content')).catch(() => null);
const appleTitle = await page.$eval('meta[name="apple-mobile-web-app-title"]', (el) => el.getAttribute('content')).catch(() => null);
// auth screen rendered?
const authHeading = await page.locator('text=Kho Văn bản QPPL').first().isVisible().catch(() => false);
const hasEmail = await page.locator('input[type=email]').first().isVisible().catch(() => false);
const hasPw = await page.locator('input[type=password]').first().isVisible().catch(() => false);
// fetch manifest + validate
const man = await page.evaluate(async () => {
  try { const r = await fetch('/manifest.webmanifest'); return await r.json(); } catch (e) { return { error: String(e) }; }
});
// service worker registered?
const sw = await page.evaluate(async () => {
  if (!('serviceWorker' in navigator)) return 'no-sw-api';
  const reg = await navigator.serviceWorker.getRegistration();
  return reg ? 'registered' : 'none-yet';
});

// toggle theme test: click theme button not available pre-login; test dark default
const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

// mobile viewport: no horizontal overflow
await page.setViewportSize({ width: 360, height: 780 });
await page.waitForTimeout(400);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

await page.screenshot({ path: 'smoke-auth.png', fullPage: false });

console.log(JSON.stringify({
  title, hasManifest, themeColor, appleTitle, authHeading, hasEmail, hasPw,
  manifestName: man?.name, manifestIcons: (man?.icons || []).map((i) => `${i.sizes}${i.purpose ? ' ' + i.purpose : ''}`),
  manifestDisplay: man?.display, manifestStartUrl: man?.start_url,
  serviceWorker: sw, theme, mobileHorizontalOverflow: overflow,
  consoleErrors: errors,
}, null, 2));

await browser.close();
