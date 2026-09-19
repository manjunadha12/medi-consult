/**
 * Critical Panic Limits and Urgent Clinical Alerts
 */
export const CRITICAL_PANIC_LIMITS = {
  HEM_HGB: { panicLow: 7.0, panicHigh: 20.0, unit: "g/dL", alert: "Severe Anemia / Polycythemia Risk" },
  HEM_PLT: { panicLow: 50.0, panicHigh: 1000.0, unit: "10^3/uL", alert: "Severe Thrombocytopenia / Thrombocytosis" },
  MET_GLU_FAST: { panicLow: 50, panicHigh: 300, unit: "mg/dL", alert: "Severe Hypoglycemia / Hyperglycemia" },
  REN_CREAT: { panicHigh: 4.0, unit: "mg/dL", alert: "Acute Kidney Injury / Renal Failure Risk" }
};

export function checkCriticalPanic(code, value) {
  if (typeof value !== 'number' || isNaN(value)) return null;
  const panic = CRITICAL_PANIC_LIMITS[code];
  if (!panic) return null;

  if (panic.panicLow !== undefined && value <= panic.panicLow) {
    return { isPanic: true, alert: panic.alert, direction: "CRITICALLY_LOW" };
  }
  if (panic.panicHigh !== undefined && value >= panic.panicHigh) {
    return { isPanic: true, alert: panic.alert, direction: "CRITICALLY_HIGH" };
  }
  return null;
}

export default checkCriticalPanic;
