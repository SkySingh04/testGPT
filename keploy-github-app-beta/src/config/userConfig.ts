import fs from 'fs';

export interface ModelInfo {
    name: string;
    link: string;
}

export interface UserConfig {
    useCase: string;
    apiEndpoint: string;
    selectedModel: string; 
}

const CONFIG_FILE = 'keploy-config.json';

export function saveConfig(config: UserConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function loadConfig(): UserConfig | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    console.warn('Config file not found:', CONFIG_FILE);
    return null;
  } catch (error: unknown) {
    const errorObj = error as { message?: string };
    const errorMessage = errorObj.message || 'Unknown error';
    console.error(`Error loading config: ${errorMessage}`, error);
    
    if (error instanceof SyntaxError) {
      console.error('JSON parsing error: The config file contains invalid JSON. Please check its format.');
    } else if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      console.error('Permission error: Unable to access the config file due to permission restrictions.');
    } else if ((error as NodeJS.ErrnoException).code === 'EMFILE') {
      console.error('System error: Too many open files. Try closing some applications and try again.');
    }
    
    return null;
  }
}
