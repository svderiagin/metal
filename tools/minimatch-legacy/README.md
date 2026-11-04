# ESLint minimatch bridge

Dev-only adapter for the callable CommonJS API used by ESLint 9 and its React,
accessibility and import plugins. All matching delegates to upstream
`minimatch@11.0.4`, installed as the `minimatch-modern` npm alias.

The root `minimatch@<4` override references the root dev dependency with `$minimatch`.
The TypeScript parser's newer API is overridden directly to upstream 11.0.4.
No old minimatch engine, RegExp generator, postinstall patch, global module hook,
audit exclusion or production dependency is added.

This is **not a general minimatch v3 polyfill**. It covers the installed consumers:
callable matching, `Minimatch.match`, partial matching and convenience helpers.
`makeRe()` supplies the `.test(path)` contract used by
`eslint-plugin-import/no-internal-modules`; it returns a safe matcher, not a RegExp.
Do not use it for code requiring RegExp identity/source or removed AST APIs.

`scripts/minimatch-compat.test.mjs` exercises the actual React, accessibility and
import rules with glob options, including both accepted and rejected input.
Run `npm run test:unit`, `npm run lint`, `npm ls minimatch minimatch-modern --all`
and `npm audit` after any dependency/override edit. A clean `npm ci` must work.

Remove this adapter and both root overrides when all installed consumers support
the patched upstream API. Do not simply force v11 on plugins that expect a
callable v3 export: ordinary lint runs may not reach their glob-dependent rules.

Sources: [security advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249),
[upstream API changes](https://github.com/isaacs/minimatch/blob/main/changelog.md).
