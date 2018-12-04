const { graphql } = require('graphql-anywhere/lib/async')
const compose = require('koa-compose')
const createVariables = require('./createVariables')
const resolveDynamicArgs = require('./middlewares/resolveDynamicArgs')
const handleErrors = require('./middlewares/handleErrors')
const handleDirectives = require('./middlewares/handleDirectives')
const atVariable = require('./middlewares/atVariable')
const atCreate = require('./middlewares/atCreate')

const builtInMiddlewares = [
	handleErrors,
	resolveDynamicArgs,
	handleDirectives,
	atCreate,
	atVariable
]

const defaultConfig = {
	variableTimeout: 3000
}

const createLoader = config => {
	config = { ...defaultConfig, ...config }

	let middlewares = [...builtInMiddlewares]
	let doResolve = null
	let resolve = context => {
		if (!doResolve) {
			console.log('middlewares', middlewares)
			doResolve = compose(middlewares)
		}
		return doResolve(context)
	}

	let resolver = async (fieldName, rootValue, args, context, info) => {
		let result = rootValue ? rootValue[fieldName] : null

		if (result == null && !info.isLeaf) {
			result = {}
		}

		context = {
			...context,
			config,
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
			context.errors.push(`Error in field [${fieldName}] \n${error.stack}`)
			return null
		}
	}

	let load = async (query, variables, context, rootValue) => {
		let errors = []

		context = context || {}
		variables = createVariables(variables, config.variableTimeout)

		context = {
			errors,
			variables,
			...context
		}

		let data = await graphql(resolver, query, rootValue, context, variables)
		return { errors, data }
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
