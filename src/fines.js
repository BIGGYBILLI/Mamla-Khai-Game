import { FINE_RULES, LICENSE_SURCHARGE } from './config.js';

export function createLedger() {
  return { items: [], version: 0 };
}

function addItem(ledger, key) {
  let item = ledger.items.find((i) => i.key === key);
  if (!item) {
    item = { key, amount: 0, count: 0, detailKey: null, detailVars: null };
    ledger.items.push(item);
  }
  return item;
}

/** Add a case. `amount` overrides the rule amount, `detailKey` is an i18n key. */
export function addFine(ledger, key, amount, detailKey, detailVars) {
  const rule = FINE_RULES[key];
  if (!rule) return null;
  const value = Math.round(amount === undefined || amount === null ? rule.amount : amount);
  if (value <= 0 && !detailKey) return null;
  const item = addItem(ledger, key);
  item.amount += value;
  item.count += 1;
  if (detailKey) {
    item.detailKey = detailKey;
    item.detailVars = detailVars || null;
  }
  ledger.version++;
  return item;
}

/** Idempotent case (over-speeding grows with your top speed). */
export function setFine(ledger, key, amount, detailKey, detailVars) {
  if (!FINE_RULES[key]) return null;
  const item = addItem(ledger, key);
  item.amount = Math.round(amount);
  item.count = 1;
  if (detailKey) {
    item.detailKey = detailKey;
    item.detailVars = detailVars || null;
  }
  ledger.version++;
  return item;
}

export function ledgerTotal(ledger) {
  return ledger.items.reduce((sum, i) => sum + i.amount, 0);
}

/** The things you chose before you even rolled off. */
export function applySetupFines(ledger, vehicleId, setup) {
  if (vehicleId === 'car' && !setup.seatbelt) addFine(ledger, 'noSeatbelt');
  if (vehicleId === 'bike' && !setup.helmet) addFine(ledger, 'noHelmet');

  if (vehicleId === 'bike' && setup.people >= 3) {
    addFine(ledger, 'tripleRide', undefined, 'detail.tripleRide', { n: setup.people });
  }
  if (vehicleId === 'car' && setup.people > 5) {
    addFine(ledger, 'overloading', undefined, 'detail.overloading', { n: setup.people });
  }
  if (!setup.license) addFine(ledger, 'noLicense');
}

/** Final challan. No licence adds 50% on top of everything else. */
export function buildBill(ledger, setup) {
  const rows = ledger.items.map((i) => ({
    key: i.key,
    amount: i.amount,
    count: i.count,
    detailKey: i.detailKey,
    detailVars: i.detailVars,
  }));

  let total = rows.reduce((sum, r) => sum + r.amount, 0);

  if (!setup.license) {
    const existing = rows.find((r) => r.key === 'noLicense');
    const others = total - (existing ? existing.amount : 0);
    const surcharge = Math.round(others * LICENSE_SURCHARGE);
    if (existing) {
      existing.amount += surcharge;
      existing.detailKey = 'detail.licenceSurcharge';
      existing.detailVars = null;
    } else {
      rows.push({
        key: 'noLicense',
        amount: surcharge,
        count: 1,
        detailKey: 'detail.licenceSurcharge',
        detailVars: null,
      });
    }
    total += surcharge;
  }

  return { rows, total };
}
