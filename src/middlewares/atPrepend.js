module.exports = (ctx, next) => {
  let handlePrepend = params => {
    if (params.hasOwnProperty('value')) {
      if (ctx.result == null) {
        ctx.result = [].concat(params.value)
      } else {
        ctx.result = [].concat(params.value, ctx.result)
      }
    }
  }
  ctx.directive('prepend', handlePrepend)
  return next()
}
