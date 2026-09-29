import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { config } from '../config.js';

test('Settings version matches the service worker version', () => {
  const sw = readFileSync('sw.js', 'utf8').match(/const VERSION = 'v(\d+)'/)[1];
  assert.equal(config.version, sw, 'bump config.version together with VERSION in sw.js');
});
