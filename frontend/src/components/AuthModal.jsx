import { useEffect, useState } from 'react';

const DEFAULT_FORM = {
  email: '',
  password: '',
  confirmPassword: ''
};

export default function AuthModal({
  open,
  mode,
  isSubmitting,
  onModeChange,
  onSubmit,
  onClose
}) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(DEFAULT_FORM);
    setError('');
  }, [open, mode]);

  useEffect(() => {
    const onKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', onKeydown);
    }

    return () => window.removeEventListener('keydown', onKeydown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const isRegister = mode === 'register';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    const email = form.email.trim();
    if (!email) {
      setError('Введите email.');
      return;
    }

    if (!form.password) {
      setError('Введите пароль.');
      return;
    }

    if (isRegister && form.password !== form.confirmPassword) {
      setError('Пароли не совпадают.');
      return;
    }

    try {
      await onSubmit({ email, password: form.password }, mode);
      setForm(DEFAULT_FORM);
    } catch (submitError) {
      setError(submitError?.message || 'Ошибка авторизации.');
    }
  }

  return (
    <>
      <div className="auth-modal__overlay" onClick={onClose} aria-hidden="true" />

      <section
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        <header className="auth-modal__header">
          <h2 id="auth-modal-title">Личный кабинет</h2>
          <button type="button" onClick={onClose}>
            Закрыть
          </button>
        </header>

        <div className="auth-modal__tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => onModeChange('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'is-active' : ''}
            onClick={() => onModeChange('register')}
          >
            Регистрация
          </button>
        </div>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            placeholder="you@example.com"
            required
          />

          <label htmlFor="auth-password">Пароль</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
            placeholder="Минимум 8 символов"
            minLength={8}
            required
          />

          {isRegister && (
            <>
              <label htmlFor="auth-password-confirm">Повторите пароль</label>
              <input
                id="auth-password-confirm"
                type="password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
                placeholder="Повторите пароль"
                minLength={8}
                required
              />
            </>
          )}

          {error && <p className="auth-modal__error">{error}</p>}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем...' : isRegister ? 'Создать аккаунт' : 'Войти'}
          </button>
        </form>
      </section>
    </>
  );
}
