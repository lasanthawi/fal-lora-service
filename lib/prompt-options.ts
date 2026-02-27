/**
 * Client-safe option lists and presets for the panel UI.
 * No Node-only deps (e.g. crypto) so pages can import this.
 */

export const OCCASIONS = [
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

export const CLOTHING_SHORT_SLEEVE = [
  'fitted black t-shirt, short sleeves',
  'white crew neck t-shirt, short sleeves',
  'grey v-neck tee, short sleeves',
  'navy polo shirt, short sleeves',
  'plain dark tee and jeans, short sleeves',
] as const;

export const CLOTHING_LONG_SLEEVE = [
  'grey hoodie, casual',
  'navy casual shirt, sleeves rolled to mid-forearm',
  'olive green casual shirt, sleeves rolled',
  'charcoal henley',
  'light grey sweatshirt',
  'plain dark tee and jeans',
] as const;

export const CLOTHING_OPTIONS = [...CLOTHING_SHORT_SLEEVE, ...CLOTHING_LONG_SLEEVE] as readonly string[];

export const POSES_AND_MOODS = [
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

export interface PromptOptions {
  postIdea?: string;
  occasion?: string;
  vibe?: string;
  mood?: string;
  clothing?: string;
  expression?: string;
  surrounding?: string;
}

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
