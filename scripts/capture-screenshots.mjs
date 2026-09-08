import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', 'public', 'showcase');
const BASE_URL = 'http://localhost:4028';

const shots = [
  { path: '/login', file: 'login.png', waitFor: 'form' },
  { path: '/', file: 'dashboard.png', waitFor: 'text=Total Pilgrims Registered' },
  { path: '/pilgrim-management', file: 'pilgrim-management.png', waitFor: 'text=Pilgrim Management' },
  { path: '/payments', file: 'payments.png', waitFor: 'text=Payment Management' },
  { path: '/group-leader-dashboard', file: 'group-leader.png', waitFor: 'text=Group Pilgrims' },
  { path: '/allocation-management', file: 'allocation.png', waitFor: 'text=Fleet Overview' },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Login page shot first (no session)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForSelector('form');
  await page.screenshot({ path: path.join(OUT_DIR, 'login.png') });

  // Log in for the rest
  await page.fill('#username', 'user1');
  await page.fill('#password', 'Hajjflow123@');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
  await page.waitForTimeout(800);

  for (const shot of shots) {
    if (shot.path === '/login') continue;
    await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle' });
    try {
      await page.waitForSelector(shot.waitFor, { timeout: 5000 });
    } catch {
      // proceed anyway
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT_DIR, shot.file) });
    console.log(`✓ ${shot.file}`);
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
