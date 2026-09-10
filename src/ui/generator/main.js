import { $, escHtml, initChrome, renderResult, copyText } from '../common.js';
import { registry, typeNames, HEADER_FIELDS, resolveFields } from '../../schema/index.js';
import { getCheck } from '../../schema/fieldTypes.js';
import { build } from '../../core/build.js';
import { validate } from '../../core/validate.js';

initChrome();

let selectedType = '';
const values = {};   // fieldName -> string (header + content + variant)

// ── type selector ───────────────────────────────────────────────────────────
const typeBar = $('type-buttons');
typeBar.innerHTML = typeNames.map(t => `<button class="type-btn" data-type="${t}">${t}</button>`).join('');
typeBar.addEventListener('click', e => {
  const btn = e.target.closest('.type-btn');
  if (!btn) return;
  selectType(btn.dataset.type);
});

function selectType(type) {
  selectedType = type;
  for (const k of Object.keys(values)) delete values[k];
  values.Time = nowHex();
  typeBar.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b.dataset.type === type));
  $('idle-state').classList.add('hidden');
  $('form-area').classList.remove('hidden');
  $('output-area').classList.add('hidden');
  $('type-desc').textContent = `${registry[type].description} (ICD §${registry[type].icdRef})`;
  renderForm();
}

const nowHex = () => Date.now().toString(16).toUpperCase();

// ── form rendering (schema-driven) ──────────────────────────────────────────
function fieldControl(def, position) {
  const check = def.check ? getCheck(def.check) : null;
  const id = `f-${position}`;
  const unit = def.unit ? ` <span class="unit">[${escHtml(def.unit)}]</span>` : '';
  const m = def.mandatory === true ? ' <span class="mandatory">M</span>'
          : def.mandatory === 'conditional' ? ' <span class="mandatory cond">M*</span>' : '';
  const v = values[def.name] ?? '';
  let control;
  if (check?.options) {
    control = `<select id="${id}" data-field="${escHtml(def.name)}"><option value="">— ${def.mandatory === true ? 'select' : 'optional'} —</option>` +
      check.options.map(o => `<option value="${escHtml(o.code)}"${o.code === v ? ' selected' : ''}>${escHtml(o.code)}${o.label !== o.code ? ' · ' + escHtml(o.label) : ''}</option>`).join('') + '</select>';
  } else {
    control = `<input id="${id}" data-field="${escHtml(def.name)}" value="${escHtml(v)}" placeholder="${escHtml(check?.expected ?? '')}" autocomplete="off" spellcheck="false">`;
  }
  const extra = def.name === 'Time' ? ' <a href="#" class="set-now">set now</a>' : '';
  const wide = def.list || (check?.expected ?? '').startsWith('BASE64') ? ' wide' : '';
  return `<div class="gen-field${wide}"><label for="${id}"><span class="pos">${position}</span>${escHtml(def.name)}${unit}${m}${extra}</label>${control}<span class="msg hint" id="${id}-msg" title="${escHtml(def.icdHint)}">ICD §${escHtml(def.icdRef)}</span></div>`;
}

function renderForm() {
  const schema = registry[selectedType];
  const disc = schema.variants ? (values[schema.variants.discriminator] ?? '') : '';
  const resolved = resolveFields(schema, disc);
  const bySection = s => resolved.filter(f => f.section === s);

  let html = `<div class="section-title">Header <small>ICD §5</small></div><div class="gen-grid">`;
  html += bySection('header').map(f => fieldControl(f.def, f.index + 1)).join('');
  html += `</div><div class="section-title">Content – ${selectedType} <small>ICD §${schema.icdRef}</small></div>`;
  const oneOf = (schema.rules || []).filter(r => r.kind === 'oneOf');
  for (const r of oneOf) {
    html += `<div class="cond-note"><b>M*</b> – one of the groups must be filled: ${r.groups.map(g => `<b>${escHtml(g.label)}</b> (${g.fields.map(escHtml).join(', ')})`).join(' or ')}. ICD §${escHtml(r.icdRef)}: ${escHtml(r.icdHint)}</div>`;
  }
  html += `<div class="gen-grid">` + bySection('content').map(f => fieldControl(f.def, f.index + 1)).join('') + '</div>';
  if (schema.variants) {
    const opt = schema.variants.options[disc];
    html += `<div class="section-title">${escHtml(schema.variants.discriminator)}-dependent parameters${opt ? ` – ${escHtml(disc)} ${escHtml(opt.label)}` : ''}</div>`;
    const vf = bySection('variant');
    html += vf.length ? `<div class="gen-grid">${vf.map(f => fieldControl(f.def, f.index + 1)).join('')}</div>`
      : `<p class="type-desc">${opt ? 'This type has no parameters.' : `Select a ${escHtml(schema.variants.discriminator)} to see its parameters.`}</p>`;
  }
  $('fields').innerHTML = html;
}

// live validation + state
$('fields').addEventListener('input', onFieldChange);
$('fields').addEventListener('change', onFieldChange);
$('fields').addEventListener('click', e => {
  if (e.target.classList.contains('set-now')) {
    e.preventDefault();
    values.Time = nowHex();
    const el = $('fields').querySelector('[data-field="Time"]');
    if (el) { el.value = values.Time; checkField(el); }
  }
});

function onFieldChange(e) {
  const el = e.target.closest('[data-field]');
  if (!el) return;
  values[el.dataset.field] = el.value.trim();
  const schema = registry[selectedType];
  if (schema.variants && el.dataset.field === schema.variants.discriminator && e.type === 'change') {
    // variant changed: drop old params, re-render
    const keep = new Set(resolveFields(schema, values[el.dataset.field]).map(f => f.def.name));
    for (const k of Object.keys(values)) if (!keep.has(k)) delete values[k];
    renderForm();
    return;
  }
  checkField(el);
}

function checkField(el) {
  const name = el.dataset.field;
  const def = resolveFields(registry[selectedType], values[registry[selectedType].variants?.discriminator] ?? '').find(f => f.def.name === name)?.def;
  const msg = $(`${el.id}-msg`);
  el.classList.remove('field-ok', 'field-warn', 'field-error');
  const v = el.value.trim();
  if (!def) return;
  if (v === '') {
    if (def.mandatory === true) { el.classList.add('field-error'); setMsg(msg, 'error', 'mandatory'); }
    else setMsg(msg, 'hint', `ICD §${def.icdRef}`);
    return;
  }
  const res = def.check ? getCheck(def.check).test(v) : null;
  if (!res) { el.classList.add('field-ok'); setMsg(msg, 'hint', `ICD §${def.icdRef}`); }
  else { el.classList.add(`field-${res.level}`); setMsg(msg, res.level, res.message); }
}

function setMsg(el, cls, text) { if (!el) return; el.className = `msg ${cls}`; el.textContent = text; }

// ── generate ────────────────────────────────────────────────────────────────
$('btn-generate').addEventListener('click', () => {
  if (!selectedType) return;
  if (!values.Time) values.Time = nowHex();
  const msg = build(selectedType, values);
  const result = validate(msg);
  $('output-code').textContent = msg;
  $('output-code').className = `output-code status-${result.ok ? 'ok' : 'error'}`;
  $('output-result').innerHTML = renderResult(result, { showRaw: false });
  $('output-area').classList.remove('hidden');
  $('open-validator').href = `validator.html?msg=${encodeURIComponent(msg)}`;
  // reflect findings on the inputs
  for (const f of result.fields) {
    const el = $('fields').querySelector(`[data-field="${CSS.escape(f.name)}"]`);
    if (!el) continue;
    el.classList.remove('field-ok', 'field-warn', 'field-error');
    if (f.status === 'ok') el.classList.add('field-ok');
    if (f.status === 'error' || f.status === 'warn') { el.classList.add(`field-${f.status}`); setMsg($(`${el.id}-msg`), f.status, f.message); }
  }
});

$('btn-clear').addEventListener('click', () => { if (selectedType) selectType(selectedType); });
$('btn-copy').addEventListener('click', () => copyText($('output-code').textContent));
