const { createFetch } = require('./atFetch')
const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
  let fetch = createFetch(ctx)
  ctx.directive('post', params => {
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

    return fetch({ url, options, ...rest })
  })
  return next()
}
