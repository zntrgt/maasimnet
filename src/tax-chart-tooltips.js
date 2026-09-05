(() => {
  'use strict';

  const TOOLTIP_VERSION = 'v1';

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return [...root.querySelectorAll(selector)];
  }

  function parseCurrency(value) {
    const normalized = String(value || '')
      .replace(/[^0-9,.-]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Math.abs(value));
  }

  function readPayrollRows() {
    return qsa('#payroll-body > tr').map((row) => {
      const cells = [...row.children].filter((cell) => cell.tagName === 'TD');
      if (cells.length < 8) return null;
      const month = cells[0]?.textContent?.trim();
      const netText = cells[4]?.textContent?.trim() || '';
      const bracket = qs('.tax-bracket-badge', row)?.textContent?.trim()
        || cells.find((cell) => /%\s*(15|20|27|35|40)/.test(cell.textContent || ''))?.textContent?.trim()
        || '';
      if (!month || !netText) return null;
      return { month, netText, net: parseCurrency(netText), bracket };
    }).filter(Boolean).slice(0, 12);
  }

  function differenceText(rows, index) {
    if (index === 0) return 'Yılın ilk ayı';
    const difference = rows[index].net - rows[index - 1].net;
    if (Math.abs(difference) < 0.005) return 'Önceki ayla aynı';
    return `Önceki aya göre ${difference > 0 ? '+' : '−'}${formatCurrency(difference)}`;
  }

  function closeAll(container, except = null) {
    qsa('.enterprise-tax-bar[data-tooltip-open="true"]', container).forEach((bar) => {
      if (bar === except) return;
      bar.dataset.tooltipOpen = 'false';
      bar.setAttribute('aria-expanded', 'false');
    });
  }

  function enhanceBars(container) {
    const rows = readPayrollRows();
    const bars = qsa('.enterprise-tax-bar', container);
    if (!rows.length || bars.length !== rows.length) return;

    bars.forEach((bar, index) => {
      const row = rows[index];
      const tooltipId = `enterprise-tax-tooltip-${index}`;
      const delta = differenceText(rows, index);

      bar.dataset.taxTooltip = TOOLTIP_VERSION;
      bar.dataset.tooltipOpen = 'false';
      bar.setAttribute('tabindex', '0');
      bar.setAttribute('role', 'button');
      bar.setAttribute('aria-expanded', 'false');
      bar.setAttribute('aria-describedby', tooltipId);
      bar.setAttribute(
        'aria-label',
        `${row.month}: net maaş ${row.netText}${row.bracket ? `, vergi dilimi ${row.bracket}` : ''}. ${delta}.`
      );

      let tooltip = qs('.enterprise-tax-tooltip', bar);
      if (!tooltip) {
        tooltip = document.createElement('span');
        tooltip.className = 'enterprise-tax-tooltip';
        tooltip.setAttribute('role', 'tooltip');
        bar.appendChild(tooltip);
      }
      tooltip.id = tooltipId;
      tooltip.innerHTML = `
        <span class="enterprise-tax-tooltip__month">${row.month}</span>
        <strong>${row.netText}</strong>
        <span class="enterprise-tax-tooltip__delta">${delta}</span>
        ${row.bracket ? `<span class="enterprise-tax-tooltip__rate">Vergi dilimi ${row.bracket}</span>` : ''}
      `;
    });
  }

  function initialize() {
    const container = qs('[data-enterprise-tax-bars]');
    if (!container || container.dataset.tooltipController === TOOLTIP_VERSION) return;
    container.dataset.tooltipController = TOOLTIP_VERSION;
    container.removeAttribute('aria-hidden');

    const refresh = () => enhanceBars(container);
    new MutationObserver(refresh).observe(container, { childList: true, subtree: false });
    refresh();

    container.addEventListener('click', (event) => {
      const bar = event.target.closest('.enterprise-tax-bar');
      if (!bar || !container.contains(bar)) return;
      const willOpen = bar.dataset.tooltipOpen !== 'true';
      closeAll(container, bar);
      bar.dataset.tooltipOpen = String(willOpen);
      bar.setAttribute('aria-expanded', String(willOpen));
    });

    container.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const bar = event.target.closest('.enterprise-tax-bar');
      if (!bar) return;
      event.preventDefault();
      bar.click();
    });

    container.addEventListener('focusout', (event) => {
      if (event.relatedTarget && container.contains(event.relatedTarget)) return;
      closeAll(container);
    });

    document.addEventListener('pointerdown', (event) => {
      if (!container.contains(event.target)) closeAll(container);
    }, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
