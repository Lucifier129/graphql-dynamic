module.exports = (ctx, next) => {
  let handleCreate = (params, index) => {
    if (index !== 0) {
      throw new Error(`@create should be the first direactive`)
    }
    ctx.result = params.value
  }

  ctx.directive('create', handleCreate)
  return next()
}
