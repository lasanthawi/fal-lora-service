/**
 * Prompt builder for entrepreneur lifestyle LoRA.
 * Character: darker salt-and-pepper hair (more black), left forearm tattoo only, casual clothes.
 */

const OCCASIONS = [
  'working from a modern coffee shop with laptop',
  'at the gym, mid-workout, natural lighting',
  'relaxing on a sunny beach',
  'at a casual restaurant, having lunch',
  'in a city park on a bench',
  'traveling at an airport or train station',
  'in a home office with minimalist setup',
  'at a rooftop bar at golden hour',
  'walking through a vibrant street market',
  'at a co-working space',
  'out for a morning run in the city',
  'at a bookstore browsing',
  'having coffee on a balcony',
  'at a casual team meeting in an office',
  'exploring a new city on foot',
  'at a weekend brunch spot',
  'in a hotel lobby, travel vibes',
  'at a networking event, holding a drink',
  'by a lake or waterfront',
  'in a cozy cafe reading',
] as const;

const SHOT_TYPES = [
  'candid shot, natural expression, documentary style',
  'portrait, shallow depth of field, professional',
  'full-body shot, environmental portrait',
  'street style photography, urban backdrop',
  'lifestyle shot, authentic and relaxed',
  'medium shot from waist up, editorial feel',
  'over-the-shoulder moment, storytelling',
  'wide environmental shot, person in context',
] as const;

/** Composition / framing — what’s in frame */
const COMPOSITIONS = [
  'close-up, face and shoulders in frame',
  'medium shot, waist up',
  'medium shot, knees up',
  'full body in frame, person small in environment',
  'wide shot, person in context, environmental',
  'tight portrait, head and shoulders',
  'two-shot distance, subject clearly visible but not dominant',
  'long shot, figure in landscape or urban setting',
  'detail shot, hands or object in frame with person',
] as const;

/** Camera angle / perspective */
const CAMERA_ANGLES = [
  'eye-level, straight on',
  'slightly low angle, looking up at subject',
  'slightly high angle, looking down',
  'three-quarter view, subject turned partly away',
  'profile or near-profile',
  'from behind, subject facing away',
  'Dutch angle, subtle tilt for dynamism',
  'over-the-shoulder perspective',
] as const;

/** Lens / focal length — affects look and compression */
const LENS_CHOICES = [
  '35mm lens, environmental, slight wide',
  '50mm lens at f/2.8, shallow depth of field',
  '85mm lens, compressed background, portrait feel',
  '24mm wide angle, environmental context',
  '70mm telephoto, candid compression',
  '50mm lens at f/4, more in focus',
] as const;

/** Optional tattoo/forearm emphasis — used only sometimes */
const TATTOO_FOCUS_PHRASES = [
  'Left forearm shows detailed tattoo work; composition includes hands and forearms.',
  'Sleeves rolled to mid-forearm, tattoo visible and well-lit.',
  'Upper body and forearms in frame, tattoo detail sharp.',
] as const;

const CLOTHING_OPTIONS = [
  'fitted black t-shirt',
  'grey hoodie, casual',
  'navy casual shirt, sleeves rolled',
  'white crew neck t-shirt',
  'olive green casual shirt',
  'charcoal henley',
  'light grey sweatshirt',
  'plain dark tee and jeans',
] as const;

const POSES_AND_MOODS = [
  'arms crossed confidently, relaxed',
  'relaxed, confident smile, approachable',
  'focused, thoughtful expression',
  'laughing naturally, candid moment',
  'calm, contemplative, relaxed posture',
  'engaged, talking or listening',
  'walking casually, authentic moment',
  'sitting back at ease, casual',
  'standing with hands in pockets',
  'back to camera, looking at view',
  'leaning against a surface, casual',
  'mid-stride or mid-motion, dynamic',
  'seated, legs crossed or relaxed',
  'silhouette or rim-lit outline',
  'sleeves rolled, forearms visible',
  'hands in frame, gesturing naturally',
] as const;

export type ThemeOccasion = (typeof OCCASIONS)[number];
export type ShotType = (typeof SHOT_TYPES)[number];

export function getRandomElement<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build a professional-photography style prompt matching the LoRA character:
 * darker salt-and-pepper hair (more black), left forearm tattoo only, casual/tailored variety.
 */
/** Use tattoo/forearm emphasis in ~30% of prompts */
const TATTOO_FOCUS_CHANCE = 0.3;

export function buildEntrepreneurPrompt(): {
  prompt: string;
  theme: ThemeOccasion;
  shotType: ShotType;
} {
  const theme = getRandomElement(OCCASIONS);
  const shotType = getRandomElement(SHOT_TYPES);
  const composition = getRandomElement(COMPOSITIONS);
  const angle = getRandomElement(CAMERA_ANGLES);
  const lens = getRandomElement(LENS_CHOICES);
  const clothing = getRandomElement(CLOTHING_OPTIONS);
  const pose = getRandomElement(POSES_AND_MOODS);
  const useTattooFocus = Math.random() < TATTOO_FOCUS_CHANCE;

  const base = [
    'A professional photograph capturing a distinguished gentleman in his mid-30s,',
    theme + ',',
    pose + ',',
    'well-groomed salt-and-pepper hair with more black than grey, styled with subtle volume, exuding sophistication and approachability.',
    'He wears ' + clothing + '.',
  ];

  if (useTattooFocus) {
    base.push(
      'Only his left forearm shows detailed, artistic tattoo work in sharp detail; no other visible tattoos.',
      getRandomElement(TATTOO_FOCUS_PHRASES)
    );
  }

  const framing = [
    shotType + '.',
    composition + ',',
    angle + '.',
    'Natural lighting creates gentle highlights and shadows' +
      (useTattooFocus ? ', emphasizing tattoo details and facial features' : ', flattering and natural') +
      '.',
    'Shot with a professional ' + lens + ', candid authentic moment.',
    'Cinematic color grading with warm, professional tones.',
    'Photorealistic quality, 8K resolution, high-end photography aesthetic.',
  ];

  const prompt = [...base, ...framing].join(' ');

  return { prompt, theme, shotType };
}

export { OCCASIONS, SHOT_TYPES, CLOTHING_OPTIONS, POSES_AND_MOODS };
