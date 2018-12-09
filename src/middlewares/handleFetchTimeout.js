module.exports = timeout => (ctx, next) => {
  let fetch = ctx.fetch
  ctx.fetch = (url, options) => {
    let time = typeof ctx.timeout === 'number' ? ctx.timeout : timeout
    let fetchPromise = fetch(url, options)
    let rejectPromise = rejectWhenTimeout(time)
    return Promise.race([fetchPromise, rejectPromise])
  }
  return next()
}

function rejectWhenTimeout(timeout = 3000) {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error('timeout')), timeout)
  })
}
