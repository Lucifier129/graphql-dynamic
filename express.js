const { Router } = require('express')
const bodyParser = require('body-parser')
const createLoader = require('./src/createLoaderForServer')
const { renderPlaygroundPage } = require('graphql-playground-html')
const {
	version
} = require('graphql-playground-middleware-express/package.json')

const defaultConfig = {
	logs: true,
	fetchTimeout: 3000,
	variableTimeout: 3000,
	playground: true,
	endpoint: '/graphql'
}
module.exports = config => {
	config = { ...defaultConfig, ...config }

	let router = Router()
	let loader = createLoader(config)
	router.loader = loader

	router.post('/', bodyParser.json(), async (req, res, next) => {
		let { query, variables, options } = req.body

		// return empty schema for IntrospectionQuery
		if (query.includes('query IntrospectionQuery')) {
			return res.json({
				errors: ['graphql-dynamic is schema-less, ignore this error']
			})
		}

		try {
			let context = {
				req: req,
				res: res,
				headers: req.headers,
				...req.graphqlContext,
				...options
			}
			let { errors, logs, data } = await loader.load(
				query,
				variables,
				context,
				req.rootValue
			)

			if (config.logs !== false) {
				res.json({ errors, logs, data })
			} else {
				res.json({ errors, data })
			}
		} catch (error) {
			next(error)
		}
	})

	if (config.playground !== false) {
		let playgroundOptions = {
			settings: {
				'editor.theme': 'light',
				'request.credentials': 'include',
				'tracing.hideTracingResponse': true,
				...config.playground
			},
			version: version,
			endpoint: config.endpoint
		}
		router.get('/', (req, res) => {
			let playground = renderPlaygroundPage({
				...playgroundOptions,
				...req.graphqlPlaygroundOptions
			})
			res.setHeader('Content-Type', 'text/html')
			res.end(playground)
		})
	}

	return router
}
