const { graphql } = require('graphql-anywhere/lib/async')
const gql = require('graphql-tag')
const compose = require('koa-compose')
const fetch = require('isomorphic-fetch')
const { getMessage } = require('./util')
const createVariables = require('./createVariables')
const resolveDynamicArgs = require('./middlewares/resolveDynamicArgs')
const handleErrors = require('./middlewares/handleErrors')
const handleLogs = require('./middlewares/handleLogs')
const createFunction = require('./middlewares/createFunction')
const handleDirectives = require('./middlewares/handleDirectives')
const handleLogFetch = require('./middlewares/handleLogFetch')
const handleFetchTimeout = require('./middlewares/handleFetchTimeout')
const atVariable = require('./middlewares/atVariable')
const atCreate = require('./middlewares/atCreate')
const atFilter = require('./middlewares/atFilter')
const atMap = require('./middlewares/atMap')
const atFetch = require('./middlewares/atFetch')
const atGet = require('./middlewares/atGet')
const atPost = require('./middlewares/atPost')
const atExtend = require('./middlewares/atExtend')
const atAppend = require('./middlewares/atAppend')
const atPrepend = require('./middlewares/atPrepend')

const builtInMiddlewares = [
	handleErrors,
	handleLogs,
	resolveDynamicArgs,
	createFunction,
	handleDirectives,
	handleLogFetch,
	handleFetchTimeout,
	atCreate,
	atVariable,
	atFilter,
	atMap,
	atFetch,
	atGet,
	atPost,
	atExtend,
	atAppend,
	atPrepend
]

const defaultConfig = {
	variableTimeout: 3000,
	fetchTimeout: 3000
}

const createLoader = config => {
	config = { ...defaultConfig, ...config }

	let middlewares = [...builtInMiddlewares]
	let doResolve = null
	let resolve = context => {
		if (!doResolve) {
			doResolve = compose(middlewares)
		}
		return doResolve(context)
	}

	let resolver = async (fieldName, rootValue, args, context, info) => {
		let result = rootValue ? rootValue[fieldName] : undefined

		if (result == null && !info.isLeaf) {
			result = {}
		}

		context = {
			...config,
			...context,
			fieldName,
			rootValue,
			result,
			args,
			info
		}

		try {
			await resolve(context)
			return context.result
		} catch (error) {
			context.errors.push({
				field: fieldName,
				message: getMessage(error, context.dev)
			})
		}
	}

	let load = async (query, variables, context, rootValue) => {
		let errors = []
		let logs = []

		context = context || {}
		let variableTimeout = context.variableTimeout || config.variableTimeout
		variables = createVariables(variables, variableTimeout)

		context = {
			fetch,
			...context,
			errors,
			logs,
			variables
		}

		query = typeof query === 'string' ? gql(query) : query

		let data = await graphql(resolver, query, rootValue, context, variables)
		return { errors, logs, data }
	}

	let use = (...customMiddlewares) => {
		middlewares.push(...customMiddlewares)
	}

	return {
		load,
		use
	}
}

module.exports = createLoader
