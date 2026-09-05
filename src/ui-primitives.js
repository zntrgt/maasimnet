(() => {
  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const tooltipDefinitions = [
    { test: /emekli|sgdp/i, title: 'SGDP nedir?', copy: 'Emekli olup çalışmaya devam ediyorsan normal çalışan primi yerine Sosyal Güvenlik Destek Primi uygulanır.' },
    { test: /engellilik/i, title: 'Engellilik indirimi', copy: 'Uygun çalışanlarda gelir vergisi matrahından aylık indirim yapılır. Derecen bordrondaki vergi hesabını etkileyebilir.' },
    { test: /kümülatif.*vergi.*matrah/i, title: 'Kümülatif vergi matrahı', copy: 'Yıl başından beri gelir vergisine esas kazançlarının toplamıdır. Vergi dilimin bu toplam yükseldikçe değişebilir.' },
    { test: /asgari.*ücret.*istisna/i, title: 'Asgari ücret vergi istisnası', copy: 'Asgari ücrete denk gelen gelir ve damga vergisi tutarı vergiden düşülür. Hesap bunu ilgili yılın kurallarıyla uygular.' },
    { test: /sgk.*tavan/i, title: 'SGK tavanı', copy: 'SGK primi kazançla sınırsız artmaz. Prime esas kazanç üst sınırının üzerindeki tutar SGK prim hesabına dahil edilmez.' },
    { test: /giydirilmiş.*brüt/i, title: 'Giydirilmiş brüt', copy: 'Son brüt maaşına düzenli yemek, yol, prim gibi para ile ölçülebilen yan hakların eklenmiş halidir.' }
  ];

  function closePopovers(except = null) {
    qsa('.ui-popover.is-open').forEach((panel) => {
      if (panel === except) return;
      panel.classList.remove('is-open');
      const trigger = panel._trigger;
      trigger?.setAttribute('aria-expanded', 'false');
    });
  }

  function positionPopover(trigger, panel) {
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(320, window.innerWidth - 24);
    const left = Math.max(12, Math.min(window.innerWidth - width - 12, rect.left + rect.width / 2 - width / 2));
    const preferredTop = rect.bottom + 8;
    const estimatedHeight = Math.max(90, panel.offsetHeight || 110);
    const top = preferredTop + estimatedHeight < window.innerHeight
      ? preferredTop
      : Math.max(12, rect.top - estimatedHeight - 8);
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  function bindTooltip(trigger) {
    if (trigger.dataset.uiTooltipBound === 'true') return;
    trigger.dataset.uiTooltipBound = 'true';
    trigger.type = 'button';
    trigger.classList.add('ui-tooltip-trigger');
    trigger.setAttribute('aria-expanded', 'false');
    const title = trigger.dataset.tooltipTitle || 'Bilgi';
    const copy = trigger.dataset.tooltipText || '';
    const panel = document.createElement('div');
    panel.className = 'ui-popover';
    panel.id = `ui-popover-${Math.random().toString(36).slice(2, 9)}`;
    panel.setAttribute('role', 'tooltip');
    panel.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;
    panel._trigger = trigger;
    document.body.appendChild(panel);
    trigger.setAttribute('aria-controls', panel.id);

    const open = () => {
      closePopovers(panel);
      positionPopover(trigger, panel);
      panel.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    };
    const close = () => {
      panel.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      panel.classList.contains('is-open') ? close() : open();
    });
    trigger.addEventListener('mouseenter', () => { if (window.matchMedia('(hover:hover)').matches) open(); });
    trigger.addEventListener('mouseleave', () => { if (window.matchMedia('(hover:hover)').matches) close(); });
    trigger.addEventListener('focus', () => { if (window.matchMedia('(hover:hover)').matches) open(); });
    window.addEventListener('resize', () => { if (panel.classList.contains('is-open')) positionPopover(trigger, panel); }, { passive: true });
    window.addEventListener('scroll', () => { if (panel.classList.contains('is-open')) positionPopover(trigger, panel); }, { passive: true });
  }

  function injectFinancialTooltips() {
    qsa('label, summary, .metric-title').forEach((node) => {
      if (node.querySelector?.('[data-ui-tooltip]')) return;
      const text = (node.textContent || '').trim();
      const definition = tooltipDefinitions.find((item) => item.test.test(text));
      if (!definition) return;
      const button = document.createElement('button');
      button.setAttribute('data-ui-tooltip', '');
      button.dataset.tooltipTitle = definition.title;
      button.dataset.tooltipText = definition.copy;
      button.setAttribute('aria-label', `${definition.title} hakkında bilgi`);
      node.append(' ', button);
      bindTooltip(button);
    });
    qsa('[data-ui-tooltip]').forEach(bindTooltip);
  }

  function normalizeQuickAmounts() {
    qsa('button[data-human-amount]').forEach((button) => {
      const value = Number(button.dataset.humanAmount || 0);
      if (!value) return;
      button.textContent = `${new Intl.NumberFormat('tr-TR').format(value)} ₺`;
      button.setAttribute('aria-label', `${new Intl.NumberFormat('tr-TR').format(value)} Türk lirasını maaş alanına yaz`);
    });
  }

  function extractTaxRate() {
    const badges = qsa('#payroll-body .tax-bracket-badge');
    const text = badges.at(-1)?.textContent || '';
    const match = text.match(/(15|20|27|35|40)/);
    return match ? `%${match[1]}` : '';
  }

  function enhanceMobileSummary() {
    const sticky = qs('[data-human-home-sticky]');
    const net = qs('#stat-avg-net');
    if (!sticky || !net || qs('.human-mobile-summary', sticky)) return;

    const summary = document.createElement('div');
    summary.className = 'human-mobile-summary';
    summary.innerHTML = `<div class="human-mobile-summary__copy"><span>Aylık ortalama netin</span><strong data-ui-sticky-net>—</strong><span class="human-mobile-summary__tax" data-ui-sticky-tax></span></div><button class="human-mobile-summary__detail" type="button">Detay</button>`;
    sticky.appendChild(summary);

    qs('.human-mobile-summary__detail', summary)?.addEventListener('click', () => {
      qs('.metric-hero')?.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center' });
    });

    const update = () => {
      const hasResult = document.body.classList.contains('human-has-result') && !/^(?:—|0|0,00)/.test((net.textContent || '').trim());
      const shouldSummarize = hasResult && window.scrollY > 360;
      sticky.classList.toggle('has-summary', shouldSummarize);
      const netTarget = qs('[data-ui-sticky-net]', summary);
      const taxTarget = qs('[data-ui-sticky-tax]', summary);
      if (netTarget) netTarget.textContent = (net.textContent || '—').trim();
      const rate = extractTaxRate();
      if (taxTarget) taxTarget.textContent = rate ? `Aralık vergi dilimi ${rate}` : '12 aylık bordro hazır';
    };

    window.addEventListener('scroll', update, { passive: true });
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['class'], subtree: false });
    new MutationObserver(update).observe(net, { childList: true, subtree: true, characterData: true });
    const payroll = qs('#payroll-body');
    if (payroll) new MutationObserver(update).observe(payroll, { childList: true, subtree: true, characterData: true });
    update();
  }

  function setBusy(button, busy, busyLabel = 'Hesaplanıyor') {
    if (!button) return;
    if (busy) {
      if (!button.dataset.idleLabel) button.dataset.idleLabel = button.textContent || '';
      button.setAttribute('aria-busy', 'true');
      button.disabled = true;
      button.textContent = busyLabel;
    } else {
      button.removeAttribute('aria-busy');
      button.disabled = false;
      if (button.dataset.idleLabel) button.textContent = button.dataset.idleLabel;
    }
  }

  function init() {
    injectFinancialTooltips();
    normalizeQuickAmounts();
    enhanceMobileSummary();
    document.addEventListener('click', () => closePopovers());
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closePopovers(); });
  }

  window.MaaisimUI = Object.freeze({ setBusy, refreshTooltips: injectFinancialTooltips });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
