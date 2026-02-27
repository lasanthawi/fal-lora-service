import { useUser, UserButton } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
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

export default function PanelView() {
  const user = useUser({ or: 'return-null' });
  const router = useRouter();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const body: Record<string, string> = {};
      if (preset) body.preset = preset;
      if (postIdea) body.postIdea = postIdea;
      if (occasion) body.occasion = occasion;
      if (vibe) body.vibe = vibe;
      if (mood) body.mood = mood;
      if (clothing) body.clothing = clothing;
      if (expression) body.expression = expression;
      if (surrounding) body.surrounding = surrounding;
      if (caption) body.caption = caption;

      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
      if (!res.ok) return;
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : 'Request failed' });
    } finally {
      setLoading(false);
    }
  };

  if (user === undefined || !user) {
    return (
      <div className="loading-screen">
        <span className="loading-dots">Loading</span>
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

        <form onSubmit={handleSubmit}>
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
            <select id="occasion" className="select" value={occasion} onChange={(e) => setOccasion(e.target.value)} aria-label="Occasion">
              <option value="">Random</option>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <div className="form-grid-2">
              <div className="field">
                <label className="label" htmlFor="vibe">Vibe</label>
                <select id="vibe" className="select" value={vibe} onChange={(e) => setVibe(e.target.value)} aria-label="Vibe">
                  <option value="">Any</option>
                  {VIBES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="surrounding">Surrounding</label>
                <select id="surrounding" className="select" value={surrounding} onChange={(e) => setSurrounding(e.target.value)} aria-label="Surrounding">
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
                <select id="mood" className="select" value={mood} onChange={(e) => setMood(e.target.value)} aria-label="Mood">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="expression">Expression</label>
                <select id="expression" className="select" value={expression} onChange={(e) => setExpression(e.target.value)} aria-label="Expression">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((expr) => (
                    <option key={expr} value={expr}>{expr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-margin">
              <label className="label" htmlFor="clothing">Clothing</label>
              <select id="clothing" className="select" value={clothing} onChange={(e) => setClothing(e.target.value)} aria-label="Clothing">
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
              className="textarea"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Leave blank for auto-generated caption and hashtags"
              rows={3}
            />
          </section>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Generating…' : 'Generate & publish'}
          </button>
        </form>

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
