module.exports = {
  mongodbMemoryServerOptions: {
    binary: {
      version: '5.0.8',
      skipMD5: true
    },
    autoStart: false,
    instance: {},
    replSet: {
      count: 3,
      storageEngine: 'wiredTiger'
    }
  },
  mongoURLEnvName: 'MONGO_URI'
}
