import SwaggerUI from 'swagger-ui'
import { convert } from "@catalystic/json-to-yaml";
import 'swagger-ui/dist/swagger-ui.css';

let spec = require('../../../specification/open-api/server-api.yaml');

// Use internal schemas rather than the published schemas when building.
const REPLACE_REF = {
  from: 'https://ograf.ebu.io/v1/specification/',
  to: '../'
}

// Lookup table of external references.
// We'll inject these during compile-time, since Swagger-UI has trouble with external references.
const specialImports = {
  "../json-schemas/gdd/basic-types.json": require('../../../specification/json-schemas/gdd/basic-types.json'),
  "../json-schemas/gdd/gdd-types.json": require('../../../specification/json-schemas/gdd/gdd-types.json'),
  "../json-schemas/gdd/object.json": require('../../../specification/json-schemas/gdd/object.json'),
  "../json-schemas/graphics/schema.json": require('../../../specification/json-schemas/graphics/schema.json'),
  "../json-schemas/lib/action.json": require('../../../specification/json-schemas/lib/action.json'),
  "../json-schemas/lib/constraints/boolean.json": require('../../../specification/json-schemas/lib/constraints/boolean.json'),
  "../json-schemas/lib/constraints/number.json": require('../../../specification/json-schemas/lib/constraints/number.json'),
  "../json-schemas/lib/constraints/string.json": require('../../../specification/json-schemas/lib/constraints/string.json'),
  "https://json-schema.org/draft/2020-12/schema": {
    // Don't resolve this one, as it is heavily recursive,
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    description: 'JSON-Schema, see https://json-schema.org'
  },
}

async function main() {

  spec = replaceThingsInSpec(spec)

  console.log('Specification', spec)

  const ui = SwaggerUI({
    spec,
    dom_id: '#swagger',
    deepLinking: true
  });

  ui.initOAuth({
    appName: "OGraf Server API",
    clientId: 'implicit',
  });
}

/** Replaces certain strings in object */
function replaceGlobalRefs(o) {
  if (typeof o === 'object') {
    for (const key of Object.keys(o)) {
      if (
        (
          key === '$ref' ||
          key === '$id' ||
          key === 'url'
        ) &&
        typeof o[key] === 'string'
      ) {
        if (o[key].startsWith(REPLACE_REF.from)) {
          const newValue = o[key].replace(REPLACE_REF.from, REPLACE_REF.to)
          o[key] = newValue
        }
      }
    }
  }
}
/**
 * Do a few special imports, because the swagger-ui won't render some external $refs properly
 */
function replaceThingsInSpec(o, depth) {
  if (typeof o === 'object') {

    // First, prepare the object by replacing certain strings in it:
    replaceGlobalRefs(o)

    const ref = o["$ref"]
    if (ref && specialImports[ref]) {
      const replaceObj = specialImports[ref]

      delete o["$ref"]

      if (depth > 20) {
        return o
      }

      const newObject = {
        ...o,
        ...specialImports[ref]
      }
      replaceThingsInSpec(newObject, (depth || 0) + 1)
      return newObject
    }

    // else
    for (const key of Object.keys(o)) {
      o[key] = replaceThingsInSpec(o[key], (depth || 0) + 1)
    }
  }
  return o
}

// ------------------------
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
