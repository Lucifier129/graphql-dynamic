module.exports = (ctx, next) => {
  let handleInclude = (params) => {
    if (params && params.if === false) {
      ctx.result = undefined
    }
  }

  ctx.directive('include', handleInclude)
  return next()
}
