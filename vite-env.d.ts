/// <reference types="vite/client" />

declare module '@tailwindcss/vite' {
  import type { Plugin } from 'vite';
  type PluginOptions = {
    optimize?: boolean | { minify?: boolean };
  };
  function tailwindcss(opts?: PluginOptions): Plugin[];
  export { type PluginOptions, tailwindcss as default };
}
