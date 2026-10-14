// Compatibility entry point: the shared suite checks the current UI without
// rewriting photos, supplier evidence or catalog data, or closing your browser.
process.env.AUDIT_URL ??= process.env.HERO_TEST_URL ?? 'http://127.0.0.1:3000';
process.env.AUDIT_CDP ??= 'http://127.0.0.1:9223';
await import('./check-local-browser.mjs');
