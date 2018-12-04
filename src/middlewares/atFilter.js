const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
	let handleFilter = params => {
		if (typeof ctx.runInContext !== 'function') {
			throw new Error(`ctx.runInContext is not a function in @filter`)
		}

		let result = ctx.result

		if (result == null) {
			return
		}

		if (typeof params.if !== 'string') {
			ctx.error(
				`\`if\` in @filter should be a string of expresstion, instead of ${
					params.if
				}`
			)
			return
		}

		let isArray = Array.isArray(result)
		let code = params.if

		result = isArray ? result : [result]

		result = result.filter(item => {
			let sandbox
			if (isPlainObject(item)) {
				sandbox = { ...item, ...params.context }
			} else {
				sandbox = { [ctx.fieldName]: item, ...params.context }
			}
			return ctx.runInContext(`(${code})`, sandbox)
		})

		ctx.result = isArray ? result : result[0]
	}

	ctx.directive('filter', handleFilter)
	return next()
}
