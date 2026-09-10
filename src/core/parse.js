// Message -> fields (schema-driven). No type-specific code here.
import { getSchema, resolveFields, NAME_FIELD, HEADER_FIELDS } from '../schema/index.js';

/** Accepts string, Buffer, Uint8Array or ArrayBuffer; returns a trimmed string (ISO-8859-1 decoded). */
export function normalizeInput(raw) {
  if (raw == null) return '';
  if (typeof raw !== 'string') {
    const bytes = raw instanceof ArrayBuffer ? new Uint8Array(raw) : raw;
    let s = '';
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    raw = s;
  }
  return raw.replace(/^\uFEFF/, '').replace(/[\r\n]+$/, '').trim();
}

/**
 * Parse one message. Never throws; an unknown type yields schema = null and a
 * `problem` describing why. Missing trailing fields are normalized to "".
 */
export function parse(raw) {
  const text = normalizeInput(raw);
  const parts = text === '' ? [] : text.split(';');
  const typeName = parts[0] ?? '';
  const result = { raw: text, parts, typeName, schema: null, fields: [], extra: [], problem: null };

  if (parts.length === 0) {
    result.problem = { message: 'Empty input – nothing to validate.' };
    return result;
  }

  const schema = getSchema(typeName);
  if (!schema) {
    const known = getSchema(typeName.toUpperCase());
    if (typeName === 'KEYEXCHANGE') {
      result.problem = { message: 'KEYEXCHANGE (ICD §6.15) is not supported by this tool.', icdRef: '6.15' };
    } else if (known) {
      result.problem = { message: `Unknown message type "${typeName}" – message names are uppercase (${typeName.toUpperCase()}).`, icdRef: '5' };
    } else {
      result.problem = {
        message: `Unknown message type "${typeName.slice(0, 40)}".`,
        icdRef: '3.3',
        icdHint: 'Receiver rule: if first bytes of a received message don\'t match a message name, test for compression. Encrypted/compressed data is BASE64-encoded and cannot be validated as plain text.',
      };
    }
    // Still expose header positions so the UI can show what was received.
    const headerDefs = [NAME_FIELD, ...HEADER_FIELDS];
    result.fields = headerDefs.map((def, index) => ({ def, index, section: index === 0 ? 'name' : 'header', value: parts[index] ?? '' }));
    for (let i = headerDefs.length; i < parts.length; i++) result.extra.push({ index: i, value: parts[i] });
    return result;
  }

  result.schema = schema;
  let discriminatorValue = '';
  let variantLabel = '';
  if (schema.variants) {
    const fixed = resolveFields(schema, null);
    const disc = fixed.find(f => f.def.name === schema.variants.discriminator);
    discriminatorValue = disc ? (parts[disc.index] ?? '') : '';
    const opt = schema.variants.options[discriminatorValue];
    variantLabel = opt ? opt.label : '';
  }

  const resolved = resolveFields(schema, discriminatorValue);
  result.discriminatorValue = discriminatorValue;
  result.variantLabel = variantLabel;
  result.fields = resolved.map(({ def, index, section }) => ({
    def, index, section, value: parts[index] ?? '',
    variantLabel: section === 'variant' ? variantLabel : undefined,
  }));

  for (let i = resolved.length; i < parts.length; i++) {
    result.extra.push({ index: i, value: parts[i] });
  }
  return result;
}
