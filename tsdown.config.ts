import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'src/react.tsx', 'src/style.css'],
  format: ['esm'],
  dts: { build: true },
  fixedExtension: false,
})
