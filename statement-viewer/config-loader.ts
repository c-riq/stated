import type { AppConfig } from './types.js';

const CONFIG_CACHE_KEY = 'stated_config_cache';
const CONFIG_TIMESTAMP_KEY = 'stated_config_timestamp';
const CACHE_DURATION = 5 * 60 * 1000;

export async function loadConfig(configFile: string = './config.json'): Promise<AppConfig> {
    const cachedConfig = getCachedConfig();
    const cacheTimestamp = localStorage.getItem(CONFIG_TIMESTAMP_KEY);
    const now = Date.now();
    const isCacheValid = cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION;
    
    if (cachedConfig && isCacheValid) {
        fetchAndCacheConfig(configFile).catch(() => {});
        return cachedConfig;
    }
    
    return await fetchAndCacheConfig(configFile);
}

async function fetchAndCacheConfig(configFile: string): Promise<AppConfig> {
    const response = await fetch(configFile);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch config: ${response.status}`);
    }
    
    const config = await response.json();
    
    if (!config.branding || !config.branding.title) {
        throw new Error('Invalid config structure');
    }
    
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify(config));
    localStorage.setItem(CONFIG_TIMESTAMP_KEY, Date.now().toString());
    
    return config;
}

function getCachedConfig(): AppConfig | null {
    try {
        const cached = localStorage.getItem(CONFIG_CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        localStorage.removeItem(CONFIG_CACHE_KEY);
        localStorage.removeItem(CONFIG_TIMESTAMP_KEY);
    }
    return null;
}

export function clearConfigCache(): void {
    localStorage.removeItem(CONFIG_CACHE_KEY);
    localStorage.removeItem(CONFIG_TIMESTAMP_KEY);
}

export function applyBranding(config: AppConfig): void {
    const logos = document.querySelectorAll('.header-logo');
    logos.forEach(logo => {
        if (logo instanceof HTMLImageElement) {
            logo.src = config.branding.logo;
        }
    });
    
    const titleElements = document.querySelectorAll('.header-left h1');
    titleElements.forEach(titleEl => {
        const link = titleEl.querySelector('a');
        const subtitleSpan = titleEl.querySelector('.subtitle');
        if (link) {
            link.textContent = config.branding.title;
        }
        if (subtitleSpan) {
            subtitleSpan.textContent = config.branding.subtitle;
        }
    });
    
    document.title = `${config.branding.subtitle} - ${config.branding.title}`;
}