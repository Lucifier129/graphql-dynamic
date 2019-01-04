let createFunction
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

    /**
     * use sanbox to improve security
     * use 'new Function' to improve performance
     */
    if (!createFunction) {
      let { vm } = ctx
      let sandbox = vm.createContext({ f: null })
      vm.runInContext(
        `f = (code, args) => {
					return new Function(...args, \`with(this) { return \${code} }\`)
				}`,
        sandbox
      )
      createFunction = sandbox.f
    }

    return createFunction(code, args)
  }
  return next()
}
