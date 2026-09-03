import { useState, type SyntheticEvent } from 'react';
import Button from '~/components/common/Button/Button';
import { contact } from '~/data/contact';
import './ContactForm.css';
import {
  emptyValues,
  hasErrors,
  validateAll,
  validateField,
  type ContactErrors,
  type ContactField,
  type ContactValues,
} from './validation';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const FIELDS: Array<{
  name: ContactField;
  label: string;
  placeholder: string;
  type: 'text' | 'email' | 'textarea';
}> = [
  { name: 'name', label: 'Name', placeholder: 'Your name', type: 'text' },
  { name: 'email', label: 'Email', placeholder: 'you@company.com', type: 'email' },
  { name: 'message', label: 'Message', placeholder: 'What are you working on?', type: 'textarea' },
];

/**
 * Contact form on the surface-tinted panel.
 *
 * The markup is a real Netlify form, so it is picked up from the static HTML
 * at deploy time and works without JavaScript. When JS is available the
 * submit is sent with fetch instead, which keeps the in-place success state.
 */
export default function ContactForm() {
  const [values, setValues] = useState<ContactValues>(emptyValues);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>('idle');

  function update(field: ContactField, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    // Clear an error as soon as the field becomes valid again.
    if (errors[field] && !validateField(field, value)) {
      setErrors((previous) => ({ ...previous, [field]: undefined }));
    }
  }

  function blur(field: ContactField) {
    setErrors((previous) => ({ ...previous, [field]: validateField(field, values[field]) }));
  }

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateAll(values);
    setErrors(found);
    if (hasErrors(found)) {
      return;
    }

    setStatus('submitting');

    try {
      const body = new URLSearchParams({ 'form-name': contact.formName, ...values });
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) throw new Error(`Netlify responded ${response.status}`);

      setStatus('success');
      setValues(emptyValues);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="pm-contact-form pm-contact-form--done">
        <p className="pm-contact-form__success-title">{contact.success.title}</p>
        <p className="pm-contact-form__success-body">{contact.success.body}</p>
      </div>
    );
  }

  return (
    <form
      className="pm-contact-form"
      name={contact.formName}
      method="post"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={submit}
      noValidate
    >
      {/* Required by Netlify when the submit is sent with fetch */}
      <input type="hidden" name="form-name" value={contact.formName} />
      <p className="pm-contact-form__honeypot">
        <label>
          Do not fill this in <input name="bot-field" tabIndex={-1} autoComplete="off" />
        </label>
      </p>

      {FIELDS.map((field) => {
        const error = errors[field.name];
        const errorId = `${field.name}-error`;

        return (
          <div
            className={`pm-contact-form__field${field.type === 'textarea' ? ' pm-contact-form__field--grow' : ''}`}
            key={field.name}
          >
            <label className="pm-contact-form__label" htmlFor={field.name}>
              {field.label}
            </label>

            {field.type === 'textarea' ? (
              <textarea
                className={`pm-contact-form__input pm-contact-form__textarea${error ? ' is-invalid' : ''}`}
                id={field.name}
                name={field.name}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
                onBlur={() => blur(field.name)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                required
              />
            ) : (
              <input
                className={`pm-contact-form__input${error ? ' is-invalid' : ''}`}
                id={field.name}
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={values[field.name]}
                onChange={(event) => update(field.name, event.target.value)}
                onBlur={() => blur(field.name)}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                required
              />
            )}

            {error && (
              <span className="pm-contact-form__error" id={errorId}>
                {error}
              </span>
            )}
          </div>
        );
      })}

      <Button type="submit" block disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </Button>

      {status === 'error' && (
        <p className="pm-contact-form__error" role="alert">
          That did not go through. Please try again, or email me directly.
        </p>
      )}
    </form>
  );
}
