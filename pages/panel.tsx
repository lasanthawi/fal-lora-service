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

export async function getServerSideProps() {
  return { props: {} };
}

export default function PanelPage() {
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
  const [result, setResult] = useState<{ success: boolean; error?: string; generation?: unknown; instagram?: unknown } | null>(null);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) router.replace('/handler/signin');
  }, [user, router]);

  if (user === undefined || !user) return <div style={{ fontFamily: 'system-ui', padding: 24 }}>Loading…</div>;

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

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 720, margin: '0 auto', padding: 24 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 24 }}>Generate &amp; Publish</h1>
        <UserButton />
      </header>

      <p style={{ color: '#666', marginBottom: 24 }}>
        Configure your post idea and style, then generate an image and publish to Instagram.
      </p>

      <form onSubmit={handleSubmit}>
        <section style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>Presets (one-click)</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_NAMES.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => applyPreset(name)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: preset === name ? '2px solid #333' : '1px solid #ccc',
                  background: preset === name ? '#f0f0f0' : '#fff',
                  cursor: 'pointer',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </section>

        <section style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Post idea (occasion, location, incident, topic)
          </label>
          <textarea
            value={postIdea}
            onChange={(e) => setPostIdea(e.target.value)}
            placeholder="e.g. at a coffee shop with laptop, or leave blank to use occasion / preset"
            rows={2}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </section>

        <section style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Occasion</label>
          <select
            value={occasion}
            onChange={(e) => setOccasion(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="">— Random —</option>
            {OCCASIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <section>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Vibe</label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">— Any —</option>
              {VIBES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </section>
          <section>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Surrounding</label>
            <select
              value={surrounding}
              onChange={(e) => setSurrounding(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">— Any —</option>
              {SURROUNDINGS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </section>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <section>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Mood</label>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">— Any —</option>
              {POSES_AND_MOODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </section>
          <section>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Expression</label>
            <select
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
            >
              <option value="">— Any —</option>
              {POSES_AND_MOODS.map((expr) => (
                <option key={expr} value={expr}>{expr}</option>
              ))}
            </select>
          </section>
        </div>

        <section style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Clothing</label>
          <select
            value={clothing}
            onChange={(e) => setClothing(e.target.value)}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
          >
            <option value="">— Random —</option>
            {(CLOTHING_OPTIONS as readonly string[]).map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </section>

        <section style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Custom caption (optional)</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Leave blank for auto-generated caption + hashtags"
            rows={3}
            style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </section>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            background: loading ? '#999' : '#111',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating & publishing…' : 'Generate & Publish'}
        </button>
      </form>

      {result && (
        <div style={{ marginTop: 32, padding: 16, borderRadius: 8, background: result.success ? '#e8f5e9' : '#ffebee', border: `1px solid ${result.success ? '#4caf50' : '#f44336'}` }}>
          {result.success ? (
            <>
              <strong>Success.</strong>
              {result.generation && typeof result.generation === 'object' && 'image_url' in result.generation && (
                <p style={{ marginTop: 8 }}>
                  <a href={String((result.generation as { image_url?: string }).image_url)} target="_blank" rel="noopener noreferrer">View image</a>
                </p>
              )}
              {result.instagram && typeof result.instagram === 'object' && 'media_id' in result.instagram && (
                <p style={{ margin: 0 }}>Instagram media ID: {(result.instagram as { media_id?: string }).media_id}</p>
              )}
            </>
          ) : (
            <><strong>Error:</strong> {result.error}</>
          )}
        </div>
      )}
    </div>
  );
}
