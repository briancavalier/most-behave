import buble from 'rollup-plugin-buble'
import flow from 'rollup-plugin-flow'
import nodeResolve from 'rollup-plugin-node-resolve'
import pkg from './package.json'

export default {
  input: 'src/index.js',
  plugins: [
    flow(),
    buble(),
    nodeResolve({
      jsnext: true
    })
  ],
  external: [
    '@most/core',
    '@most/scheduler',
    '@most/disposable',
    '@most/prelude'
  ],
  output: [
    {
      file: pkg.main,
      format: 'umd',
      name: 'mostBehave',
      sourcemap: true,
      globals: {
        '@most/core': 'mostCore',
        '@most/scheduler': 'mostScheduler',
        '@most/disposable': 'mostDisposable',
        '@most/prelude': 'mostPrelude',
      }
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: true
    }
  ]
}
