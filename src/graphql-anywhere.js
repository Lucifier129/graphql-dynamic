// fork from graphq-anywhere
const {
  getMainDefinition,
  getFragmentDefinitions,
  createFragmentMap,
  shouldInclude,
  getDirectiveInfoFromField,
  isField,
  isInlineFragment,
  resultKeyNameFromField,
  argumentsObjectFromField
} = require('apollo-utilities')

const hasOwn = Object.prototype.hasOwnProperty

function merge(dest, src) {
  if (src !== null && typeof src === 'object') {
    Object.keys(src).forEach(key => {
      const srcVal = src[key]
      if (!hasOwn.call(dest, key)) {
        dest[key] = srcVal
      } else {
        merge(dest[key], srcVal)
      }
    })
  }
}

function graphql(
  resolver,
  document,
  rootValue,
  contextValue,
  variableValues,
  execOptions = {}
) {
  const mainDefinition = getMainDefinition(document)

  const fragments = getFragmentDefinitions(document)
  const fragmentMap = createFragmentMap(fragments)

  const resultMapper = execOptions.resultMapper

  // Default matcher always matches all fragments
  const fragmentMatcher = execOptions.fragmentMatcher || (() => true)

  const execContext = {
    fragmentMap,
    contextValue,
    variableValues,
    resultMapper,
    resolver,
    fragmentMatcher
  }

  return executeSelectionSet(
    mainDefinition.selectionSet,
    rootValue,
    execContext
  )
}

async function executeSelectionSet(selectionSet, rootValue, execContext) {
  const { fragmentMap, contextValue, variableValues: variables } = execContext

  const result = {}

  const execute = async selection => {
    if (!shouldInclude(selection, variables)) {
      // Skip this entirely
      return
    }

    if (isField(selection)) {
      const fieldResult = await executeField(selection, rootValue, execContext)

      const resultFieldKey = resultKeyNameFromField(selection)

      if (fieldResult !== undefined) {
        return {
          type: 'field',
          key: resultFieldKey,
          value: fieldResult
        }
      }

      return
    }

    let fragment

    if (isInlineFragment(selection)) {
      fragment = selection
    } else {
      // This is a named fragment
      fragment = fragmentMap[selection.name.value]

      if (!fragment) {
        throw new Error(`No fragment named ${selection.name.value}`)
      }
    }

    const typeCondition = fragment.typeCondition.name.value

    if (execContext.fragmentMatcher(rootValue, typeCondition, contextValue)) {
      const fragmentResult = await executeSelectionSet(
        fragment.selectionSet,
        rootValue,
        execContext
      )

      return {
        type: 'fragment',
        fragment: fragmentResult
      }
    }
  }

  let executedList = await Promise.all(selectionSet.selections.map(execute))

  executedList.forEach(item => {
    if (!item) return

    if (item.type === 'field') {
      if (result[item.key] === undefined) {
        result[item.key] = item.value
      } else {
        merge(result[item.key], item.value)
      }
    }

    if (item.type === 'fragment') {
      merge(result, item.fragment)
    }
  })

  if (execContext.resultMapper) {
    return execContext.resultMapper(result, rootValue)
  }

  return result
}

async function executeField(field, rootValue, execContext) {
  const { variableValues: variables, contextValue, resolver } = execContext

  const fieldName = field.name.value
  const args = argumentsObjectFromField(field, variables)

  const info = {
    isLeaf: !field.selectionSet,
    resultKey: resultKeyNameFromField(field),
    directives: getDirectiveInfoFromField(field, variables)
  }

  const result = await resolver(fieldName, rootValue, args, contextValue, info)

  // Handle all scalar types here
  if (!field.selectionSet) {
    return result
  }

  // From here down, the field has a selection set, which means it's trying to
  // query a GraphQLObjectType
  if (result == null) {
    // Basically any field in a GraphQL response can be null, or missing
    return result
  }

  if (Array.isArray(result)) {
    return executeSubSelectedArray(field, result, execContext)
  }

  // Returned value is an object, and the query has a sub-selection. Recurse.
  return executeSelectionSet(field.selectionSet, result, execContext)
}

function executeSubSelectedArray(field, result, execContext) {
  return Promise.all(
    result.map(item => {
      // null value in array
      if (item === null) {
        return null
      }

      // This is a nested array, recurse
      if (Array.isArray(item)) {
        return executeSubSelectedArray(field, item, execContext)
      }

      // This is an object, run the selection set on it
      return executeSelectionSet(field.selectionSet, item, execContext)
    })
  )
}

module.exports = { graphql }
