const entries = obj => {
	return Object.entries(obj)
}

const fromEntries = (list = []) => {
	if (!Array.isArray(list)) {
		return {}
	}
	return list.reduce((result, [key, value]) => {
		result[key] = value
		return result
	}, {})
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

const getMessage = (error, dev = false) => {
	if (error instanceof Error) {
		return dev ? error.stack : error.message
	}
	return error + ''
}

module.exports = {
	getMessage,
	entries,
	fromEntries,
	deferred,
	isThenable,
	getValue,
	getObject,
	getArray
}
