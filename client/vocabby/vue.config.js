const os = require('os')

module.exports = {
  devServer: {
    // public: 'vocab.daddyswork.com:80' - should work, not tested
    disableHostCheck: true,
    // got a problem on myass, needs to be false. Should set environment variable
    https: os.hostname() == 'my-ass' ? false : true
  },
  disableHostCheck: false,
  // done by apache
  https: false
}
