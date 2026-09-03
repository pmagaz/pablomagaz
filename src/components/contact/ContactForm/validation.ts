/** Contact form validation. Runs on blur and again on submit. */

export interface ContactValues {
  name: string;
  email: string;
  message: string;
}

export type ContactField = keyof ContactValues;
export type ContactErrors = Partial<Record<ContactField, string>>;

export const emptyValues: ContactValues = { name: '', email: '', message: '' };

/** Deliberately permissive — real validation is the reply bouncing. */
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateField(field: ContactField, value: string): string | undefined {
  const trimmed = value.trim();

  switch (field) {
    case 'name':
      if (!trimmed) return 'Please tell me your name.';
      if (trimmed.length < 2) return 'That looks too short.';
      return undefined;

    case 'email':
      if (!trimmed) return 'An email address, so I can reply.';
      if (!EMAIL.test(trimmed)) return 'That does not look like an email address.';
      return undefined;

    case 'message':
      if (!trimmed) return 'A few lines about what you are working on.';
      if (trimmed.length < 10) return 'A little more detail, please.';
      return undefined;
  }
}

export function validateAll(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};

  for (const field of Object.keys(values) as ContactField[]) {
    const error = validateField(field, values[field]);
    if (error) errors[field] = error;
  }

  return errors;
}

export function hasErrors(errors: ContactErrors): boolean {
  return Object.keys(errors).length > 0;
}
