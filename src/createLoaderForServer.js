const vm = require('vm')
const fetch = require('isomorphic-fetch')
const createLoader = require('./createLoader')
const attach = require('./middlewares/attach')
const atFilter = require('./middlewares/atFilter')
const atMap = require('./middlewares/atMap')
const atFetch = require('./middlewares/atFetch')
const atGet = require('./middlewares/atGet')
const atPost = require('./middlewares/atPost')

module.exports = config => {
	const loader = createLoader(config)

	loader.use(
		attach('runInContext', (code, sanbox) => {
			return vm.runInContext(code, vm.createContext(sanbox))
		})
	)
	loader.use(attach('fetch', fetch))
	loader.use(atFilter, atMap, atFetch, atGet, atPost)

	return loader
}
