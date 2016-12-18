import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  plugins: [
    buble(),
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs({
      include: 'node_modules/**',
    })
  ],
  format: 'iife'
};
