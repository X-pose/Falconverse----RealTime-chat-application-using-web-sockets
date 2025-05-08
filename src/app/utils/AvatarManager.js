import { createAvatar } from '@dicebear/core';
import * as avataaars from '@dicebear/avataaars';
import * as bottts from '@dicebear/bottts';
import * as lorelei from '@dicebear/lorelei';
import * as funEmoji from '@dicebear/fun-emoji';
import { uniqueNamesGenerator, adjectives, animals } from 'unique-names-generator';

const STORAGE_KEY = 'user_profile';

// Available avatar styles with customized options
const avatarStyles = [
  {
    style: avataaars,
    options: {
      backgroundColor: ['ffffff'], // Force white background
      mouth: ['smile', 'default', 'twinkle'],
      eyes: ['default', 'happy', 'hearts', 'stars', 'wink'],
      hairColor: ['auburn', 'black', 'blonde', 'brown', 'pastel', 'platinum', 'red'],
      accessories: ['none', 'roundGlasses', 'sunglasses'],
      clothing: ['blazer', 'sweater', 'hoodie', 'shirt', 'graphicShirt']
    }
  },
  {
    style: bottts,
    options: {
      colorful: true,
      primaryColorLevel: 600,
      secondaryColorLevel: 400,
      mouthChance: 100,
      sidesChance: 100,
      textureChance: 50,
      backgroundColor: ['ffffff'] // Force white background
    }
  },
  {
    style: lorelei,
    options: {
      backgroundColor: ['ffffff'], // Force white background
      accessories: ['none', 'glasses', 'glasses2', 'sunglasses'],
      hairAccessories: ['none', 'bow', 'flower', 'glasses'],
      facial: ['none', 'blush', 'freckles']
    }
  },
  {
    style: funEmoji,
    options: {
      backgroundType: ['solid'],
      backgroundColor: ['ffffff'], // Force white background
      earrings: ['none', 'variant01', 'variant02'],
      eyebrows: ['variant01', 'variant02', 'variant03', 'variant04'],
      eyes: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05'],
      mouth: ['variant01', 'variant02', 'variant03', 'variant04', 'variant05']
    }
  }
];

class AvatarManagerClass {
  constructor() {
    this.isInitialized = false;
    this.profile = null;
  }

  initialize() {
    if (this.isInitialized || typeof window === 'undefined') return;
    
    const storedProfile = localStorage.getItem(STORAGE_KEY);
    if (storedProfile) {
      try {
        const parsedProfile = JSON.parse(storedProfile);
        // Validate stored profile has required fields and valid SVG
        if (this._isValidProfile(parsedProfile)) {
          this.profile = parsedProfile;
        } else {
          this.profile = this._generateNewProfile();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
        }
      } catch (error) {
        // Handle corrupted storage
        this.profile = this._generateNewProfile();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      }
    } else {
      this.profile = this._generateNewProfile();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    }
    
    this.isInitialized = true;
  }

  // Validate profile structure and SVG content
  _isValidProfile(profile) {
    return profile &&
      typeof profile.name === 'string' &&
      typeof profile.avatarSvg === 'string' &&
      typeof profile.styleIndex === 'number' &&
      profile.avatarSvg.includes('<svg') && // Basic SVG validation
      profile.avatarSvg.length > 100; // Ensure SVG has substantial content
  }

  _generateNewProfile() {
    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
      style: 'capital',
      length: 2
    });

    const selectedStyleIndex = Math.floor(Math.random() * avatarStyles.length);
    const { style, options } = avatarStyles[selectedStyleIndex];

    let avatarSvg;
    let attempts = 0;
    const maxAttempts = 3;

    // Retry generating avatar if it fails or is invalid
    do {
      avatarSvg = createAvatar(style, {
        seed: name,
        ...options,
        backgroundColor: ['ffffff'] // Ensure white background
      }).toString();
      attempts++;
    } while (!avatarSvg.includes('<svg') && attempts < maxAttempts);

    // Fallback to a default style if generation fails
    if (!avatarSvg.includes('<svg')) {
      avatarSvg = createAvatar(avatarStyles[0].style, {
        seed: name,
        ...avatarStyles[0].options,
        backgroundColor: ['ffffff']
      }).toString();
    }

    return {
      name,
      avatarSvg,
      styleIndex: selectedStyleIndex
    };
  }

  getName() {
    this._ensureInitialized();
    return this.profile?.name || 'anonymous-user';
  }

  getAvatarSvg() {
    this._ensureInitialized();
    if (!this.profile?.avatarSvg || !this._isValidProfile(this.profile)) {
      const defaultProfile = this._generateNewProfile();
      this.profile = defaultProfile;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
      return defaultProfile.avatarSvg;
    }
    return this.profile.avatarSvg;
  }

  getProfile() {
    this._ensureInitialized();
    if (!this.profile || !this._isValidProfile(this.profile)) {
      this.profile = this._generateNewProfile();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    }
    return this.profile;
  }

  regenerate() {
    this._ensureInitialized();
    this.profile = this._generateNewProfile();
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    }
    return this.profile;
  }

  regenerateWithStyle(styleIndex) {
    this._ensureInitialized();
    
    const name = uniqueNamesGenerator({
      dictionaries: [adjectives, animals],
      separator: '-',
      style: 'capital',
      length: 2
    });
    
    const styleIdx = (styleIndex >= 0 && styleIndex < avatarStyles.length) 
      ? styleIndex 
      : Math.floor(Math.random() * avatarStyles.length);
    
    const { style, options } = avatarStyles[styleIdx];
    
    let avatarSvg;
    let attempts = 0;
    const maxAttempts = 3;

    // Retry generating avatar if it fails
    do {
      avatarSvg = createAvatar(style, {
        seed: name,
        ...options,
        backgroundColor: ['ffffff'] // Ensure white background
      }).toString();
      attempts++;
    } while (!avatarSvg.includes('<svg') && attempts < maxAttempts);

    // Fallback to default style if generation fails
    if (!avatarSvg.includes('<svg')) {
      avatarSvg = createAvatar(avatarStyles[0].style, {
        seed: name,
        ...avatarStyles[0].options,
        backgroundColor: ['ffffff']
      }).toString();
    }
    
    this.profile = {
      name,
      avatarSvg,
      styleIndex: styleIdx
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.profile));
    }
    
    return this.profile;
  }

  _ensureInitialized() {
    if (!this.isInitialized && typeof window !== 'undefined') {
      this.initialize();
    }
  }
}

const AvatarManager = new AvatarManagerClass();

if (typeof window !== 'undefined') {
  AvatarManager.initialize();
}

export default AvatarManager;