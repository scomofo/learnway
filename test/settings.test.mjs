import test from 'node:test';
import assert from 'node:assert/strict';

// Import and boot the shipped app with a minimal DOM and mocked bundled fetch.
// Exercise its actual Settings click handler and storage implementation.
test('Settings reports failed writes and clears previous success, then recovers', async t => {
  const setGlobal = (name, value) => {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else delete globalThis[name];
    });
  };
  const elements = {
    '#app': { innerHTML: '', addEventListener(type, handler) { if (type === 'click') this.click = handler; }, querySelector() { return null; } },
    '#s-key': { value: ' test-key ' },
    '#s-model': { value: 'test-model' },
    '#set-ok': { hidden: true },
    '#set-err': { hidden: true },
  };
  let boot;
  setGlobal('document', {
    querySelector: selector => elements[selector],
    getElementById: id => elements['#' + id],
    addEventListener(type, handler) { if (type === 'DOMContentLoaded') boot = handler; },
  });
  setGlobal('window', { scrollTo() {} });
  const values = new Map();
  let failure = '';
  setGlobal('localStorage', {
    getItem(key) { if (failure === 'read') throw new Error('blocked read'); return values.get(key) ?? null; },
    setItem(key, value) {
      if (failure === 'throw' || (failure === 'model' && key === 'learnway:model')) throw new Error('blocked write');
      if (failure !== 'silent') values.set(key, value);
    },
  });
  setGlobal('location', { origin: 'http://localhost:8130' });
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false }));
  await import('../app.mjs');
  await boot();
  const click = elements['#app'].click;
  // Navigation renders Settings using the real app and wires its handler.
  await click({ target: { closest: selector => selector === '[data-nav]' ? { dataset: { nav: 'settings' } } : null } });
  const save = () => elements['#app'].click({ target: { closest: selector => selector === '[data-action]' ? { dataset: { action: 'save-settings' } } : null } });
  await save();
  assert.equal(elements['#set-ok'].hidden, false);
  assert.equal(elements['#set-err'].hidden, true);
  assert.equal(JSON.parse(values.get('learnway:key')), 'test-key');
  for (const mode of ['throw', 'silent', 'read', 'model']) {
    failure = mode;
    elements['#s-key'].value = 'changed-key-' + mode;
    await save();
    assert.equal(elements['#set-ok'].hidden, true, mode);
    assert.equal(elements['#set-err'].hidden, false, mode);
    assert.match(elements['#set-err'].textContent, /Could not save/);
    failure = '';
    await save();
    assert.equal(elements['#set-ok'].hidden, false, mode + ' recovery');
    assert.equal(elements['#set-err'].hidden, true, mode + ' recovery');
  }
});
