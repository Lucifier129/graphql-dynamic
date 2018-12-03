const vm = require('vm')
const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
	let handleFilter = params => {
		let result = ctx.result

		if (result == null) {
			return
		}

		if (typeof params.if !== 'string') {
			ctx.error(`\`if\` in @filter should be a string, instead of ${params.if}`)
			return
		}

		if (!Array.isArray(result)) {
			ctx.error(`@filter should only use in array field`)
			return
		}

		let code = params.if

		result = result.filter(item => {
			let sandbox
			if (isPlainObject(item)) {
				sandbox = { ...item, ...params.context }
			} else {
				sandbox = { [ctx.fieldName]: item, ...params.context }
			}
			return vm.runInContext(code, vm.createContext(sandbox))
		})
		ctx.result = result
	}
	ctx.directive('filter', handleFilter)
	return next()
}
