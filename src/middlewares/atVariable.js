module.exports = (ctx, next) => {
  let handleVariable = (params, index, keys) => {
    if (index !== keys.length - 1) {
      throw new Error(`@variable should be the last directive`)
    }
    let name = params.name || ctx.info.resultKey
    ctx.variables[name] = ctx.result
  }

  ctx.directive('variable', handleVariable)
  return next()
}
