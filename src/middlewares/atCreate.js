module.exports = (ctx, next) => {
  let handleCreate = (params) => {
    if (params) {
      ctx.result = params.value
    }
  }

  ctx.directive('create', handleCreate)
  return next()
}
