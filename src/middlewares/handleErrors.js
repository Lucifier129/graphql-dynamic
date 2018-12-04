const { getMessage } = require('../util')

module.exports = (ctx, next) => {
  ctx.error = error => {
    ctx.errors.push({
      field: ctx.fieldName,
      message: getMessage(error, ctx.dev)
    })
  }
  return next()
}
