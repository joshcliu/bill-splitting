import { BillItem, ItemAssignment, Participant } from '@/types';

export function calculateItemTotal(item: BillItem): number {
  return item.price * item.quantity;
}

export function calculateSubtotal(items: BillItem[]): number {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}

export function calculateParticipantOwed(
  participantId: string,
  items: BillItem[],
  assignments: ItemAssignment[],
  subtotal: number,
  tax: number,
  tip: number
): number {
  // Calculate the participant's share of items
  const itemsTotal = assignments
    .filter((a) => a.participantId === participantId)
    .reduce((sum, assignment) => sum + assignment.amount, 0);

  if (subtotal === 0) return 0;

  // Calculate proportional share of tax and tip
  const itemRatio = itemsTotal / subtotal;
  const taxShare = tax * itemRatio;
  const tipShare = tip * itemRatio;

  return itemsTotal + taxShare + tipShare;
}

export function splitItemEqually(
  item: BillItem,
  participantIds: string[]
): Omit<ItemAssignment, 'id'>[] {
  const totalAmount = calculateItemTotal(item);
  const splitPercentage = 1 / participantIds.length;
  const amountPerPerson = totalAmount / participantIds.length;

  return participantIds.map((participantId) => ({
    itemId: item.id,
    participantId,
    splitPercentage,
    amount: amountPerPerson,
  }));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function generateSessionCode(): string {
  // Generate a 6-character alphanumeric code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
