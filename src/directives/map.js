const vm = require('vm')
const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
  let handleMap = params => {
    let result = ctx.result

    if (result == null) {
      return
    }

    if (typeof params.to !== 'string') {
      ctx.error(`\`to\` in @filter should be a string, instead of ${params.to}`)
      return
    }

    let isArray = Array.isArray(result)
    let code = params.to

    result = isArray ? result : [result]

    result = result.map(item => {
      let sandbox
      if (isPlainObject(item)) {
        sandbox = { ...item, ...params.context }
      } else {
        sandbox = { [ctx.fieldName]: item, ...params.context }
      }
      return vm.runInContext(code, vm.createContext(sandbox))
    })

    ctx.result = isArray ? result : result[0]
  }

  ctx.directive('map', handleMap)
  return next()
}
