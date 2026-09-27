import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

// Screen modules need a browser to run, so at least make sure every file parses.
const files = ['config.js', 'sw.js', ...readdirSync('js').filter((f) => f.endsWith('.js')).map((f) => `js/${f}`),
  ...readdirSync('js/views').map((f) => `js/views/${f}`)];

for (const f of files) {
  test(`${f} parses`, () => {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stderr);
  });
}
