// Shared UI helpers: theme, nav, escaping, and the schema-driven result renderer
// used by both the validator and the generator.

export const $ = id => document.getElementById(id);

export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function initChrome() {
  const themeToggle = $('themeToggle');
  try { if (localStorage.getItem('sdx-theme') === 'light') document.body.classList.add('light'); } catch {}
  themeToggle?.addEventListener('click', () => {
    document.body.classList.toggle('light');
    try { localStorage.setItem('sdx-theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch {}
  });
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');
  toggle?.addEventListener('click', () => nav.classList.toggle('open'));
}

export function showToast(text = '✓ Copied to clipboard') {
  const t = $('toast');
  if (!t) return;
  t.textContent = text;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2000);
}

export function copyText(text) {
  return navigator.clipboard.writeText(text).then(() => showToast());
}

const STATUS_LABEL = { ok: '✔ ok', error: '✘ error', warn: '⚠ warn', empty: '– empty' };

function icdLine(ref, hint) {
  if (!ref && !hint) return '';
  return `<span class="icd"><b>ICD §${escHtml(ref)}</b>${hint ? ' – ' + escHtml(hint) : ''}</span>`;
}

function fieldLabel(f) {
  const unit = f.unit ? ` <span class="unit">[${escHtml(f.unit)}]</span>` : '';
  const m = f.mandatory === 'M' ? ' <span class="mandatory">M</span>'
          : f.mandatory === 'M*' ? ' <span class="mandatory cond">M*</span>' : '';
  return `${escHtml(f.name)}${unit}${m}`;
}

/** Render a validate() result as HTML: status badge, field table, finding list. */
export function renderResult(result, { showRaw = true } = {}) {
  const { ok, errors, warnings, findings, fields, parsed } = result;
  const level = errors ? 'error' : warnings ? 'warn' : 'ok';
  const summary = errors ? `${errors} error${errors > 1 ? 's' : ''}` : ok && warnings ? `valid, ${warnings} warning${warnings > 1 ? 's' : ''}` : 'valid SEDAP-Express message';
  const icon = errors ? '✘' : warnings ? '⚠' : '✔';
  let html = `<div class="badge ${level}">${icon} ${escHtml(summary)}<span class="type">${escHtml(parsed.typeName || '(no type)')}${parsed.variantLabel ? ' · ' + escHtml(parsed.variantLabel) : ''}</span></div>`;
  if (showRaw) html += `<p class="raw">${escHtml(parsed.raw)}</p>`;

  html += '<div class="ftable">';
  let lastSection = null;
  for (const f of fields) {
    if (f.section !== lastSection) {
      const title = f.section === 'name' ? 'Message name' : f.section === 'header' ? 'Header (ICD §5)'
        : f.section === 'content' ? `Content – ${parsed.typeName} (ICD §${parsed.schema?.icdRef ?? ''})`
        : `${parsed.schema?.variants?.discriminator ?? ''} ${parsed.discriminatorValue} – ${f.variantLabel} parameters`;
      html += `<div class="frow sep">${escHtml(title)}</div>`;
      lastSection = f.section;
    }
    const detail = (f.status === 'error' || f.status === 'warn')
      ? `<div class="fdetail"><span class="what">${escHtml(f.message)}</span>${f.expected ? ` <span class="expected">· expected: ${escHtml(f.expected)}</span>` : ''}${icdLine(f.icdRef, f.icdHint)}</div>`
      : '';
    html += `<div class="frow ${f.status}">
      <span class="pos">${f.position}</span>
      <span class="fname">${fieldLabel(f)}</span>
      <span class="fval">${f.value === '' ? '<span class="empty">empty</span>' : escHtml(f.value)}</span>
      <span class="fstat">${STATUS_LABEL[f.status]}</span>${detail}</div>`;
  }
  for (const e of parsed.extra) {
    if (e.value === '') continue;
    html += `<div class="frow extra error"><span class="pos">${e.index + 1}</span><span class="fname">(not defined)</span><span class="fval">${escHtml(e.value)}</span><span class="fstat">✘ extra</span></div>`;
  }
  html += '</div>';

  if (findings.length) {
    html += '<ul class="findings">' + findings.map(f => `<li class="${f.level}">
      <span class="where">${escHtml(f.field)}${f.position ? ` <span class="pos">(pos ${f.position})</span>` : ''}:</span> ${escHtml(f.message)}${f.expected ? ` <span class="expected">· expected: ${escHtml(f.expected)}</span>` : ''}
      ${icdLine(f.icdRef, f.icdHint)}</li>`).join('') + '</ul>';
  }
  return html;
}
