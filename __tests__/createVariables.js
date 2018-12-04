const createVariables = require('../src/createVariables')

describe('createVariables', () => {
	test('should get exsited key correctly', () => {
		let variables = createVariables({ a: 1, b: 2 })
		expect(variables.a).toBe(1)
		expect(variables.b).toBe(2)
	})

	test('should get dynamic key correctly', () => {
		let variables = createVariables({ a: 1, b: 2 })
		variables.c = 1
		expect(variables.c).toBe(1)
	})

	test('should return promise when get non-esited key', () => {
		let variables = createVariables({ a: 1, b: 2 })
		expect(variables.c instanceof Promise).toBe(true)
	})

	test('should resolve promise when set value', done => {
		let variables = createVariables({ a: 1, b: 2 })
		variables.c.then(c => {
			expect(c).toBe(1)
			done()
		})
		variables.c = 1
	})

	test('should reject promise when timeout', done => {
		let variables = createVariables({ a: 1, b: 2 }, 5)
		variables.c.catch(error => {
			expect(error instanceof Error).toBe(true)
			done()
		})
	})

	test('should throw error when assign value more than once', done => {
		let variables = createVariables({ a: 1, b: 2 })
		let errorCount = 0

		try {
			variables.a = 2
		} catch (_) {
			errorCount += 1
		}

		variables.c = 1

		try {
			variables.c = 2
		} catch (_) {
			errorCount += 1
		}

		variables.d.then(d => {
			expect(d).toBe(3)
			done()
		})

		variables.d = 3

		try {
			variables.d = 4
		} catch (_) {
			errorCount += 1
		}

		expect(errorCount).toBe(3)
		expect(variables.a).toBe(1)
		expect(variables.c).toBe(1)
	})
})
