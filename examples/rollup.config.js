import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'

export default {
  plugins: [
    buble(),
    resolve({
      jsnext: true,
      module: true,
      main: true
    })
  ],
  format: 'iife'
};
