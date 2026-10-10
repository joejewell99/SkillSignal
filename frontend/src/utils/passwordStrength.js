import zxcvbn from 'zxcvbn';

export function assessPassword(password, name = '', email = '') {
  const length = Array.from(password).length;
  const bytes = new TextEncoder().encode(password).length;
  const inputs = ['skillsignal', name, email, ...name.split(/\s+/), email.split('@')[0]]
    .map(value => value.toLowerCase()).filter(Boolean);
  // Bound estimator work and respect the existing BCrypt storage limit.
  const result = bytes <= 72 ? zxcvbn(password, inputs) : null;
  const baseWord = password.toLowerCase().replace(/[^a-z]/g, '');
  const predictable = baseWord.length > 0 && [...inputs, 'password', 'welcome', 'letmein', 'qwerty', 'admin']
    .some(value => value.replace(/[^a-z]/g, '') === baseWord);
  const score = predictable ? Math.min(result?.score ?? 0, 1) : (result?.score ?? 0);
  const obviouslyWeak = predictable || (password.length > 0 && bytes <= 72 && score === 0);
  let guidance = '';
  if (bytes > 72) guidance = 'This password is too long for our password storage. Use fewer characters (up to 72 UTF-8 bytes).';
  else if (length >= 8 && obviouslyWeak) guidance = 'This password is easy to guess. Try a longer mix of uppercase and lowercase letters, numbers (e.g. 4, 7) and symbols (e.g. !, ?, #), or combine three unrelated words. Avoid obvious choices like Password123! and use a password unique to this account.';
  return { score, label: ['Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][score],
    acceptable: length >= 8 && bytes <= 72 && !obviouslyWeak, guidance };
}
