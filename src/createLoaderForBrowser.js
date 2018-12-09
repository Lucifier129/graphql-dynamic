const vm = require('vm-browserify')
const createLoader = require('./createLoader')
const attach = require('./middlewares/attach')

module.exports = (config = {}) => {
  const loader = createLoader(config)

  loader.use(attach('vm', vm))

  return loader
}
