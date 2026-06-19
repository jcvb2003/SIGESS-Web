import type { PaymentType } from '../types/finance.types';

export function isExtraFeeBlockedByHistoricMember(paymentType: PaymentType): boolean {
  return paymentType === "inicial" || paymentType === "transferencia";
}
