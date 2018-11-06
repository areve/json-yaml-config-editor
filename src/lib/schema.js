import traverse from 'traverse'
import jsonpath from 'jsonpath'

function remove (config) {
  const clone = JSON.parse(JSON.stringify(config))
  traverse(clone).forEach(function (x) {
    if (x && typeof x === 'object') {
      if (x.$schema) delete x.$schema
    }
  })
  return clone
}

function add (config, rules) {
  traverse(config).forEach(function (x) {
    if (x && typeof x === 'object') {
      if (Array.isArray(x)) {
        x.$schema = {
          template: createTemplate(x)
        }
      }
    }
  })

  for (const path in rules) {
    const matches = jsonpath.query(config, path)
    matches.forEach(x => {
      if (typeof x === 'object') {
        x.$schema = Object.assign(x.$schema || {}, rules[path])
      }
    })
  }
}

function createTemplate (collection) {
  if (!collection[0]) return undefined
  const clone = JSON.parse(JSON.stringify(collection[0]))
  traverse(clone).forEach(function (x) {
    if (x === null || x === undefined) {
    } else if (typeof x === 'object') {
      delete x.$schema
    } else if (typeof x === 'string') {
      this.update('')
    } else if (typeof x === 'boolean') {
      this.update(false)
    } else if (typeof x === 'number') {
      this.update(0)
    }
  })

  if ('name' in clone) clone.name = 'New'

  return clone
}

export default {
  remove,
  add
}
