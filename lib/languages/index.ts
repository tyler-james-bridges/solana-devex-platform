/**
 * Crypto Language Support System
 * Comprehensive language definitions and tooling for crypto development
 */

export interface LanguageConfig {
  id: string;
  name: string;
  displayName: string;
  fileExtensions: string[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'solana-native' | 'cross-chain' | 'agent-dev' | 'testing' | 'config';
  description: string;
  syntax: {
    keywords: string[];
    types: string[];
    operators: string[];
    builtins: string[];
    macros?: string[];
  };
  snippets: LanguageSnippet[];
  tools: LanguageTool[];
  testing: TestingConfig;
}

export interface LanguageSnippet {
  label: string;
  description: string;
  prefix: string;
  body: string[];
  category: 'program' | 'client' | 'test' | 'config' | 'utility';
}

export interface LanguageTool {
  name: string;
  command: string;
  description: string;
  category: 'compiler' | 'tester' | 'formatter' | 'analyzer';
}

export interface TestingConfig {
  framework: string;
  testCommand: string;
  testPattern: string;
  setupRequired: boolean;
}

// Export all language configurations
export { RUST_CONFIG } from './rust';
export { TYPESCRIPT_CONFIG } from './typescript';
export { SOLIDITY_CONFIG } from './solidity';
export { PYTHON_CONFIG } from './python';
export { MOVE_CONFIG } from './move';
export { CAIRO_CONFIG } from './cairo';
export { TOML_CONFIG } from './config-languages';

// Language registry for easy access
export const LANGUAGE_REGISTRY: LanguageConfig[] = [
  require('./rust').RUST_CONFIG,
  require('./typescript').TYPESCRIPT_CONFIG,
  require('./solidity').SOLIDITY_CONFIG,
  require('./python').PYTHON_CONFIG,
  require('./move').MOVE_CONFIG,
  require('./cairo').CAIRO_CONFIG,
  require('./config-languages').TOML_CONFIG,
];

// Helper functions
export function getLanguageById(id: string): LanguageConfig | undefined {
  return LANGUAGE_REGISTRY.find(lang => lang.id === id);
}

export function getLanguagesByPriority(priority: LanguageConfig['priority']): LanguageConfig[] {
  return LANGUAGE_REGISTRY.filter(lang => lang.priority === priority);
}

export function getLanguagesByCategory(category: LanguageConfig['category']): LanguageConfig[] {
  return LANGUAGE_REGISTRY.filter(lang => lang.category === category);
}

export function getLanguageByExtension(extension: string): LanguageConfig | undefined {
  return LANGUAGE_REGISTRY.find(lang => 
    lang.fileExtensions.includes(extension) || 
    lang.fileExtensions.includes(extension.replace('.', ''))
  );
}