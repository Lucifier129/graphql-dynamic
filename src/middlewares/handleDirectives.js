const { isThenable } = require('../util')
const isPlainObject = require('is-plain-object')

const handleDirectives = async (ctx, next) => {
  let directiveHandlers = (ctx.directiveHandlers = {})

  ctx.directive = (key, handler) => {
    directiveHandlers[key] = handler
  }

  await next()

  if (ctx.info.directives) {
    await executeDirectives(ctx, ctx.info.directives)
  }
}

const executeDirectives = async (ctx, directives) => {
  let directiveKeys = Object.keys(directives)

  for (let i = 0; i < directiveKeys.length; i++) {
    let key = directiveKeys[i]
    let handler = ctx.directiveHandlers[key]

    if (typeof handler === 'function') {
      let args = directives[key]
      let result = handler(
        isPlainObject(args) ? args : ctx.result,
        i,
        directiveKeys
      )
      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${key}`)
    }
  }
}

module.exports = handleDirectives
