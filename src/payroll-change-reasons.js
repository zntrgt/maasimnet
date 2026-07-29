export const PAYROLL_CHANGE_REASON_TEXT = Object.freeze({
  decrease: 'Kümülatif matrah üst vergi dilimine geçti; net bu aydan itibaren düşer.',
  increase: 'Asgari ücret gelir vergisi istisnası üst dilime geçtiği için net bu ay yükselir.'
});

export function getPayrollChangeReasons(rows) {
  const reasons = new Map();
  let decreaseMarked = false;
  let increaseMarked = false;

  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1];
    const current = rows[index];
    const grossIsStable = current.grossKurus === previous.grossKurus;

    if (!grossIsStable) continue;

    if (
      !decreaseMarked
      && current.netKurus < previous.netKurus
      && current.payableIncomeTaxKurus > previous.payableIncomeTaxKurus
    ) {
      reasons.set(current.month, Object.freeze({
        type: 'decrease',
        text: PAYROLL_CHANGE_REASON_TEXT.decrease
      }));
      decreaseMarked = true;
    }

    if (
      !increaseMarked
      && current.netKurus > previous.netKurus
      && current.minimumWageIncomeTaxExemptionKurus > previous.minimumWageIncomeTaxExemptionKurus
    ) {
      reasons.set(current.month, Object.freeze({
        type: 'increase',
        text: PAYROLL_CHANGE_REASON_TEXT.increase
      }));
      increaseMarked = true;
    }
  }

  return reasons;
}
