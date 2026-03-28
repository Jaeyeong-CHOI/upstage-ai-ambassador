// Workflow card selection
const cards = document.querySelectorAll('.wf-card');
const apiKeyInput = document.getElementById('apiKey');
const downloadBtn = document.getElementById('downloadBtn');

const TEMPLATE_BASE = './templates';

function getSelectedWorkflow() {
  const checked = document.querySelector('input[name="workflow"]:checked');
  return checked ? checked.value : null;
}

cards.forEach(card => {
  card.addEventListener('click', () => {
    cards.forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input[type="radio"]').checked = true;
  });
});

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

downloadBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  const selected = getSelectedWorkflow();

  if (!key) {
    apiKeyInput.focus();
    apiKeyInput.style.borderColor = '#ef4444';
    setTimeout(() => { apiKeyInput.style.borderColor = ''; }, 1500);
    return;
  }

  if (!key.startsWith('up_')) {
    apiKeyInput.focus();
    apiKeyInput.style.borderColor = '#ef4444';
    setTimeout(() => { apiKeyInput.style.borderColor = ''; }, 1500);
    return;
  }

  downloadBtn.textContent = '준비 중...';
  downloadBtn.disabled = true;

  try {
    const url = `${TEMPLATE_BASE}/${selected}`;
    const template = await fetch(url, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error(`템플릿 로드 실패: ${r.status}`);
      return r.text();
    });

    const token = 'REPLACE_WITH_YOUR_REAL_KEY';
    const replaced = template.replace(new RegExp(escapeRegExp(token), 'g'), key);

    const blob = new Blob([replaced], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = selected.replace('.json', '.filled.json');
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);

    downloadBtn.textContent = '✓ 다운로드 완료';
    downloadBtn.classList.add('success');
    setTimeout(() => {
      downloadBtn.textContent = 'JSON 다운로드 →';
      downloadBtn.classList.remove('success');
      downloadBtn.disabled = false;
    }, 2000);
  } catch (e) {
    downloadBtn.textContent = 'JSON 다운로드 →';
    downloadBtn.disabled = false;
    alert(`오류: ${e.message}`);
  }
});
