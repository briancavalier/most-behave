import buble from 'rollup-plugin-buble'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'src/index.js',
  plugins: [
    buble(),
    nodeResolve({
      jsnext: true
    })
  ],
  globals: {
    '@most/prelude': 'mostPrelude',
    '@most/core': 'mostCore'
  },
  targets: [
    {
      dest: 'dist/index.js',
      format: 'umd',
      moduleName: 'mostBehave',
      sourceMap: true
    },
    {
      dest: 'dist/index.es.js',
      format: 'es',
      sourceMap: true
    }
  ]
}
