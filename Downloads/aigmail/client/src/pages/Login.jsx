import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../services/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import './Login.css';

const DEMO_EMAIL = 'demo.user@gmail.com';
const DEMO_PASSWORD = 'demo1234';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EyeIcon = ({ hidden = false }) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    {hidden ? (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
        <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5 0 8.5 4.2 9.4 5.5a1 1 0 0 1 0 1 15 15 0 0 1-2.1 2.6" />
        <path d="M6.6 6.6a15.8 15.8 0 0 0-4 3 1 1 0 0 0 0 1C3.5 11.8 7 16 12 16c.8 0 1.6-.1 2.3-.3" />
      </>
    ) : (
      <>
        <path d="M2.6 9.5C3.5 8.2 7 4 12 4s8.5 4.2 9.4 5.5a1 1 0 0 1 0 1C20.5 11.8 17 16 12 16s-8.5-4.2-9.4-5.5a1 1 0 0 1 0-1Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    )}
  </svg>
);

const AlertIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6M12 17h.01" />
  </svg>
);

const CheckIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m5 12 4 4L19 6" />
  </svg>
);

const GoogleMark = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="8.5" />
    <path d="M20.2 12H12M16.9 18.4A8.5 8.5 0 1 1 17 5.7" />
  </svg>
);

const BrandMark = () => (
  <span className="login-brand-mark" aria-hidden="true">
    <svg viewBox="0 0 32 32" fill="none">
      <path d="M5.5 8.5h21v15h-21z" stroke="currentColor" strokeWidth="1.8" />
      <path d="m6.5 9.5 9.5 8 9.5-8" stroke="currentColor" strokeWidth="1.8" />
      <path d="m6.5 22.5 6.8-6M25.5 22.5l-6.8-6" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  </span>
);

const LoadingMark = () => <span className="login-spinner" aria-hidden="true" />;

const InboxPreview = () => {
  const rows = [
    { avatar: 'AK', sender: 'Aarav Khanna', subject: 'Design review notes', time: '10:42', tone: 'teal', unread: true },
    { avatar: 'NP', sender: 'Nina Patel', subject: 'Q4 planning document', time: '9:18', tone: 'navy', unread: true },
    { avatar: 'RS', sender: 'Rohan Shah', subject: 'Thursday lunch', time: 'Yesterday', tone: 'sand' },
    { avatar: 'CL', sender: 'Cloudline', subject: 'Your October invoice', time: 'Yesterday', tone: 'slate' },
    { avatar: 'MT', sender: 'Maya Thomas', subject: 'Photos from the offsite', time: 'Mon', tone: 'teal' },
  ];

  return (
    <aside className="login-preview" aria-label="Product preview">
      <div className="preview-haze preview-haze-one" />
      <div className="preview-haze preview-haze-two" />
      <div className="preview-window" aria-hidden="true">
        <div className="preview-topbar">
          <BrandMark />
          <div className="preview-search"><span /> <i /></div>
          <div className="preview-user">DG</div>
        </div>
        <div className="preview-body">
          <div className="preview-sidebar">
            <div className="preview-compose">Compose</div>
            <div className="preview-nav-item active"><span />Inbox <b>8</b></div>
            <div className="preview-nav-item"><span />Starred</div>
            <div className="preview-nav-item"><span />Sent</div>
            <div className="preview-nav-item"><span />Drafts <b>2</b></div>
            <div className="preview-label" />
            <div className="preview-label short" />
          </div>
          <div className="preview-mail">
            <div className="preview-mail-header">
              <div><p>Inbox</p><span>Tuesday, 27 October</span></div>
              <div className="preview-header-actions"><i /><i /><i /></div>
            </div>
            <div className="preview-tabs"><span className="active">Primary</span><span>Updates</span><span>Receipts</span></div>
            <div className="preview-mail-list">
              {rows.map((row) => (
                <div className={`preview-row${row.unread ? ' unread' : ''}`} key={row.sender}>
                  <span className={`preview-avatar ${row.tone}`}>{row.avatar}</span>
                  <span className="preview-copy"><b>{row.sender}</b><small>{row.subject}</small></span>
                  <time>{row.time}</time>
                </div>
              ))}
            </div>
            <div className="preview-summary">
              <span className="preview-spark">✦</span>
              <div><b>Today at a glance</b><p>3 messages need a reply · 1 deadline tomorrow</p></div>
              <span className="preview-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
      <p className="preview-caption"><span>8</span> unread · <span>3</span> need a reply</p>
    </aside>
  );
};

export const Login = () => {
  const { isAuthenticated, demoLogin, loading } = useAuth();
  const [status, setStatus] = useState(null);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitState, setSubmitState] = useState('idle');
  const [shakeKey, setShakeKey] = useState(0);
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const passwordRef = useRef(null);

  useEffect(() => {
    authApi.status().then(setStatus).catch(() => setStatus({ googleOAuthEnabled: false, demoLoginEnabled: true }));
    const oauthError = params.get('error');
    if (oauthError) setFormError('Google sign-in could not be completed. Please try again.');
  }, [params]);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (step === 'password') passwordRef.current?.focus();
  }, [step]);

  const validateEmail = (value = email) => {
    if (!value.trim() || !EMAIL_PATTERN.test(value.trim())) return 'Enter a valid email address';
    return '';
  };

  const validatePassword = (value = password) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    return '';
  };

  const handleEmailBlur = () => {
    setTouched((current) => ({ ...current, email: true }));
    setFieldErrors((current) => ({ ...current, email: validateEmail() }));
  };

  const handlePasswordBlur = () => {
    setTouched((current) => ({ ...current, password: true }));
    setFieldErrors((current) => ({ ...current, password: validatePassword() }));
  };

  const continueToPassword = (event) => {
    event.preventDefault();
    const emailError = validateEmail();
    setTouched((current) => ({ ...current, email: true }));
    setFieldErrors((current) => ({ ...current, email: emailError }));
    setFormError('');
    if (emailError) return;
    setStep('password');
  };

  const failCredentials = (message) => {
    setPassword('');
    setCapsLock(false);
    setSubmitState('failed');
    setFormError(message);
    setShakeKey((value) => value + 1);
    window.requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const handleSignIn = async (event) => {
    event.preventDefault();
    const passwordError = validatePassword();
    setTouched((current) => ({ ...current, password: true }));
    setFieldErrors((current) => ({ ...current, password: passwordError }));
    setFormError('');
    if (passwordError) return;

    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      failCredentials(
        email.trim().toLowerCase() === DEMO_EMAIL
          ? 'That demo password is incorrect. Enter demo1234.'
          : 'This account signs in securely with Google. Use the Google option below.',
      );
      return;
    }

    setSubmitState('loading');
    try {
      await demoLogin({ staySignedIn });
      setSubmitState('success');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      failCredentials(error.message || 'Sign-in failed. Please try again.');
    }
  };

  const returnToEmail = () => {
    setStep('email');
    setPassword('');
    setFieldErrors((current) => ({ ...current, password: '' }));
    setFormError('');
    setSubmitState('idle');
  };

  const resetFailedState = () => {
    if (submitState === 'failed') setSubmitState('idle');
    if (formError) setFormError('');
  };

  const buttonContent = {
    idle: 'Sign in',
    loading: <><LoadingMark />Sign in</>,
    success: <><span className="button-icon"><CheckIcon /></span>Signed in</>,
    failed: 'Try again',
  };

  const emailError = touched.email ? fieldErrors.email : '';
  const passwordError = touched.password ? fieldErrors.password : '';
  const disabled = submitState === 'loading' || submitState === 'success' || loading;

  return (
    <main className="login-shell">
      <section className="login-form-pane">
        <div className="login-form-wrap">
          <header className="login-brand">
            <BrandMark />
            <span>Mail</span>
          </header>

          <div className="login-stage" data-step={step}>
            <div className={`login-step login-step-email${step === 'email' ? ' active' : ''}`} aria-hidden={step !== 'email'}>
              <div className="login-heading">
                <p className="login-eyebrow">Your inbox, ready when you are</p>
                <h1>Sign in to Mail</h1>
                <p>Start with the email address for your account.</p>
              </div>

              <form onSubmit={continueToPassword} noValidate>
                <div className={`login-field${emailError ? ' has-error' : ''}${email ? ' is-filled' : ''}`}>
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    name="username"
                    type="email"
                    inputMode="email"
                    autoComplete="username"
                    autoFocus
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (touched.email) setFieldErrors((current) => ({ ...current, email: validateEmail(event.target.value) }));
                    }}
                    onBlur={handleEmailBlur}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'login-email-error' : undefined}
                    disabled={disabled}
                  />
                  <p className="field-message" id="login-email-error">{emailError || '\u00A0'}</p>
                </div>

                <button className="login-primary" type="submit" disabled={disabled}>Continue</button>

                <p className="demo-hint">
                  Exploring the app? Use <button type="button" onClick={() => setEmail(DEMO_EMAIL)}>{DEMO_EMAIL}</button>
                </p>

                <div className="login-divider"><span>or</span></div>

                {status?.googleOAuthEnabled ? (
                  <a className="login-provider" href={authApi.googleLoginUrl()}>
                    <span className="provider-icon"><GoogleMark /></span>
                    Continue securely with Google
                  </a>
                ) : (
                  <button className="login-provider" type="button" disabled>
                    <span className="provider-icon"><GoogleMark /></span>
                    Google sign-in not configured
                  </button>
                )}
                {step === 'email' && formError && (
                  <div className="form-status email-status" aria-live="polite" aria-atomic="true">
                    <p><AlertIcon />{formError}</p>
                  </div>
                )}
              </form>
            </div>

            <div className={`login-step login-step-password${step === 'password' ? ' active' : ''}`} aria-hidden={step !== 'password'}>
              <div className="login-heading">
                <p className="login-eyebrow">Demo mailbox</p>
                <h1>Enter your password</h1>
                <p>Use the demo credential below. It stays in this browser and is never sent to the server.</p>
              </div>

              <button className="login-account" type="button" onClick={returnToEmail} disabled={disabled} aria-label="Use a different account">
                <span>{email.slice(0, 1).toUpperCase()}</span>
                <strong>{email}</strong>
                <small>Change</small>
              </button>

              <form key={shakeKey} className={submitState === 'failed' ? 'login-shake' : ''} onSubmit={handleSignIn} noValidate>
                <div className={`login-field${passwordError ? ' has-error' : ''}${password ? ' is-filled' : ''}`}>
                  <div className="password-label-row">
                    <label htmlFor="login-password">Password</label>
                    <a href="https://accounts.google.com/signin/recovery">Forgot password?</a>
                  </div>
                  <div className="password-input-wrap">
                    <input
                      ref={passwordRef}
                      id="login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        resetFailedState();
                        if (touched.password) setFieldErrors((current) => ({ ...current, password: validatePassword(event.target.value) }));
                      }}
                      onBlur={handlePasswordBlur}
                      onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                      onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
                      aria-invalid={Boolean(passwordError || formError)}
                      aria-describedby={[passwordError ? 'login-password-error' : '', capsLock ? 'login-caps-warning' : ''].filter(Boolean).join(' ') || undefined}
                      disabled={disabled}
                    />
                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      disabled={disabled}
                    >
                      <EyeIcon hidden={showPassword} />
                    </button>
                  </div>
                  <p className="field-message" id="login-password-error">{passwordError || '\u00A0'}</p>
                  {capsLock && <p className="caps-warning" id="login-caps-warning"><AlertIcon />Caps Lock is on</p>}
                </div>

                <label className="login-checkbox">
                  <input
                    type="checkbox"
                    name="staySignedIn"
                    checked={staySignedIn}
                    onChange={(event) => setStaySignedIn(event.target.checked)}
                    disabled={disabled}
                  />
                  <span><strong>Stay signed in</strong><small>Leave unchecked on a shared device</small></span>
                </label>

                <div className="form-status" aria-live="polite" aria-atomic="true">
                  {formError && <p><AlertIcon />{formError}</p>}
                </div>

                <button className={`login-primary is-${submitState}`} type="submit" disabled={disabled}>
                  {buttonContent[submitState]}
                </button>

                <button className="login-different-account" type="button" onClick={returnToEmail} disabled={disabled}>
                  Use a different account
                </button>

                <p className="demo-credential">Demo password: <strong>{DEMO_PASSWORD}</strong></p>

                {status?.googleOAuthEnabled && (
                  <a className="login-provider compact" href={authApi.googleLoginUrl()}>
                    <span className="provider-icon"><GoogleMark /></span>
                    Continue with Google instead
                  </a>
                )}
              </form>
            </div>
          </div>

          <footer className="login-footer">
            <span>Private by design</span>
            <span aria-hidden="true">·</span>
            <span>Session protected</span>
          </footer>
        </div>
      </section>
      <InboxPreview />
    </main>
  );
};

export default Login;
