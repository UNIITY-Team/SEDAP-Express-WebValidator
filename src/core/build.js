// Fields -> message (schema-driven). values: { [fieldName]: string } incl. header fields and variant params.
import { getSchema, resolveFields } from '../schema/index.js';

export function buildParts(typeName, values = {}) {
  const schema = getSchema(typeName);
  if (!schema) throw new Error(`Unknown message type "${typeName}"`);
  const disc = schema.variants ? (values[schema.variants.discriminator] ?? '') : '';
  const resolved = resolveFields(schema, disc);
  return resolved.map(({ def, section }) => {
    if (section === 'name') return typeName;
    const v = values[def.name];
    return v == null ? '' : String(v);
  });
}

/** Build the message string. Trailing empty fields are dropped (excess trailing semicolons may be truncated, ICD §2). */
export function build(typeName, values = {}) {
  const parts = buildParts(typeName, values);
  let end = parts.length;
  while (end > 1 && parts[end - 1] === '') end--;
  return parts.slice(0, end).join(';');
}
