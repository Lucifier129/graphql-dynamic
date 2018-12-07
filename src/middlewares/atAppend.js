module.exports = (ctx, next) => {
  let handleAppend = params => {
    if (params.hasOwnProperty('value')) {
      if (ctx.result == null) {
        ctx.result = [].concat(params.value)
      } else {
        ctx.result = [].concat(ctx.result, params.value)
      }
    }
  }
  ctx.directive('append', handleAppend)
  return next()
}
