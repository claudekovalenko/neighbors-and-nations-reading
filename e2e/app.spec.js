// Checks every screen the way a person would see it on their phone:
// layout (bottom bar, overflow, tap targets), content for different dates,
// and the things people tap. Each screen's screenshot is attached to the
// report so it can be looked over by eye.
import { test, expect } from '@playwright/test';

const DATES = {
  midweek: '2026-09-29T09:00:00', // Tuesday, Romans week 4
  sunday: '2026-10-04T09:00:00',
  romansBreak: '2026-12-08T09:00:00', // between Romans parts 1 and 2
  before: '2026-09-01T09:00:00',
  after: '2028-01-01T09:00:00',
};

const SCREENS = [
  ['Today', '#/'],
  ['Weeks', '#/weeks'],
  ['Week 4', '#/week/4'],
  ['Week 31 (recap)', '#/week/31'],
  ['Settings', '#/settings'],
  ['Not found', '#/nope'],
];

async function open(page, hash, { when = 'midweek', settings } = {}) {
  await page.clock.setFixedTime(new Date(DATES[when]));
  if (settings) {
    await page.addInitScript((s) => localStorage.setItem('sermon-series:settings', JSON.stringify(s)), settings);
  }
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => {
    const main = document.querySelector('main');
    return main && !main.textContent.includes('Loading');
  });
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return errors;
}

// Everything about the layout we care about, measured in the page.
const measure = (page) =>
  page.evaluate(() => {
    const r = (el) => el.getBoundingClientRect();
    const bar = r(document.querySelector('.tabbar'));
    const tabs = [...document.querySelectorAll('.tabbar a')].map((a) => {
      const box = r(a);
      const icon = r(a.querySelector('svg'));
      return { left: box.left, width: box.width, iconTop: icon.top, iconLeft: icon.left };
    });
    const doc = document.documentElement;
    const main = document.querySelector('main');
    const targets = [...document.querySelectorAll('main a, main button, main summary, main select, main input[type=time], main label.switch')]
      .filter((el) => el.offsetParent && !el.closest('p')) // skip links inside sentences
      .map((el) => ({ what: `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 30)}"`, h: r(el).height, w: r(el).width }))
      .filter((t) => t.h < 44 || t.w < 44);
    return {
      barTop: bar.top, barBottom: bar.bottom, barHeight: bar.height, viewportHeight: innerHeight,
      tabs, smallTargets: targets,
      overflow: Math.max(doc.scrollWidth - doc.clientWidth, main.scrollWidth - main.clientWidth),
      // Only main should scroll; if the page itself scrolls, mobile browsers
      // move the bottom bar around.
      pageScrolls: doc.scrollHeight - doc.clientHeight,
    };
  });

for (const [name, hash] of SCREENS) {
  test(`${name}: looks right`, async ({ page }, info) => {
    const errors = watchErrors(page);
    await open(page, hash);
    const m = await measure(page);

    expect(m.overflow, 'page is wider than the screen').toBeLessThanOrEqual(0);
    expect(m.pageScrolls, 'the whole page scrolls (only the middle should)').toBeLessThanOrEqual(0);
    expect(m.barBottom, 'bottom bar is not flush with the bottom of the screen').toBeCloseTo(m.viewportHeight, 0);
    expect(m.smallTargets, 'buttons/links smaller than 44px are hard to tap').toEqual([]);
    expect(errors, 'errors on the page').toEqual([]);

    await info.attach(`${name} (top)`, { body: await page.screenshot(), contentType: 'image/png' });
    await info.attach(`${name} (whole page)`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}

test('bottom bar is identical on every screen', async ({ page }) => {
  const seen = [];
  for (const [name, hash] of SCREENS) {
    await open(page, hash);
    const m = await measure(page);
    seen.push({ name, top: m.barTop, height: m.barHeight, tabs: m.tabs });
  }
  for (const s of seen.slice(1)) {
    expect.soft(s.top, `${s.name}: bar top differs from Today`).toBeCloseTo(seen[0].top, 0);
    expect.soft(s.height, `${s.name}: bar height differs from Today`).toBeCloseTo(seen[0].height, 0);
    s.tabs.forEach((t, i) => {
      expect.soft(t.iconLeft, `${s.name}: tab ${i + 1} icon moved sideways`).toBeCloseTo(seen[0].tabs[i].iconLeft, 0);
      expect.soft(t.iconTop, `${s.name}: tab ${i + 1} icon moved up/down`).toBeCloseTo(seen[0].tabs[i].iconTop, 0);
    });
  }
});

test('bottom bar stays put when scrolling a long page, and hides nothing', async ({ page }) => {
  await open(page, '#/');
  const today = await measure(page);
  for (const hash of ['#/weeks', '#/settings']) {
    await open(page, hash);
    await page.locator('main').evaluate((m) => m.scrollTo(0, m.scrollHeight));
    await page.waitForTimeout(200);
    const m = await measure(page);
    expect(m.barTop, `${hash}: bar moved after scrolling`).toBeCloseTo(today.barTop, 0);
    expect(m.barBottom, `${hash}: bar not at the bottom after scrolling`).toBeCloseTo(m.viewportHeight, 0);
    const lastBottom = await page.locator('main').evaluate((main) => main.lastElementChild.getBoundingClientRect().bottom);
    expect(lastBottom, `${hash}: last item is hidden behind the bottom bar`).toBeLessThanOrEqual(m.barTop + 1);
  }
});

test.describe('shows the right thing for the date', () => {
  test('mid-week: this week’s Romans passage', async ({ page }) => {
    await open(page, '#/');
    await expect(page.locator('.card-feature h2')).toHaveText('Romans 2:1–29');
    await expect(page.locator('.read-link').first()).toHaveAttribute('href', /biblegateway\.com.*Romans.*2.*1-29.*version=ESV/);
  });

  test('Sunday: says today', async ({ page }) => {
    await open(page, '#/', { when: 'sunday' });
    await expect(page.locator('.card-feature .eyebrow')).toContainText('Today');
  });

  test('between Romans parts: says when it resumes', async ({ page }) => {
    await open(page, '#/', { when: 'romansBreak' });
    await expect(page.locator('main')).toContainText('on a break');
    await expect(page.locator('main')).toContainText('April 4');
  });

  test('before the series starts', async ({ page }) => {
    await open(page, '#/', { when: 'before' });
    await expect(page.locator('.card-feature .eyebrow')).toContainText('Starts');
  });

  test('after every series has ended', async ({ page }) => {
    await open(page, '#/', { when: 'after' });
    await expect(page.locator('main')).toContainText('Series complete');
  });
});

test.describe('things people tap', () => {
  test.beforeEach(async ({ context, page }) => {
    // The Bible sites are outside the app; don't actually load them.
    await context.route(/biblegateway\.com|bible\.com/, (r) => r.fulfill({ body: 'ok' }));
    page.on('popup', (p) => p.close().catch(() => {}));
  });

  test('tapping Read marks today', async ({ page }) => {
    await open(page, '#/');
    await expect(page.locator('.dot.is-today')).not.toHaveClass(/is-done/);
    await page.locator('.read-link').first().click();
    await expect(page.locator('.dot.is-today')).toHaveClass(/is-done/);
    await page.reload();
    await expect(page.locator('.dot.is-today')).toHaveClass(/is-done/);
  });

  test('day circles toggle, future days are locked', async ({ page }) => {
    await open(page, '#/');
    const mon = page.locator('.dot').first();
    await mon.click();
    await expect(mon).toHaveClass(/is-done/);
    await mon.click();
    await expect(mon).not.toHaveClass(/is-done/);
    await expect(page.locator('.dot').last()).toBeDisabled();
  });

  test('notes on Today show up on the week page', async ({ page }) => {
    await open(page, '#/');
    await page.locator('details.notes summary').click();
    await page.locator('.note-text').fill('Grace for Jew and Gentile');
    await page.locator('.tabbar a[data-tab="weeks"]').click();
    await page.locator('.week-row', { hasText: 'Romans 2:1–29' }).click();
    await expect(page.locator('.note-text')).toHaveValue('Grace for Jew and Gentile');
    await page.reload();
    await expect(page.locator('.note-text')).toHaveValue('Grace for Jew and Gentile');
  });

  test('moving between weeks and tabs', async ({ page }) => {
    await open(page, '#/week/4');
    await page.getByRole('link', { name: /Week 5/ }).click();
    await expect(page.locator('h1')).toHaveText('Romans 3:1–8');
    await page.getByRole('link', { name: /All weeks/ }).click();
    await expect(page.locator('h1')).toHaveText('All weeks');
    await page.locator('.tabbar a[data-tab="settings"]').click();
    await expect(page.locator('h1')).toHaveText('Settings');
    await expect(page.locator('.tabbar a[aria-current="page"]')).toHaveAttribute('data-tab', 'settings');
    await page.locator('.tabbar a[data-tab="today"]').click();
    await expect(page.locator('.hero h1')).toHaveText('Romans');
  });
});
