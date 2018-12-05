const vm = require('vm')
const fetch = require('isomorphic-fetch')
const createLoader = require('./createLoader')
const attach = require('./middlewares/attach')
const createFunction = require('./middlewares/createFunction')
const atFilter = require('./middlewares/atFilter')
const atMap = require('./middlewares/atMap')
const atFetch = require('./middlewares/atFetch')
const atGet = require('./middlewares/atGet')
const atPost = require('./middlewares/atPost')

module.exports = config => {
	const loader = createLoader(config)

	loader.use(attach('vm', vm))
	loader.use(attach('fetch', fetch))
	loader.use(createFunction, atFilter, atMap, atFetch, atGet, atPost)

	return loader
}
