module.exports = (ctx, next) => {
  let fetch = ctx.fetch
  ctx.fetch = (url, options) => {
    let fetchPromise = fetch(url, options)
    let rejectPromise = rejectWhenTimeout(ctx.fetchTimeout)
    return Promise.race([fetchPromise, rejectPromise])
  }
  return next()
}

function rejectWhenTimeout(timeout = 3000) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), timeout)
  })
}
