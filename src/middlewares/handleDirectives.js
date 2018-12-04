const { isThenable } = require('../util')

const handleDirectives = async (ctx, next) => {
  let directives = {}
  ctx.directive = (key, handler) => {
    directives[key] = handler
  }

  await next()

  if (ctx.info.directives) {
    await executeDirectives(ctx, directives)
  }
}

const executeDirectives = async (ctx, directives) => {
  let directiveKeys = Object.keys(ctx.info.directives)

  for (let i = 0; i < directiveKeys.length; i++) {
    let key = directiveKeys[i]
    let handler = directives[key]

    if (typeof handler === 'function') {
      let args = ctx.info.directives[key]
      let result = handler(args || {}, i, directiveKeys)
      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${key}`)
    }
  }
}

module.exports = handleDirectives
