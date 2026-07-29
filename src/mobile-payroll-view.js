/**
 * Mobil bordroyu dört kolonlu, düzenlenebilir bir tablo olarak üretir.
 * Hesaplama yapmaz; yalnızca mevcut bordro satırlarını sunar.
 */
export function renderMobilePayrollRows({
  payrolls,
  months,
  currentMode,
  openDetails,
  formatCurrency,
  formatInputMoney,
  renderPayrollDetail
}) {
  return payrolls.map((row) => {
    const monthName = months[row.month];
    const isOpen = openDetails.has(row.month);
    const disabledAttribute = currentMode === 'net' ? 'disabled' : '';

    return `<tr class="mobile-summary-row">
      <th scope="row" class="mobile-month-cell">${monthName}</th>
      <td class="mobile-gross-cell">
        <input type="text" inputmode="decimal" value="${formatInputMoney(row.baseGross)}" ${disabledAttribute}
          onkeydown="handleTableInputKeydown(event)"
          onchange="updateBaseGrossFromMonth(${row.month}, this.value)"
          aria-label="${monthName} brüt maaş"
          title="Bu değer ${monthName} ayı ve sonraki aylara uygulanır"
          class="mobile-gross-input">
        ${row.extraGross ? `<span class="mobile-extra-note">+ ${formatCurrency(row.extraGross)} ek</span>` : ''}
      </td>
      <td class="mobile-net-cell">${formatCurrency(row.net)}</td>
      <td class="mobile-detail-cell">
        <button type="button" onclick="togglePayrollDetail(${row.month})"
          aria-expanded="${isOpen}" aria-controls="mobile-payroll-detail-${row.month}"
          class="mobile-detail-button">
          <span>${isOpen ? 'Kapat' : 'Detay'}</span>
          <span aria-hidden="true">${isOpen ? '↑' : '↓'}</span>
        </button>
      </td>
    </tr>
    <tr id="mobile-payroll-detail-${row.month}" class="mobile-detail-row" ${isOpen ? '' : 'hidden'}>
      <td colspan="4">
        <div class="mobile-extra-editor">
          <label for="mobile-extra-${row.month}">Ek Brüt</label>
          <input id="mobile-extra-${row.month}" type="text" inputmode="decimal"
            value="${row.extraGross ? formatInputMoney(row.extraGross) : ''}" placeholder="0" ${disabledAttribute}
            onkeydown="handleTableInputKeydown(event)"
            onchange="updateExtraGrossForMonth(${row.month}, this.value)"
            aria-label="${monthName} ek brüt ödeme"
            title="Yalnızca ${monthName} ayına uygulanır"
            class="mobile-extra-input">
        </div>
        ${renderPayrollDetail(row)}
      </td>
    </tr>`;
  }).join('');
}
