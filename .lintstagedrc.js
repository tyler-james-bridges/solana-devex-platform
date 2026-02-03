module.exports = {
  // JavaScript and TypeScript files
  '*.{js,jsx,ts,tsx}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    'git add',
  ],
  
  // JSON files
  '*.json': [
    'prettier --write',
    'git add',
  ],
  
  // CSS and style files
  '*.{css,scss,sass,less}': [
    'prettier --write',
    'git add',
  ],
  
  // Markdown files
  '*.md': [
    'prettier --write',
    'git add',
  ],
  
  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
    'git add',
  ],
  
  // API specific files
  'api/**/*.{js,ts}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
    // Run tests for API files that have been changed
    () => 'npm run test:api -- --bail --findRelatedTests',
  ],
  
  // CLI specific files
  'cli/**/*.{js,ts}': [
    'eslint --fix --max-warnings 0',
    'prettier --write',
  ],
  
  // Package.json files - validate and sort
  'package.json': [
    'prettier --write',
    'git add',
  ],
  
  // Security check for sensitive files
  '*': [
    () => {
      // Custom function to check for sensitive data
      return 'echo "Checking for sensitive data..." && git diff --cached --name-only | xargs grep -l "private.*key\\|secret.*key\\|-----BEGIN.*PRIVATE" 2>/dev/null && echo "❌ Found sensitive data!" && exit 1 || echo "✅ No sensitive data found"';
    },
  ],
};