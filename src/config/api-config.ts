/**
 * API Configuration
 * Switch between Midnight and Defensio mining APIs
 */

export type ApiProvider = 'midnight' | 'defensio';

export interface ApiConfig {
  baseUrl: string;
  name: string;
  displayName: string;
  termsMessage: string;
}

const API_CONFIGS: Record<ApiProvider, ApiConfig> = {
  midnight: {
    baseUrl: 'https://scavenger.prod.gd.midnighttge.io',
    name: 'midnight',
    displayName: 'Midnight Scavenger Hunt',
    termsMessage: 'I agree to abide by the terms and conditions as described in version 1-0 of the Midnight mining process.',
  },
  defensio: {
    baseUrl: 'https://mine.defensio.io/api',
    name: 'defensio',
    displayName: 'Defensio DFO Mining',
    termsMessage: 'I agree to abide by the terms and conditions as described in version 1-0 of the Defensio DFO mining process: 2da58cd94d6ccf3d933c4a55ebc720ba03b829b84033b4844aafc36828477cc0',
  },
};

// Set the active API provider here
export const ACTIVE_PROVIDER: ApiProvider = 'defensio';

// Export the active configuration
export const API_CONFIG = API_CONFIGS[ACTIVE_PROVIDER];

// Convenience exports
export const API_BASE_URL = API_CONFIG.baseUrl;
export const API_DISPLAY_NAME = API_CONFIG.displayName;
export const API_TERMS_MESSAGE = API_CONFIG.termsMessage;
