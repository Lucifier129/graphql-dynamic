const vm = require('vm-browserify')
const fetch = require('isomorphic-fetch')
const createLoader = require('./createLoader')
const attach = require('./middlewares/attach')
const createFunction = require('./middlewares/createFunction')
const handleLogFetch = require('./middlewares/handleLogFetch')
const handleFetchTimeout = require('./middlewares/handleFetchTimeout')
const atFilter = require('./middlewares/atFilter')
const atMap = require('./middlewares/atMap')
const atFetch = require('./middlewares/atFetch')
const atGet = require('./middlewares/atGet')
const atPost = require('./middlewares/atPost')
const atExtend = require('./middlewares/atExtend')
const atAppend = require('./middlewares/atAppend')
const atPrepend = require('./middlewares/atPrepend')

module.exports = (config = {}) => {
  const loader = createLoader(config)

  loader.use(attach('vm', vm))
  loader.use(
    attach('fetch', fetch),
    handleLogFetch,
    handleFetchTimeout(config.timeout)
  )
  loader.use(
    createFunction,
    atFilter,
    atMap,
    atFetch,
    atGet,
    atPost,
    atExtend,
    atAppend,
    atPrepend
  )

  return loader
}