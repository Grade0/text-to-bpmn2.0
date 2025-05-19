// SPDX-License-Identifier: MIT

import resolve  from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import bpmnlint from 'rollup-plugin-bpmnlint';
import { terser } from 'rollup-plugin-terser';

export default {
  input:  'src/app.js',
  output: {
    file: 'public/js/bundle-app.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    bpmnlint(),          // incapsula .bpmnlintrc
    resolve(), commonjs(),
    terser()             // facoltativo: minifica in prod
  ]
};