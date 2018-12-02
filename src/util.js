const delay = time => {
  return new Promise(resolve => {
    setTimeout(resolve, time)
  })
}

const isThenable = obj => {
  return !!(obj && typeof obj.then === 'function')
}

const getValue = obj => {
  if (obj == null) {
    return obj
  }
  if (Array.isArray(obj)) {
    return getArray(obj)
  }
  if (typeof obj === 'object') {
    return getObject(obj)
  }
  return obj
}

const getArray = array => {
  let hasThenable = false
  let result = array.map(item => {
    let value = getValue(item)
    if (isThenable(value)) {
      hasThenable = true
    }
    return value
  })
  return hasThenable ? Promise.all(result) : array
}

const getObject = object => {
  let values = getArray(Object.values(object))
  if (!isThenable(values)) {
    return object
  }
  return values.then(values => {
    let keys = Object.keys(object)
    let result = {}
    for (let i = 0; i < keys.length; i++) {
      result[keys[i]] = values[i]
    }
    return result
  })
}

const deferred = () => {
  let promise, resolve, reject
  promise = new Promise(($resolve, $reject) => {
    resolve = $resolve
    reject = $reject
  })
  return { promise, resolve, reject }
}

module.exports = {
  deferred,
  isThenable,
  getValue,
  getObject,
  getArray,
  delay
}
