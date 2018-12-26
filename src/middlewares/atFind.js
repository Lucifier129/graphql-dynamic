const { findValueByKey } = require('../util')

module.exports = (ctx, next) => {
  let handleFind = params => {
    let rootValue = !params.root ? ctx.result : ctx.rootValue
    let key = params.key || ctx.fieldName

    if (Array.isArray(rootValue)) {
      ctx.result = rootValue.map(item => findValueByKey(item, key))
    } else {
      ctx.result = findValueByKey(rootValue, key)
    }
  }
  ctx.directive('find', handleFind)
  return next()
}
