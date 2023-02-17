module.exports = {
  devServer: {
    // public: 'vocab.daddyswork.com:80' - should work, not tested
    disableHostCheck: true,
    // got a problem on myass, needs to be false. Should set environment variable
    https: true
  }
}
