/**
 * Prompt builder for entrepreneur lifestyle LoRA.
 * Character: predominantly black hair, smooth skin, Maori-style tattoo on left arm (shoulder to elbow) when short sleeves or arm visible.
 */

import { randomInt } from 'crypto';

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
  'coding at a laptop in a modern office',
  'in a business meeting room, presenting or discussing',
  'driving a car, city or highway',
  'on a video call from home or office',
  'at a desk working, focused on screen',
  'commuting on a train or bus',
  'at an airport lounge waiting for a flight',
  'in a conference room with a whiteboard',
  'working from a hotel room desk',
  'at a standing desk in an open office',
  'taking a break outside a building',
  'in a car as passenger, travel or commute',
  'at a cafe with a notebook and laptop',
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
  'long shot, full body small in frame, figure in environment',
  'long shot, person in urban or natural landscape',
  'extreme long shot, environmental, figure distant',
  'medium long shot, from knees up',
  'wide shot, person in context, editorial',
  'two-shot distance, subject in environment',
  'close-up portrait, head and shoulders',
] as const;

/** Composition / framing — what’s in frame (includes long shots for variety) */
const COMPOSITIONS = [
  'close-up, face and shoulders in frame',
  'medium shot, waist up',
  'medium shot, knees up',
  'full body in frame, person small in environment',
  'wide shot, person in context, environmental',
  'tight portrait, head and shoulders',
  'two-shot distance, subject clearly visible but not dominant',
  'long shot, figure in landscape or urban setting',
  'long shot, full figure small in frame, environmental',
  'extreme long shot, figure distant in scene',
  'detail shot, hands or object in frame with person',
  'wide establishing shot, person in environment',
  'medium long shot, knees up in frame',
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

/** Tattoo: Maori style, left arm shoulder to elbow — when short sleeves or full arm visible */
const TATTOO_PHRASES = [
  'Left arm from shoulder to elbow has a detailed Maori-style tattoo (tribal, bold black lines). When short sleeves or full arm visible this tattoo is clearly visible; no other visible tattoos.',
  'Maori-style (tribal) tattoo on left arm from shoulder to elbow; when wearing short sleeves or when arm is visible the tattoo is in frame and well-lit.',
  'Left arm sleeve tattoo in Maori/tribal style from shoulder to elbow; composition includes arm when short sleeves or full arm visible.',
] as const;

/** Short-sleeve items: arm visible so Maori tattoo (shoulder to elbow) can be shown */
const CLOTHING_SHORT_SLEEVE = [
  'fitted black t-shirt, short sleeves',
  'white crew neck t-shirt, short sleeves',
  'grey v-neck tee, short sleeves',
  'navy polo shirt, short sleeves',
  'plain dark tee and jeans, short sleeves',
] as const;

const CLOTHING_LONG_SLEEVE = [
  'grey hoodie, casual',
  'navy casual shirt, sleeves rolled to mid-forearm',
  'olive green casual shirt, sleeves rolled',
  'charcoal henley',
  'light grey sweatshirt',
  'plain dark tee and jeans',
] as const;

const CLOTHING_OPTIONS = [...CLOTHING_SHORT_SLEEVE, ...CLOTHING_LONG_SLEEVE] as readonly string[];

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

/** UI options for on-demand prompt building (panel) */
export interface PromptOptions {
  postIdea?: string;
  occasion?: string;
  vibe?: string;
  mood?: string;
  clothing?: string;
  expression?: string;
  surrounding?: string;
}

/** Vibe / tone for the shot */
export const VIBES = [
  'professional',
  'casual',
  'adventurous',
  'minimal',
  'cozy',
  'energetic',
  'laid-back',
  'focused',
] as const;

/** Surrounding / environment type */
export const SURROUNDINGS = [
  'urban street',
  'indoor office or cafe',
  'outdoor nature or park',
  'coffee shop or cafe',
  'modern office',
  'travel or airport',
  'gym or fitness',
  'rooftop or balcony',
  'minimal backdrop',
  'cityscape or skyline',
] as const;

/** One-click presets for the panel */
export const PRESETS: Record<string, Partial<PromptOptions>> = {
  'Work mode': {
    occasion: 'coding at a laptop in a modern office',
    vibe: 'focused',
    mood: 'focused, thoughtful expression',
    clothing: 'fitted black t-shirt, short sleeves',
    expression: 'focused, thoughtful expression',
    surrounding: 'modern office',
  },
  'Coffee shop': {
    occasion: 'working from a modern coffee shop with laptop',
    vibe: 'casual',
    mood: 'relaxed, confident smile, approachable',
    clothing: 'grey hoodie, casual',
    expression: 'relaxed, confident smile, approachable',
    surrounding: 'coffee shop or cafe',
  },
  'Travel': {
    occasion: 'traveling at an airport or train station',
    vibe: 'adventurous',
    mood: 'walking casually, authentic moment',
    clothing: 'navy casual shirt, sleeves rolled to mid-forearm',
    expression: 'calm, contemplative, relaxed posture',
    surrounding: 'travel or airport',
  },
  'Meeting': {
    occasion: 'in a business meeting room, presenting or discussing',
    vibe: 'professional',
    mood: 'engaged, talking or listening',
    clothing: 'navy casual shirt, sleeves rolled to mid-forearm',
    expression: 'engaged, talking or listening',
    surrounding: 'indoor office or cafe',
  },
  'Gym': {
    occasion: 'at the gym, mid-workout, natural lighting',
    vibe: 'energetic',
    mood: 'mid-stride or mid-motion, dynamic',
    clothing: 'fitted black t-shirt, short sleeves',
    expression: 'mid-stride or mid-motion, dynamic',
    surrounding: 'gym or fitness',
  },
  'Driving': {
    occasion: 'driving a car, city or highway',
    vibe: 'laid-back',
    mood: 'calm, contemplative, relaxed posture',
    clothing: 'charcoal henley',
    expression: 'calm, contemplative, relaxed posture',
    surrounding: 'urban street',
  },
  'Beach / chill': {
    occasion: 'relaxing on a sunny beach',
    vibe: 'laid-back',
    mood: 'sitting back at ease, casual',
    clothing: 'plain dark tee and jeans, short sleeves',
    expression: 'sitting back at ease, casual',
    surrounding: 'outdoor nature or park',
  },
  'Random': {},
};

/** Cryptographically random index for uniform diversification (avoids same-set clustering). */
function randomIndex(length: number): number {
  if (length <= 0) return 0;
  return randomInt(0, length);
}

/** Pick a random element; uses crypto for even distribution across all options. */
export function getRandomElement<T>(arr: readonly T[]): T {
  return arr[randomIndex(arr.length)];
}

/** Random boolean with given probability (0–1); uses crypto for fairness. */
function randomChance(probability: number): boolean {
  return randomInt(0, 1_000_000) / 1_000_000 < probability;
}

/**
 * Build a professional-photography style prompt matching the LoRA character:
 * predominantly black hair, smooth skin, Maori-style tattoo on left arm (shoulder to elbow) when short sleeves or arm visible.
 */
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
  const armVisible =
    (CLOTHING_SHORT_SLEEVE as readonly string[]).includes(clothing) ||
    randomChance(0.4);

  const base = [
    'A professional photograph capturing a distinguished gentleman in his mid-30s,',
    theme + ',',
    pose + ',',
    'predominantly black hair with only slight grey at the temples or none, well-groomed, styled with subtle volume, exuding sophistication and approachability.',
    'Smooth skin with very few wrinkles, youthful appearance for his age.',
    'He wears ' + clothing + '.',
    'Left arm from shoulder to elbow has a Maori-style (tribal, bold black lines) tattoo; when short sleeves or full arm visible the tattoo is clearly visible; no other visible tattoos.',
  ];

  if (armVisible) {
    base.push(getRandomElement(TATTOO_PHRASES));
  }

  const framing = [
    shotType + '.',
    composition + ',',
    angle + '.',
    'Natural lighting creates gentle highlights and shadows' +
      (armVisible ? ', emphasizing tattoo and facial features' : ', flattering and natural') +
      '.',
    'Shot with a professional ' + lens + ', candid authentic moment.',
    'Cinematic color grading with warm, professional tones.',
    'Photorealistic quality, 8K resolution, high-end photography aesthetic.',
  ];

  const prompt = [...base, ...framing].join(' ');

  return { prompt, theme, shotType };
}

/**
 * Build prompt from panel options (occasion, vibe, mood, clothing, expression, surrounding).
 * Omitted options are filled with random choices.
 */
export function buildEntrepreneurPromptFromOptions(options: PromptOptions = {}): {
  prompt: string;
  theme: ThemeOccasion | string;
  shotType: ShotType;
} {
  const occasionPart =
    options.postIdea?.trim() ||
    options.occasion ||
    getRandomElement(OCCASIONS);
  const theme: string = options.surrounding
    ? `${occasionPart}, ${options.surrounding} setting`
    : occasionPart;
  const shotType = getRandomElement(SHOT_TYPES);
  const composition = getRandomElement(COMPOSITIONS);
  const angle = getRandomElement(CAMERA_ANGLES);
  const lens = getRandomElement(LENS_CHOICES);
  const clothing =
    options.clothing || getRandomElement(CLOTHING_OPTIONS);
  const pose =
    options.mood || options.expression || getRandomElement(POSES_AND_MOODS);
  const armVisible =
    (CLOTHING_SHORT_SLEEVE as readonly string[]).includes(clothing) ||
    randomChance(0.4);

  const base = [
    'A professional photograph capturing a distinguished gentleman in his mid-30s,',
    theme + ',',
    pose + ',',
    'predominantly black hair with only slight grey at the temples or none, well-groomed, styled with subtle volume, exuding sophistication and approachability.',
    'Smooth skin with very few wrinkles, youthful appearance for his age.',
    'He wears ' + clothing + '.',
    'Left arm from shoulder to elbow has a Maori-style (tribal, bold black lines) tattoo; when short sleeves or full arm visible the tattoo is clearly visible; no other visible tattoos.',
  ];

  if (armVisible) {
    base.push(getRandomElement(TATTOO_PHRASES));
  }

  const framing = [
    shotType + '.',
    composition + ',',
    angle + '.',
    'Natural lighting creates gentle highlights and shadows' +
      (armVisible ? ', emphasizing tattoo and facial features' : ', flattering and natural') +
      '.',
    ...(options.vibe ? [`${options.vibe} vibe.`] : []),
    'Shot with a professional ' + lens + ', candid authentic moment.',
    'Cinematic color grading with warm, professional tones.',
    'Photorealistic quality, 8K resolution, high-end photography aesthetic.',
  ];

  const prompt = [...base, ...framing].join(' ');

  return { prompt, theme, shotType };
}

export { OCCASIONS, SHOT_TYPES, CLOTHING_OPTIONS, POSES_AND_MOODS };
