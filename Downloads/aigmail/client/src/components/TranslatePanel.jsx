import { useState } from 'react';
import { SectionTitle, Spinner } from './ui.jsx';
import { aiApi } from '../services/index.js';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const TRANSLATION_LANGUAGES = [
  { code: 'KN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'TA', label: 'Tamil', native: 'தமிழ்' },
];

/** Translate the email and/or its summary (spec section 11). */
export const TranslatePanel = ({ email }) => {
  const { meta } = useAuth();
  const toast = useToast();
  const [targetLanguage, setTargetLanguage] = useState('KN');
  const [scope, setScope] = useState('email');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const translate = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await aiApi.translate(email.id, { targetLanguage, scope });
      setResult(data);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-5">
      <SectionTitle>Translate</SectionTitle>

      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor={`translation-language-${email.id}`}>Translation language</label>
        <select
          id={`translation-language-${email.id}`}
          className="input w-auto"
          value={targetLanguage}
          onChange={(event) => { setTargetLanguage(event.target.value); setResult(null); setError(''); }}
        >
          {TRANSLATION_LANGUAGES.map((language) => (
            <option key={language.code} value={language.code}>
              {language.label} · {language.native}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor={`translation-scope-${email.id}`}>Text to translate</label>
        <select
          id={`translation-scope-${email.id}`}
          className="input w-auto"
          value={scope}
          onChange={(event) => { setScope(event.target.value); setResult(null); setError(''); }}
        >
          <option value="email">Email body only</option>
          <option value="summary" disabled={!email.summary}>AI summary only</option>
          <option value="both" disabled={!email.summary}>Email body + summary</option>
        </select>

        <button type="button" className="btn-secondary" onClick={translate} disabled={loading}>
          {loading ? <Spinner /> : null} Translate
        </button>

        {result?.engine && (
          <span className="ml-auto text-[11px] uppercase tracking-wide text-slate-400">
            engine: {result.engine}
          </span>
        )}
      </div>

      {!meta.ai?.live && (
        <p className="mt-3 text-xs text-slate-600">
          Full Kannada and Tamil translation needs an OpenAI or Groq API key on the server. This applies to both demo and Gmail accounts.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}

      {result && (
        <div className="mt-4 space-y-4">
          {result.summaryText && (
            <div>
              <p className="label">Summary ({result.targetLanguage})</p>
              <p className="whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{result.summaryText}</p>
            </div>
          )}
          {result.emailText && (
            <div>
              <p className="label">Email body ({result.targetLanguage})</p>
              <p className="max-h-72 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {result.emailText}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranslatePanel;
