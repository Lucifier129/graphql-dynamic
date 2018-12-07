module.exports = (ctx, next) => {
  let handleExtend = params => {
    if (Array.isArray(ctx.result)) {
      ctx.result = ctx.result.map(item => ({ ...item, ...params }))
    } else {
      ctx.result = {
        ...ctx.result,
        ...params
      }
    }
  }
  ctx.directive('extend', handleExtend)
  return next()
}
