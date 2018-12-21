const URL = require('url')
const querystring = require('querystring')
const isPlainObject = require('is-plain-object')
const { createFetch } = require('./atFetch')

const atGet = (ctx, next) => {
  ctx.directive('get', async params => {
    let get = createGet(ctx)
    ctx.result = await get(params)
  })
  return next()
}

const createGet = ctx => params => {
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

  let fetch = createFetch(ctx)
  return fetch({ url, options, ...rest })
}

atGet.createGet = createGet
module.exports = atGet
