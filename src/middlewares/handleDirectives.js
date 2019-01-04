const { isThenable } = require('../util')

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
  for (let i = 0; i < directives.length; i++) {
    let { name, args } = directives[i]
    let handler = ctx.directiveHandlers[name]

    if (typeof handler === 'function') {
      args = resolveArgs(args, name, ctx)
      let result = handler(args || {}, i)

      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${name}`)
    }
  }
}

const resolveArgs = (args, name, ctx) => {
  if (!args || !args.use) {
    return args
  }

  let { use: code, ...rest } = args

  if (typeof code !== 'string') {
    throw new Error(`\`use\` must be a string in @${name}, instead of ${code}`)
  }

  let f = ctx.createFunction(code, '$value')
  let context = {
    ...ctx.rootValue,
    [ctx.fieldName]: ctx.result,
    [ctx.info.resultKey]: ctx.result,
    ...ctx.result,
    ...rest
  }

  return { ...rest, ...f.call(context, ctx.result) }
}

module.exports = handleDirectives
