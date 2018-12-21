const { createFetch } = require('./atFetch')
const isPlainObject = require('is-plain-object')

const atPost = (ctx, next) => {
  ctx.directive('post', async params => {
    let post = createPost(ctx)
    ctx.result = await post(params)
  })
  return next()
}

const createPost = ctx => params => {
  let { url, body, options, ...rest } = params
  options = {
    ...options,
    method: 'POST',
    body
  }

  if (!Array.isArray(options.headers)) {
    options.headers = []
  }

  let hasContentType = !!options.headers.find(
    ([key]) => key.toLowerCase() === 'content-type'
  )

  if (isPlainObject(body) && !hasContentType) {
    options.headers.push(['Content-Type', 'application/json'])
  }

  let fetch = createFetch(ctx)
  return fetch({ url, options, ...rest })
}

atPost.createPost = createPost
module.exports = atPost
