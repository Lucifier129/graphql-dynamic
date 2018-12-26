module.exports = (ctx, next) => {
  let handleSkip = (params) => {
    if (params && params.if === true) {
      ctx.result = undefined
    }
  }

  ctx.directive('skip', handleSkip)
  return next()
}
