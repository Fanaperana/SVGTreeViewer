const path = require('path');

module.exports = {
  entry: './dist/legacy/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/browser'),
    library: 'SVGTreeViewer',
    libraryTarget: 'umd',
    libraryExport: 'SVGTreeViewer',
    globalObject: 'this'
  },
  mode: 'production'
};