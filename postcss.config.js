// Empty PostCSS config — shadows the parent Next.js postcss.config.mjs
// so Vitest (which uses Vite internally) does not walk up and load the
// parent's @tailwindcss/postcss plugin, which requires a platform-specific
// lightningcss binary that won't be present in all environments.
export default {};
