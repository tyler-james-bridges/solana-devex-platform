module.exports = {
  // Print width - maximum line length
  printWidth: 100,
  
  // Tab width - number of spaces per indentation level
  tabWidth: 2,
  
  // Use tabs instead of spaces
  useTabs: false,
  
  // Semicolons - always add semicolons
  semi: true,
  
  // Quote style - use single quotes
  singleQuote: true,
  
  // Object property quotes - only when needed
  quoteProps: 'as-needed',
  
  // JSX quotes - use double quotes
  jsxSingleQuote: false,
  
  // Trailing commas - add trailing commas for cleaner diffs
  trailingComma: 'es5',
  
  // Bracket spacing - spaces inside object literals
  bracketSpacing: true,
  
  // JSX bracket line - put > on the same line
  bracketSameLine: false,
  
  // Arrow function parentheses - avoid when possible
  arrowParens: 'avoid',
  
  // Range formatting - format entire file
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // Parser - will be inferred from file extension
  parser: undefined,
  
  // File path - for parser inference
  filepath: undefined,
  
  // Require pragma - don't require @format comment
  requirePragma: false,
  
  // Insert pragma - don't insert @format comment
  insertPragma: false,
  
  // Prose wrap - maintain existing wrapping
  proseWrap: 'preserve',
  
  // HTML whitespace sensitivity - CSS display property
  htmlWhitespaceSensitivity: 'css',
  
  // Vue files script and style tags indentation
  vueIndentScriptAndStyle: false,
  
  // Line ending - Unix line endings
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Single attribute per line in HTML, Vue, JSX
  singleAttributePerLine: false,
  
  // Override settings for specific file types
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 80,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
  ],
};