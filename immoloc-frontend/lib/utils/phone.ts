// Format E.164 international — même regex que le backend
export const E164_REGEX = /^\+[1-9]\d{6,14}$/;

export function isValidPhone(phone: string): boolean {
  return E164_REGEX.test(phone);
}

export function formatPhoneDisplay(phone: string): string {
  // "+221771234567" → "+221 77 123 45 67"
  if (!phone.startsWith('+')) return phone;
  const digits = phone.slice(1);
  const cc = digits.length >= 12 ? digits.slice(0, 3) : digits.slice(0, 2);
  const rest = digits.slice(cc.length).replace(/(\d{2})(?=\d)/g, '$1 ');
  return `+${cc} ${rest}`.trim();
}
