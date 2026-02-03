/**
 * Template Generator System
 * Pre-built templates for common crypto development patterns
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'program' | 'client' | 'test' | 'config' | 'agent';
  language: string;
  files: TemplateFile[];
  dependencies?: string[];
  setup?: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  language?: string;
}

// Template Categories
export const TEMPLATE_CATEGORIES = {
  PROGRAM: 'program',
  CLIENT: 'client', 
  TEST: 'test',
  CONFIG: 'config',
  AGENT: 'agent'
} as const;

// Export all templates
export { SOLANA_PROGRAM_TEMPLATES } from './solana-programs';
export { CLIENT_TEMPLATES } from './clients';
export { TESTING_TEMPLATES } from './testing';
export { AGENT_TEMPLATES } from './agents';
export { CONFIG_TEMPLATES } from './configurations';

// Template registry
import { SOLANA_PROGRAM_TEMPLATES } from './solana-programs';
import { CLIENT_TEMPLATES } from './clients';
import { TESTING_TEMPLATES } from './testing';
import { AGENT_TEMPLATES } from './agents';
import { CONFIG_TEMPLATES } from './configurations';

export const TEMPLATE_REGISTRY: Template[] = [
  ...SOLANA_PROGRAM_TEMPLATES,
  ...CLIENT_TEMPLATES,
  ...TESTING_TEMPLATES,
  ...AGENT_TEMPLATES,
  ...CONFIG_TEMPLATES
];

// Helper functions
export function getTemplateById(id: string): Template | undefined {
  return TEMPLATE_REGISTRY.find(template => template.id === id);
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATE_REGISTRY.filter(template => template.category === category);
}

export function getTemplatesByLanguage(language: string): Template[] {
  return TEMPLATE_REGISTRY.filter(template => template.language === language);
}

export function generateProjectFromTemplate(template: Template, projectName: string): { [path: string]: string } {
  const files: { [path: string]: string } = {};
  
  template.files.forEach(file => {
    let content = file.content;
    
    // Replace template variables
    content = content.replace(/\${PROJECT_NAME}/g, projectName);
    content = content.replace(/\${project_name}/g, projectName.toLowerCase().replace(/\s+/g, '_'));
    content = content.replace(/\${ProjectName}/g, toPascalCase(projectName));
    
    files[file.path] = content;
  });
  
  return files;
}

function toPascalCase(str: string): string {
  return str.replace(/(?:^|\s)\w/g, match => match.toUpperCase()).replace(/\s+/g, '');
}