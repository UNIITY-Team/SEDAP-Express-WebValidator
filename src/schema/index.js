// Schema registry: message type -> field definitions.
// KEYEXCHANGE (ICD §6.15) is intentionally not registered (project decision, see CLAUDE.md).
import { NAME_FIELD, HEADER_FIELDS, HEADER_RULES } from './header.js';
import OWNUNIT     from './types/OWNUNIT.js';
import CONTACT     from './types/CONTACT.js';
import POINT       from './types/POINT.js';
import EMISSION    from './types/EMISSION.js';
import METEO       from './types/METEO.js';
import TEXT        from './types/TEXT.js';
import GRAPHIC     from './types/GRAPHIC.js';
import COMMAND     from './types/COMMAND.js';
import STATUS      from './types/STATUS.js';
import ACKNOWLEDGE from './types/ACKNOWLEDGE.js';
import RESEND      from './types/RESEND.js';
import GENERIC     from './types/GENERIC.js';
import HEARTBEAT   from './types/HEARTBEAT.js';
import TIMESYNC    from './types/TIMESYNC.js';

export { NAME_FIELD, HEADER_FIELDS, HEADER_RULES };

const TYPES = [OWNUNIT, CONTACT, POINT, EMISSION, METEO, TEXT, GRAPHIC, COMMAND, STATUS, ACKNOWLEDGE, RESEND, GENERIC, HEARTBEAT, TIMESYNC];

export const registry = Object.fromEntries(TYPES.map(t => [t.name, t]));
export const typeNames = TYPES.map(t => t.name);

export function getSchema(name) {
  return registry[name] || null;
}

/** Fields of the variant selected by the discriminator value, or [] when none applies. */
export function variantFields(schema, discriminatorValue) {
  const v = schema.variants;
  if (!v) return [];
  const opt = v.options[discriminatorValue];
  return opt ? opt.fields : [];
}

export function variantLabel(schema, discriminatorValue) {
  const opt = schema.variants && schema.variants.options[discriminatorValue];
  return opt ? opt.label : '';
}

/**
 * Complete ordered field list for a message: [Name, ...header, ...content, ...variant].
 * Each entry carries its absolute index and its section.
 */
export function resolveFields(schema, discriminatorValue) {
  const out = [];
  const push = (def, section) => out.push({ def, index: out.length, section });
  push(NAME_FIELD, 'name');
  HEADER_FIELDS.forEach(d => push(d, 'header'));
  schema.fields.forEach(d => push(d, 'content'));
  variantFields(schema, discriminatorValue).forEach(d => push(d, 'variant'));
  return out;
}
