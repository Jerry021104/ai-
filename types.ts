export type Language = 'en' | 'zh';

export enum Gender {
  MALE = 'Male',
  FEMALE = 'Female',
  NON_BINARY = 'Non-Binary'
}

export enum HairLength {
  BUZZ = 'Buzz Cut / Very Short',
  SHORT = 'Short (Above Ear)',
  MEDIUM = 'Medium (Chin/Shoulder)',
  LONG = 'Long (Below Shoulder)'
}

export enum MaintenanceLevel {
  LOW = 'Low (Wash & Go)',
  MEDIUM = 'Medium (Some Styling)',
  HIGH = 'High (Blowout/Product required)'
}

export enum LightingCondition {
  STUDIO = 'Studio Balanced',
  NATURAL_INDOOR = 'Natural Indoor Window',
  OUTDOOR_SUNNY = 'Outdoor Sunny',
  OUTDOOR_CLOUDY = 'Outdoor Cloudy',
  EVENING_WARM = 'Warm Evening Light'
}

export interface UserProfile {
  gender: Gender;
  age: number;
  hairCurl: string; // e.g., Straight, Wavy, Curly, Coily
  hairThickness: string; // e.g., Fine, Medium, Thick
  currentColor: string;
}

export interface FaceDimensions {
  faceLength: string;
  cheekboneWidth: string;
  jawlineWidth: string;
  foreheadWidth: string;
}

export interface FaceAnalysisResult {
  faceShape: string;
  jawlineCharacteristics: string;
  foreheadHeight: string;
  skinToneDescription: string;
  featuresSummary: string;
  recommendedStyles: string[];
}

export interface HairstyleRequest {
  styleName: string;
  length: HairLength;
  color: string;
  lighting: LightingCondition;
}

export interface GeneratedHairstyle {
  imageUrl: string;
  barberInstructions: string; // Markdown formatted
}