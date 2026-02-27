import React from 'react';
import { UserButton } from '@stackframe/stack';
import {
  OCCASIONS,
  CLOTHING_OPTIONS,
  POSES_AND_MOODS,
  VIBES,
  SURROUNDINGS,
  PRESETS,
} from '../lib/prompt-options';

const PRESET_NAMES = Object.keys(PRESETS);

export interface PanelBodyProps {
  user: { displayName?: string | null; primaryEmail?: string | null };
  preset: string | null;
  postIdea: string;
  occasion: string;
  vibe: string;
  mood: string;
  clothing: string;
  expression: string;
  surrounding: string;
  caption: string;
  loading: boolean;
  result: { success: boolean; error?: string; generation?: unknown; instagram?: unknown } | null;
  randomPreview: { image_url: string; caption: string; theme: string; shot_type: string } | null;
  randomPreviewCaption: string;
  randomLoading: boolean;
  randomPublishLoading: boolean;
  randomPublishResult: { success: boolean; error?: string; instagram?: unknown } | null;
  onApplyPreset: (name: string) => void;
  onCommitFocusedField: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onRandomGenerate: () => void;
  onRandomPublish: () => void;
  onPostIdeaChange: (v: string) => void;
  onOccasionChange: (v: string) => void;
  onVibeChange: (v: string) => void;
  onMoodChange: (v: string) => void;
  onClothingChange: (v: string) => void;
  onExpressionChange: (v: string) => void;
  onSurroundingChange: (v: string) => void;
  onCaptionChange: (v: string) => void;
  onRandomPreviewCaptionChange: (v: string) => void;
}

export default function PanelBody(props: PanelBodyProps) {
  const {
    user,
    preset,
    postIdea,
    occasion,
    vibe,
    mood,
    clothing,
    expression,
    surrounding,
    caption,
    loading,
    result,
    randomPreview,
    randomPreviewCaption,
    randomLoading,
    randomPublishLoading,
    randomPublishResult,
    onApplyPreset,
    onCommitFocusedField,
    onSubmit,
    onRandomGenerate,
    onRandomPublish,
    onPostIdeaChange,
    onOccasionChange,
    onVibeChange,
    onMoodChange,
    onClothingChange,
    onExpressionChange,
    onSurroundingChange,
    onCaptionChange,
    onRandomPreviewCaptionChange,
  } = props;

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
          <h2>Generate &amp; publish</h2>
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
                onClick={onRandomGenerate}
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
                    onChange={(e) => onRandomPreviewCaptionChange((e.target as HTMLTextAreaElement).value)}
                    rows={4}
                    placeholder="Caption for Instagram"
                  />
                </div>
                <div className="random-step">
                  <span className="random-step-label">Step 2</span>
                  <button
                    type="button"
                    onClick={onRandomPublish}
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
                <>
                  <strong>Error: </strong> {randomPublishResult.error}
                </>
              )}
            </div>
          )}
        </section>
        <form id="panel-form" onSubmit={onSubmit}>
          <input type="hidden" name="preset" value={preset ?? ''} />
          <section className="card">
            <h3 className="card-title">Presets</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {PRESET_NAMES.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => onApplyPreset(name)}
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
              onChange={(e) => onPostIdeaChange(e.target.value)}
              placeholder="e.g. at a coffee shop with laptop — or leave blank to use preset / random"
              rows={2}
            />
          </section>
          <section className="card">
            <h3 className="card-title">Scene & style</h3>
            <label className="label" htmlFor="occasion">Occasion</label>
            <select id="occasion" name="occasion" className="select" value={occasion} onChange={(e) => onOccasionChange(e.target.value)} aria-label="Occasion">
              <option value="">Random</option>
              {OCCASIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <div className="form-grid-2">
              <div className="field">
                <label className="label" htmlFor="vibe">Vibe</label>
                <select id="vibe" name="vibe" className="select" value={vibe} onChange={(e) => onVibeChange(e.target.value)} aria-label="Vibe">
                  <option value="">Any</option>
                  {VIBES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="surrounding">Surrounding</label>
                <select id="surrounding" name="surrounding" className="select" value={surrounding} onChange={(e) => onSurroundingChange(e.target.value)} aria-label="Surrounding">
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
                <select id="mood" name="mood" className="select" value={mood} onChange={(e) => onMoodChange(e.target.value)} aria-label="Mood">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="expression">Expression</label>
                <select id="expression" name="expression" className="select" value={expression} onChange={(e) => onExpressionChange(e.target.value)} aria-label="Expression">
                  <option value="">Any</option>
                  {POSES_AND_MOODS.map((expr) => (
                    <option key={expr} value={expr}>{expr}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="field-margin">
              <label className="label" htmlFor="clothing">Clothing</label>
              <select id="clothing" name="clothing" className="select" value={clothing} onChange={(e) => onClothingChange(e.target.value)} aria-label="Clothing">
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
              onChange={(e) => onCaptionChange(e.target.value)}
              placeholder="Leave blank for auto-generated caption and hashtags"
              rows={3}
            />
          </section>
          <button type="submit" onPointerDown={onCommitFocusedField} disabled={loading} className="btn btn-primary btn-primary--inline">
            {loading ? 'Generating…' : 'Generate & publish'}
          </button>
        </form>
        <div className="app-bottom-bar">
          <button
            type="submit"
            form="panel-form"
            onPointerDown={onCommitFocusedField}
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
                <strong>Error: </strong>
                {result.error}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
