// Practical public email syntax: dot-atom local part and a dotted DNS domain.
const emailPattern = new RegExp("^(?=.{1,254}$)(?=.{1,64}@)[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+[A-Za-z]{2,63}$");
export const EMAIL_ERROR = 'Enter a valid email address, such as you@example.com.';
export const isValidEmail = value => typeof value === 'string' && emailPattern.test(value);
export function validateEmailInput(input) {
  input.setCustomValidity(!input.value || isValidEmail(input.value) ? '' : EMAIL_ERROR);
}
