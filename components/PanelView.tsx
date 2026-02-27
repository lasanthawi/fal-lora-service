import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import { PRESETS } from '../lib/prompt-options';
import PanelBody from './PanelBody';

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

  const getTrimmedFormValue = (formData: FormData, key: string) => {
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

  // Show loading only on initial auth check; once form is shown, keep it mounted so input state is preserved
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
    <PanelBody
      user={user}
      preset={preset}
      postIdea={postIdea}
      occasion={occasion}
      vibe={vibe}
      mood={mood}
      clothing={clothing}
      expression={expression}
      surrounding={surrounding}
      caption={caption}
      loading={loading}
      result={result}
      randomPreview={randomPreview}
      randomPreviewCaption={randomPreviewCaption}
      randomLoading={randomLoading}
      randomPublishLoading={randomPublishLoading}
      randomPublishResult={randomPublishResult}
      onApplyPreset={applyPreset}
      onCommitFocusedField={commitFocusedField}
      onSubmit={handleSubmit}
      onRandomGenerate={handleRandomGenerate}
      onRandomPublish={handleRandomPublish}
      onPostIdeaChange={setPostIdea}
      onOccasionChange={setOccasion}
      onVibeChange={setVibe}
      onMoodChange={setMood}
      onClothingChange={setClothing}
      onExpressionChange={setExpression}
      onSurroundingChange={setSurrounding}
      onCaptionChange={setCaption}
      onRandomPreviewCaptionChange={setRandomPreviewCaption}
    />
  );
}
