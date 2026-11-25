import {DATA_2026} from './data-2026.js';
export const DAILY_WAGE_2026=Object.freeze({days:30,hours:DATA_2026.publishedData.overtime.standardMonthlyHours,grossKurus:DATA_2026.payroll.minimumGrossKurus,netKurus:DATA_2026.payroll.referenceMinimumNetKurus});
export function dailyWage(monthlyKurus,kind='gross'){
 if(!Number.isSafeInteger(monthlyKurus)||monthlyKurus<=0||monthlyKurus>1000000000)throw new RangeError('Aylık ücret 0 TL üzerinde ve en fazla 10.000.000 TL olmalı.');
 if(!['gross','net'].includes(kind))throw new RangeError('Brüt veya net ücret türünü seç.');
 return Object.freeze({kind,monthlyKurus,dailyKurus:Math.round(monthlyKurus/DAILY_WAGE_2026.days),hourlyKurus:Math.round(monthlyKurus/DAILY_WAGE_2026.hours)});
}
