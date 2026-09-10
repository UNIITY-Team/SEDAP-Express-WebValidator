import { $, escHtml, initChrome, renderResult } from '../common.js';
import { validate } from '../../core/validate.js';
import { registry, typeNames } from '../../schema/index.js';

initChrome();

// Sample picker: every ICD sample of every registered type
const picker = $('sample-picker');
picker.innerHTML = '<option value="">Load ICD sample…</option>' + typeNames.map(t =>
  `<optgroup label="${t} (§${registry[t].icdRef})">` +
  registry[t].samples.map((s, i) => `<option value="${escHtml(s)}">${t} #${i + 1}</option>`).join('') +
  '</optgroup>').join('');
picker.addEventListener('change', () => {
  if (!picker.value) return;
  $('input-msg').value = picker.value;
  picker.value = '';
  run();
});

function run() {
  const raw = $('input-msg').value;
  const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l !== '');
  const area = $('result-area');
  if (lines.length === 0) { area.classList.add('hidden'); return; }
  area.innerHTML = lines.map(line => `<div class="result">${renderResult(validate(line), { showRaw: lines.length > 1 })}</div>`).join('');
  area.classList.remove('hidden');
}

$('btn-validate').addEventListener('click', run);
$('input-msg').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run(); });
$('btn-clear').addEventListener('click', () => { $('input-msg').value = ''; $('result-area').classList.add('hidden'); $('input-msg').focus(); });

// Allow ?msg=… deep links (e.g. from the generator)
const q = new URLSearchParams(location.search).get('msg');
if (q) { $('input-msg').value = q; run(); }
