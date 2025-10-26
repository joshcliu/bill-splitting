export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateSessionCode(code: string): boolean {
  // Session codes should be 6 alphanumeric characters
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
}

export function validateAmount(amount: number): boolean {
  return !isNaN(amount) && amount >= 0;
}

export function validatePercentage(percentage: number): boolean {
  return !isNaN(percentage) && percentage >= 0 && percentage <= 1;
}
