// Interactive tabs inside the Hero IDE Mockup
document.querySelectorAll('.ide-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-mock-tab');
    document.querySelectorAll('.ide-tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.mock-pane').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById(`mock-${target}`);
    if (pane) pane.classList.add('active');
  });
});

// Interactive Tailwind color picker inside the Hero Inspector
const previewBtn = document.getElementById('mockPreviewBtn');
document.querySelectorAll('#heroColorPicker .swatch').forEach((swatch) => {
  swatch.addEventListener('click', () => {
    const color = swatch.getAttribute('data-color');
    document.querySelectorAll('#heroColorPicker .swatch').forEach((s) => s.classList.remove('active'));
    swatch.classList.add('active');
    if (previewBtn && color) {
      previewBtn.style.backgroundColor = color;
    }
  });
});

// Code-Behind file tabs
document.querySelectorAll('.code-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-code-tab');
    document.querySelectorAll('.code-tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.code-pane').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById(`code-${target}`);
    if (pane) pane.classList.add('active');
  });
});

// Copy active code snippet
const copyCodeBtn = document.getElementById('copyCodeBtn');
if (copyCodeBtn) {
  copyCodeBtn.addEventListener('click', async () => {
    const activePane = document.querySelector('.code-pane.active');
    if (!activePane) return;
    await navigator.clipboard.writeText(activePane.textContent || '');
    copyCodeBtn.textContent = '¡Copiado!';
    setTimeout(() => (copyCodeBtn.textContent = 'Copiar'), 1800);
  });
}

// Install tabs
document.querySelectorAll('.install-tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-install');
    document.querySelectorAll('.install-tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.install-pane').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    const pane = document.getElementById(`install-${target}`);
    if (pane) pane.classList.add('active');
  });
});

// Copy install commands
document.querySelectorAll('[data-copy-target]').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const id = btn.getAttribute('data-copy-target');
    const pre = document.querySelector(`#${id} pre`);
    if (!pre) return;
    await navigator.clipboard.writeText(pre.textContent || '');
    const prev = btn.textContent;
    btn.textContent = '¡Copiado!';
    setTimeout(() => (btn.textContent = prev), 1800);
  });
});
