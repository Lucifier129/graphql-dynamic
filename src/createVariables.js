const { deferred } = require('./util')

module.exports = (variables, timeout = 3000) => {
	let deferredMap = {}
	return new Proxy(variables || {}, {
		get(target, key) {
			// existed value
			if (key in target) {
				return target[key]
			}

			// async value
			if (!deferredMap.hasOwnProperty(key)) {
				let obj = (deferredMap[key] = deferred())
				obj.isResolved = false
				obj.tid = setTimeout(() => {
					deferredMap[key].reject(new Error(`variable $${key} timeout`))
				}, timeout)
			}

			return deferredMap[key].promise
		},
		set(target, key, value) {
			// read-only
			if (key in target) {
				throw new Error(`variable $${key} can not be assigned more than once`)
			}

			// dynamic
			if (!deferredMap.hasOwnProperty(key)) {
				target[key] = value
				return true
			}

			// async & dynamic
			let obj = deferredMap[key]

			if (obj.isResolved) {
				throw new Error(`variable $${key} can not be assigned more than once`)
			}

			obj.isResolved = true
			obj.resolve(value)
			clearTimeout(obj.tid)
			return true
		}
	})
}
