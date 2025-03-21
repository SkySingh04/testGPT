import * as fs from 'fs';

// Define local error types for this file
class ConfigFileError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
    // Maintain proper stack trace in Node.js
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
    
    // Append the cause's stack to this error's stack if available
    if (this.cause instanceof Error && this.cause.stack) {
      this.stack = this.stack ? `${this.stack}\nCaused by: ${this.cause.stack}` : this.cause.stack;
    }
  }
}

class FileSystemError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

class ConfigError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

class ParseError extends ConfigFileError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

// Define a Result type for handling success/failure
export type Result<T, E = Error> = 
  | { success: true; value: T } 
  | { success: false; error: E };

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

/**
 * Utility function to log errors with full stack traces
 * @param message Custom error message
 * @param error The error object
 */
function logError(message: string, error: unknown): void {
  console.error(message);
  
  if (error instanceof Error) {
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);
    
    // If it's our custom error with a cause, log the cause stack too
    if ('cause' in error && error.cause instanceof Error) {
      console.error('Caused by:', error.cause);
      console.error('Cause stack trace:', error.cause.stack);
    }
  } else {
    console.error('Unknown error type:', error);
  }
}

export function saveConfig(config: UserConfig): Result<void, Error> {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return { success: true, value: undefined };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    let appError: Error;
    
    if (errorObj.code === 'EACCES') {
      appError = new FileSystemError('Permission denied: Unable to write to config file', error);
    } else if (errorObj.code === 'ENOENT') {
      appError = new FileSystemError('Directory not found: Unable to write to config file', error);
    } else {
      appError = new ConfigError(`Failed to save configuration: ${errorObj.message || 'Unknown error'}`, error);
    }
    
    logError(appError.message, error);
    return { success: false, error: appError };
  }
}

export function loadConfig(): Result<UserConfig, Error> {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      return { success: true, value: config };
    }
    
    const error = new ConfigError(`Config file not found: ${CONFIG_FILE}`);
    console.warn(error.message);
    return { success: false, error };
  } catch (error: unknown) {
    const errorObj = error as { message?: string; code?: string };
    const errorMessage = errorObj.message || 'Unknown error';
    let appError: Error;
    
    if (error instanceof SyntaxError) {
      appError = new ParseError('JSON parsing error: The config file contains invalid JSON. Please check its format.', error);
    } else if (errorObj.code === 'EACCES') {
      appError = new FileSystemError('Permission error: Unable to access the config file due to permission restrictions.', error);
    } else if (errorObj.code === 'EMFILE') {
      appError = new FileSystemError('System error: Too many open files. Try closing some applications and try again.', error);
    } else {
      appError = new ConfigError(`Error loading config: ${errorMessage}`, error);
    }
    
    logError(appError.message, error);
    return { success: false, error: appError };
  }
}
