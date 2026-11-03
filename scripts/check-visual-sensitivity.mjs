import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

const baseline = `tests/visual/baselines/${process.platform}/desktop-light/shveller-products.png`;
if (!fs.existsSync(baseline)) throw new Error('Create and review the screenshot baseline before running the negative control.');
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'tests/visual',
  '--grep', 'shveller table or card geometry', '--project=desktop-light', '--reporter=json'], {
  env: {...process.env, VISUAL_REGRESSION_PROBE: '1'}, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
});
if (result.error) throw result.error;
const report = JSON.parse(result.stdout);
const results = [];
function collect(suite) {
  for (const spec of suite.specs ?? []) for (const test of spec.tests ?? []) results.push(...test.results);
  for (const child of suite.suites ?? []) collect(child);
}
for (const suite of report.suites) collect(suite);
const compared = results.some(test => test.attachments?.some(attachment => attachment.path?.endsWith('-diff.png')));
if (result.status === 0 || report.stats.unexpected !== 1 || !compared) {
  throw new Error(`The probe did not fail specifically on a screenshot difference. Inspect test-results/. Exit: ${result.status}. Runner errors: ${JSON.stringify(report.errors)}`);
}
console.log('Visual regression comparison detected the intentional column-padding change. Production source and baselines were not modified.');
