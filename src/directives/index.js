const { isThenable } = require('../util')
const variable = require('./variable')
const fetch = require('./fetch')
const get = require('./get')
const post = require('./post')
const filter = require('./filter')
const map = require('./map')
const create = require('./create')

const handleDirectives = async (ctx, next) => {
  let directives = {
    pre: [],
    post: [],
    handlers: {}
  }
  ctx.directive = (key, handler, type) => {
    if (type === 'pre') {
      directives.pre.push(key)
    } else if (type === 'post') {
      directives.post.push(key)
    }
    directives.handlers[key] = handler
  }
  await next()
  if (ctx.info.directives) {
    await executeDirectives(ctx, directives)
  }
}

const executeDirectives = async (ctx, directives) => {
  let directiveKeys = Object.keys(ctx.info.directives)
  let isPreKey = key => directives.pre.includes(key)
  let preKeys = directiveKeys.filter(isPreKey)
  let isPostKey = key => directives.post.includes(key)
  let postKeys = directiveKeys.filter(isPostKey)
  let isNormalKey = key => !preKeys.includes(key) && !postKeys.includes(key)
  let normalKeys = directiveKeys.filter(isNormalKey)

  let finalKeys = [...preKeys, ...normalKeys, ...postKeys]

  for (let i = 0; i < finalKeys.length; i++) {
    let key = finalKeys[i]
    let handler = directives.handlers[key]
    if (typeof handler === 'function') {
      let args = ctx.info.directives[key]
      let result = handler(args || {}, key)
      if (isThenable(result)) {
        await result
      }
    } else {
      ctx.error(`Unknow directive @${key}`)
    }
  }
}

module.exports = [
  handleDirectives,
  variable,
  fetch,
  get,
  post,
  filter,
  map,
  create
]
