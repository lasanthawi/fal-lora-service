import { useUser, UserButton } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import {
  OCCASIONS,
  CLOTHING_OPTIONS,
  POSES_AND_MOODS,
  VIBES,
  SURROUNDINGS,
  PRESETS,
} from '../lib/prompt-options';

const PRESET_NAMES = Object.keys(PRESETS);

type PublishResult = {
  success: boolean;
  error?: string;
  generation?: unknown;
  instagram?: unknown;
} | null;

type RandomPreview = {
  image_url: string;
  caption: string;
  theme: string;
  shot_type: string;
} | null;

export default function PanelView() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
  const hasSeenUser = useRef(false);
  const [postIdea, setPostIdea] = useState('');
  const [occasion, setOccasion] = useState('');
  const [vibe, setVibe] = useState('');
  const [mood, setMood] = useState('');
  const [clothing, setClothing] = useState('');
  const [expression, setExpression] = useState('');
  const [surrounding, setSurrounding] = useState('');
  const [preset, setPreset] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublishResult>(null);

  // Random post flow: step 1 preview, step 2 publish
  const [randomPreview, setRandomPreview] = useState<RandomPreview>(null);
  const [randomPreviewCaption, setRandomPreviewCaption] = useState('');
  const [randomLoading, setRandomLoading] = useState(false);
  const [randomPublishLoading, setRandomPublishLoading] = useState(false);
  const [randomPublishResult, setRandomPublishResult] = useState<PublishResult>(null);

  if (user) hasSeenUser.current = true;

  useEffect(() => {
    if (user === undefined) return;
    if (!user) router.replace('/handler/signin');
  }, [user, router]);

  const applyPreset = (name: string) => {
    const p = PRESETS[name];
    if (!p) return;
    setPreset(name);
    if (p.postIdea != null) setPostIdea(p.postIdea);
    if (p.occasion != null) setOccasion(p.occasion);
    if (p.vibe != null) setVibe(p.vibe);
    if (p.mood != null) setMood(p.mood);
    if (p.clothing != null) setClothing(p.clothing);
    if (p.expression != null) setExpression(p.expression);
    if (p.surrounding != null) setSurrounding(p.surrounding);
  };

  const commitFocusedField = () => {
    if (typeof document === 'undefined') return;
    const activeElement = document.activeElement;
    if (activeElement instanceof HTMLElement) activeElement.blur();
  };

  const getTrimmedFormValue = (formData: FormData, key: string): string => {
    const value = formData.get(key);
    return typeof value === 'string' ? value.trim() : '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, string> = {};
      const presetValue = getTrimmedFormValue(formData, 'preset');
      const postIdeaValue = getTrimmedFormValue(formData, 'postIdea');
      const occasionValue = getTrimmedFormValue(formData, 'occasion');
      const vibeValue = getTrimmedFormValue(formData, 'vibe');
      const moodValue = getTrimmedFormValue(formData, 'mood');
      const clothingValue = getTrimmedFormValue(formData, 'clothing');
      const expressionValue = getTrimmedFormValue(formData, 'expression');
      const surroundingValue = getTrimmedFormValue(formData, 'surrounding');
      const captionValue = getTrimmedFormValue(formData, 'caption');

      if (presetValue) body.preset = presetValue;
      if (postIdeaValue) body.postIdea = postIdeaValue;
      if (occasionValue) body.occasion = occasionValue;
      if (vibeValue) body.vibe = vibeValue;
      if (moodValue) body.mood = moodValue;
      if (clothingValue) body.clothing = clothingValue;
      if (expressionValue) body.expression = expressionValue;
      if (surroundingValue) body.surrounding = surroundingValue;
      if (captionValue) body.caption = captionValue;

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const raw = await res.text();
      let data: PublishResult;
      try {
        data = raw
          ? (JSON.parse(raw) as PublishResult)
          : { success: false, error: `Request failed (${res.status})` };
      } catch {
        data = { success: false, error: `Request failed (${res.status})` };
      }
      setResult(data);
      if (!res.ok) return;
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleRandomGenerate = async () => {
    setRandomLoading(true);
    setRandomPreview(null);
    setRandomPreviewCaption('');
    setRandomPublishResult(null);
    try {
      const res = await fetch('/api/random-preview', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setRandomPublishResult({ success: false, error: data.error || res.statusText });
        return;
      }
      setRandomPreview({
        image_url: data.image_url,
        caption: data.caption ?? '',
        theme: data.theme ?? '',
        shot_type: data.shot_type ?? '',
      });
      setRandomPreviewCaption(data.caption ?? '');
    } catch (err) {
      setRandomPublishResult({ success: false, error: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setRandomLoading(false);
    }
  };

  const handleRandomPublish = async () => {
    if (!randomPreview?.image_url) return;
    setRandomPublishLoading(true);
    setRandomPublishResult(null);
    try {
      const res = await fetch('/api/publish-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: randomPreview.image_url,
          caption: randomPreviewCaption.trim() || randomPreview.caption,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRandomPublishResult({ success: false, error: data.error || res.statusText });
        return;
      }
      setRandomPublishResult({
        success: true,
        instagram: data.instagram,
      });
    } catch (err) {
      setRandomPublishResult({ success: false, error: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setRandomPublishLoading(false);
    }
  };

  // Only show loading on initial auth check. Once we've shown the form, don't flip back
  // when useUser briefly returns undefined on re-renders (e.g. while typing), so input state isn't lost.
  if (!hasSeenUser.current && user === undefined) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Loading</span>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Redirecting</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1><span className="header-wordmark">Create</span></h1>
        <div className="user-meta">
          <span>{user.displayName ?? user.primaryEmail ?? 'Account'}</span>
          <UserButton />
        </div>
      </header>

      <main className="app-main">
        <div className="page-hero">
          <h2>Generate{' & '}publish</h2>
          <p>Set the scene and style. One click to generate an image and post to Instagram.</p>
        </div>

        <section className="card card--random">
          <h3 className="card-title">Random post</h3>
          <p className="card-desc">
            <strong>Step 1:</strong> Generate a random image and caption (same as test generate). <strong>Step 2:</strong> Review URL and caption below, edit if needed, then confirm to publish to Instagram (same as test Instagram post).
          </p>
          <div className="random-flow">
            <div className="random-step">
              <span className="random-step-label">Step 1</span>
              <button
                type="button"
                onClick={handleRandomGenerate}
                disabled={randomLoading}
                className="btn btn-secondary"
              >
                {randomLoading ? 'Generating…' : 'Generate random (image + caption)'}
              </button>
            </div>
            {randomPreview && (
              <div className="random-preview">
                <div className="random-preview-image">
                  <span className="label">Image URL (for confirmation)</span>
                  <div className="random-preview-url-row">
                    <a href={randomPreview.image_url} target="_blank" rel="noopener noreferrer" className="random-preview-link">
                      {randomPreview.image_url}
                    </a>
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => {
                        navigator.clipboard?.writeText(randomPreview.image_url);
                      }}
                      aria-label="Copy image URL"
                    >
                      Copy URL
                    </button>
                  </div>
                  <img src={randomPreview.image_url} alt="Generated preview" className="random-preview-img" />
                </div>
                <div className="random-preview-meta">
                  <span className="label">Theme</span> {randomPreview.theme}
                  <span className="label" style={{ marginTop: 8 }}>Shot</span> {randomPreview.shot_type}
                </div>
                <div className="random-preview-caption">
                  <label className="label" htmlFor="random-caption">Caption (editable before publish)</label>
                  <textarea
                    id="random-caption"
                    className="textarea"
                    value={randomPreviewCaption}
                    onChange={(e) => setRandomPreviewCaption(e.target.value)}
                    rows={4}
                    placeholder="Caption for Instagram"
                  />
                </div>
                <div className="random-step">
                  <span className="random-step-label">Step 2</span>
                  <button
                    type="button"
                    onClick={handleRandomPublish}
                    disabled={randomPublishLoading}
                    className="btn btn-primary"
                  >
                    {randomPublishLoading ? 'Publishing…' : 'Confirm & publish to Instagram'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {randomPublishResult && (
            <div className={`result-box ${randomPublishResult.success ? 'success' : 'error'}`} style={{ marginTop: 16 }}>
              {randomPublishResult.success ? (
                <>
                  <strong>Published to Instagram.</strong>
                  {randomPublishResult.instagram && typeof randomPublishResult.instagram === 'object' && 'permalink' in randomPublishResult.instagram && (randomPublishResult.instagram as { permalink?: string }).permalink && (
                    <p style={{ margin: '8px 0 0 0' }}>
                      <a href={(randomPublishResult.instagram as { permalink: string }).permalink} target="_blank" rel="noopener noreferrer">View post</a>
                    </p>
                  )}
                </>
              ) : (
                <strong>Error:</strong> {randomPublishResult.error}
              )}
            </div>
          )}
        </section>

        <form id="panel-form" onSubmit={handleSubmit}>
          <input type="hidden" name="preset" value={preset ?? ''} />
          <section className="card">
            <h3 className="card-title">Presets</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => applyPreset(name)}
                  className={`btn btn-chip ${preset === name ? 'active' : ''}`}
                >
                  {name}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h3 className="card-title">Idea</h3>
            <label className="label" htmlFor="post-idea">Occasion, location, or topic</label>
            <textarea
              id="post-idea"
              name="postIdea"
              className="textarea"
              value={postIdea}
              onChange={(e) => setPostIdea(e.target.value)}
              placeholder="e.g. at a coffee shop with laptop — or leave blank to use preset / random"
              rows={2}
            />
          </section>

          <section className="card">
            <h3 className="card-title">Scene{' & '}style</h3>
            <label className="label" htmlFor="occasion">Occasion</label>
            <select id="occasion" name="occasion" className="select" value={occasion} onChange={(e) => setOccasion(e.target.value)} aria-label="Occasion">
              <option value="">Random</option>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <div className="form-grid-2">
              <div className="field">
                <label className="label" htmlFor="vibe">Vibe</label>
                <select id="vibe" name="vibe" className="select" value={vibe} onChange={(e) => setVibe(e.target.value)} aria-label="Vibe">
                  <option value="">Any</option>
                  {VIBES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="surrounding">Surrounding</label>
                <select id="surrounding" name="surrounding" className="select" value={surrounding} onChange={(e) => setSurrounding(e.target.value)} aria-label="Surrounding">
                  <option value="">Any</option>
                  {SURROUNDINGS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-grid-2">
              <div className="field">
                <label className="label" htmlFor="mood">Mood</label>
                <select id="mood" name="mood" className="select" value={mood} onChange={(e) => setMood(e.target.value)} aria-label="Mood">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="expression">Expression</label>
                <select id="expression" name="expression" className="select" value={expression} onChange={(e) => setExpression(e.target.value)} aria-label="Expression">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((expr) => (
                    <option key={expr} value={expr}>{expr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-margin">
              <label className="label" htmlFor="clothing">Clothing</label>
              <select id="clothing" name="clothing" className="select" value={clothing} onChange={(e) => setClothing(e.target.value)} aria-label="Clothing">
                <option value="">Random</option>
                {(CLOTHING_OPTIONS as readonly string[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="card">
            <h3 className="card-title">Caption</h3>
            <label className="label" htmlFor="caption">Custom caption</label>
            <textarea
              id="caption"
              name="caption"
              className="textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Leave blank for auto-generated caption and hashtags"
              rows={3}
            />
          </section>

          <button type="submit" onPointerDown={commitFocusedField} disabled={loading} className="btn btn-primary btn-primary--inline">
            {loading ? 'Generating…' : 'Generate & publish'}
          </button>
        </form>

        {/* Mobile bottom toolbar: same primary action for thumb reach */}
        <div className="app-bottom-bar">
          <button
            type="submit"
            form="panel-form"
            onPointerDown={commitFocusedField}
            disabled={loading}
            className="btn btn-primary app-bottom-bar__action"
            aria-label={loading ? 'Generating' : 'Generate and publish'}
          >
            {loading ? 'Generating…' : 'Generate & publish'}
          </button>
        </div>

        {result && (
          <div className={`result-box ${result.success ? 'success' : 'error'}`}>
            {result.success ? (
              <>
                <strong>Published.</strong>
                {result.generation && typeof result.generation === 'object' && 'image_url' in result.generation && (
                  <p style={{ margin: '8px 0 0 0' }}>
                    <a href={String((result.generation as { image_url?: string }).image_url)} target="_blank" rel="noopener noreferrer">
                      View image
                    </a>
                  </p>
                )}
                {result.instagram && typeof result.instagram === 'object' && 'media_id' in result.instagram && (
                  <p style={{ margin: '4px 0 0 0', fontSize: 13 }}>Media ID: {(result.instagram as { media_id?: string }).media_id}</p>
                )}
              </>
            ) : (
              <>
                <strong>Error:</strong> {result.error}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
