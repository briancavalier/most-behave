import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/behave.es.js',
  moduleName: 'mostBehave',
  sourceMap: true,
  plugins: [
    buble()
  ],
  globals: {
    '@most/prelude': 'mostPrelude'
  }
}
