module.exports = {
  merge,
  getDirectivesFromField,
  getArgsFromField
}

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

function getDirectivesFromField(field, variables) {
  if (field.directives && field.directives.length) {
    return field.directives.map(directive => {
      return {
        name: directive.name.value,
        args: getArgsFromField(directive, variables)
      }
    })
  }
  return null
}

function getArgsFromField(field, variables) {
  if (field.arguments && field.arguments.length) {
    const argObj = {}
    field.arguments.forEach(({ name, value }) =>
      valueToObjectRepresentation(argObj, name, value, variables)
    )
    return argObj
  }

  return null
}

function valueToObjectRepresentation(argObj, name, value, variables) {
  if (isIntValue(value) || isFloatValue(value)) {
    argObj[name.value] = Number(value.value)
  } else if (isBooleanValue(value) || isStringValue(value)) {
    argObj[name.value] = value.value
  } else if (isObjectValue(value)) {
    const nestedArgObj = {}
    value.fields.map(obj =>
      valueToObjectRepresentation(nestedArgObj, obj.name, obj.value, variables)
    )
    argObj[name.value] = nestedArgObj
  } else if (isVariable(value)) {
    const variableValue = (variables || {})[value.name.value]
    argObj[name.value] = variableValue
  } else if (isListValue(value)) {
    argObj[name.value] = value.values.map(listValue => {
      const nestedArgArrayObj = {}
      valueToObjectRepresentation(nestedArgArrayObj, name, listValue, variables)
      return nestedArgArrayObj[name.value]
    })
  } else if (isEnumValue(value)) {
    argObj[name.value] = value.value
  } else if (isNullValue(value)) {
    argObj[name.value] = null
  } else {
    throw new Error(
      `The inline argument "${name.value}" of kind "${value.kind}"` +
        'is not supported. Use variables instead of inline arguments to ' +
        'overcome this limitation.'
    )
  }
}

function isScalarValue(value) {
  return ['StringValue', 'BooleanValue', 'EnumValue'].indexOf(value.kind) > -1
}
function isNumberValue(value) {
  return ['IntValue', 'FloatValue'].indexOf(value.kind) > -1
}

function isStringValue(value) {
  return value.kind === 'StringValue'
}

function isBooleanValue(value) {
  return value.kind === 'BooleanValue'
}

function isIntValue(value) {
  return value.kind === 'IntValue'
}

function isFloatValue(value) {
  return value.kind === 'FloatValue'
}

function isVariable(value) {
  return value.kind === 'Variable'
}

function isObjectValue(value) {
  return value.kind === 'ObjectValue'
}

function isListValue(value) {
  return value.kind === 'ListValue'
}

function isEnumValue(value) {
  return value.kind === 'EnumValue'
}

function isNullValue(value) {
  return value.kind === 'NullValue'
}
