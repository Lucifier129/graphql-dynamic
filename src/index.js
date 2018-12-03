const { graphql } = require('graphql-anywhere/lib/async')
const gql = require('graphql-tag')
const compose = require('koa-compose')
const fetch = require('isomorphic-fetch')
const { getValue, isThenable } = require('./util')
const directives = require('./directives')
const createVariables = require('./createVariables')

const resolveDynamicArgs = async (ctx, next) => {
	let directives = getValue(ctx.info.directives)
	let args = getValue(ctx.args)

	if (isThenable(directives)) {
		ctx.info.directives = await directives
	}

	if (isThenable(args)) {
		ctx.args = await args
	}
	return next()
}

const addBaseUtils = (ctx, next) => {
	ctx.fetch = fetch
	ctx.error = error => {
		ctx.errors.push(`Error in field ${ctx.fieldName}\n${error}`)
	}
	return next()
}

const builtInMiddlewares = [resolveDynamicArgs, addBaseUtils, ...directives]

const create = (...middlewares) => {
	let resolve = compose([...builtInMiddlewares, ...middlewares])
	let resolver = async (fieldName, rootValue, args, context, info) => {
		try {
			await resolve({
				...context,
				fieldName,
				rootValue,
				args,
				info
			})
			return context.result
		} catch (error) {
			// console.log('error resolver', error)
			context.errors.push(`Error in field ${fieldName} \n${error}`)
			return null
		}
	}
	return async (query, variables, context, rootValue) => {
		let errors = []
		let finalContext = {
			errors,
			variables: createVariables(variables),
			result: null,
			...context
		}

		let data = await graphql(
			resolver,
			query,
			rootValue,
			finalContext,
			finalContext.variables
		)

		return { errors, data }
	}
}

const load = create()

const test = async () => {
	try {
		const result = await load(gql`
			{
				data @create(value: { a: 1, b: 2 }) {
					a
					b @variable
				}
				# test @create(value: $b)
			}
		`)
		console.log('test')
		console.log('result', result)
	} catch (error) {
		console.log('error', error)
	}
	console.log('return')
}

test()

module.exports = { create }

gql`
	{
		object(value: { a: 123, b: $test, c: 522 })
		provide(value: 123) @variable(name: "provide") @val
		a(value: $testA)
			@get(
				url: "/12446/getUserInfo"
				query: { a: 1, b: 2, c: 3 }
				options: { headers: [["Content-Type", "application/json"]] }
			)
			@drop(if: true)
		b(value: $provide)
			@post(url: "/12446/getUserInfo", body: { a: 1, b: 2, c: 3 })
			@do(filter: "b === 1")
			@filter(if: "xxx = 1")
			@map(to: "x * 2")
			@create(value: { a: 1, b: 2, c: 3 })
	}
`
