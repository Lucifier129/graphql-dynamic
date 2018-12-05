module.exports = (ctx, next) => {
	ctx.createFunction = (code, ...args) => {
		if (!ctx.vm) {
			throw new Error(`Missing ctx.vm for createFunction`)
		}

		if (typeof ctx.vm.createContext !== 'function') {
			throw new Error(`ctx.vm.createContext is not a function`)
		}

		if (typeof ctx.vm.runInContext !== 'function') {
			throw new Error(`ctx.vm.runInContext is not a function`)
		}

		let { vm } = ctx
		let sandbox = vm.createContext({ f: null })
		vm.runInContext(
			`f = function (${args.join(', ')}) { with(this) { return (${code}) } }`,
			sandbox
		)
		return (context, ...args) => sandbox.f.call(context, ...args)
	}
	return next()
}
