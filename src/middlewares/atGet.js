const URL = require('url')
const querystring = require('querystring')
const isPlainObject = require('is-plain-object')

module.exports = (ctx, next) => {
  ctx.get = params => {
    let { url, query, options, ...rest } = params
    let urlObj

    if (isPlainObject(url)) {
      urlObj = url
    } else if (typeof url == 'string') {
      urlObj = URL.parse(url)
    }

    if (urlObj) {
      // merge params.query into url
      urlObj.query = {
        ...querystring.parse(urlObj.query),
        ...query
      }
      url = URL.format(urlObj)
    }

    options = {
      ...options,
      method: 'GET'
    }

    return ctx.fetch({ url, options, ...rest })
  }

  ctx.directive('get', async params => {
    ctx.result = await ctx.get(params)
  })

  return next()
}
