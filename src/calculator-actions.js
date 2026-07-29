/**
 * Hesaplama düğmesinin ortak davranışı.
 * Hesaplama callback'i çalıştırılır; mobilde bordro tablosuna yumuşak kaydırma yapılır.
 */
export function runCalculationAndFocusPayroll({
  calculate,
  payrollElement,
  viewportWidth,
  mobileBreakpoint = 768
}) {
  if (typeof calculate !== 'function') {
    throw new TypeError('calculate bir fonksiyon olmalıdır.');
  }

  calculate();

  if (
    viewportWidth < mobileBreakpoint &&
    payrollElement &&
    typeof payrollElement.scrollIntoView === 'function'
  ) {
    payrollElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    return true;
  }

  return false;
}
