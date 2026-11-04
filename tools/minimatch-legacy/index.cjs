// Dev-only bridge for ESLint plugins that still require minimatch's callable v3 export.
// All pattern matching is performed by the patched v11 engine, without generating RegExp.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Legacy consumers require a synchronous CommonJS export.
const modern = require("minimatch-modern");

function withDefaults(defaults = {}) {
  const options = values => ({...defaults, ...values});
  const match = (path, pattern, values) => modern.minimatch(path, pattern, options(values));

  class Minimatch extends modern.Minimatch {
    constructor(pattern, values) {
      super(pattern, options(values));
    }

    // eslint-plugin-import/no-internal-modules only calls .test() on this result.
    // This is intentionally a matcher, not a RegExp or a general v3 polyfill.
    makeRe() {
      return {test: path => this.match(path)};
    }

    static defaults(values) {
      return withDefaults(options(values)).Minimatch;
    }
  }

  return Object.assign(match, modern, {
    minimatch: match,
    Minimatch,
    makeRe: (pattern, values) => new Minimatch(pattern, values).makeRe(),
    defaults: values => withDefaults(options(values)),
    filter: (pattern, values) => modern.filter(pattern, options(values)),
    match: (paths, pattern, values) => modern.match(paths, pattern, options(values)),
    braceExpand: (pattern, values) => modern.braceExpand(pattern, options(values)),
  });
}

module.exports = withDefaults();
