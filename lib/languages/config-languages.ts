import { LanguageConfig } from './index';

export const TOML_CONFIG: LanguageConfig = {
  id: 'toml',
  name: 'toml',
  displayName: 'TOML',
  fileExtensions: ['toml'],
  priority: 'high',
  category: 'config',
  description: 'TOML configuration files for Cargo and Anchor',
  
  syntax: {
    keywords: [
      'true', 'false'
    ],
    types: [
      'string', 'integer', 'float', 'boolean', 'datetime', 'array', 'table'
    ],
    operators: [
      '=', '.', '[', ']', '{', '}', ',', '#'
    ],
    builtins: []
  },

  snippets: [
    {
      label: 'Anchor.toml',
      description: 'Anchor project configuration',
      prefix: 'anchor-toml',
      category: 'config',
      body: [
        '[features]',
        'seeds = false',
        'skip-lint = false',
        '',
        '[programs.localnet]',
        '${1:program_name} = "${2:PROGRAM_ID}"',
        '',
        '[programs.devnet]',
        '${1:program_name} = "${2:PROGRAM_ID}"',
        '',
        '[programs.mainnet]',
        '${1:program_name} = "${2:PROGRAM_ID}"',
        '',
        '[registry]',
        'url = "https://api.apr.dev"',
        '',
        '[provider]',
        'cluster = "${3|localnet,devnet,testnet,mainnet-beta|}"',
        'wallet = "${4:~/.config/solana/id.json}"',
        '',
        '[scripts]',
        'test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"'
      ]
    },
    {
      label: 'Cargo.toml',
      description: 'Rust Cargo configuration for Solana',
      prefix: 'cargo-toml',
      category: 'config',
      body: [
        '[package]',
        'name = "${1:program-name}"',
        'version = "0.1.0"',
        'description = "${2:Program description}"',
        'edition = "2021"',
        '',
        '[lib]',
        'crate-type = ["cdylib", "lib"]',
        'name = "${1:program_name}"',
        '',
        '[dependencies]',
        'anchor-lang = "0.29.0"',
        'anchor-spl = "0.29.0"',
        'spl-token = { version = "4.0", features = ["no-entrypoint"] }',
        'spl-associated-token-account = { version = "2.0", features = ["no-entrypoint"] }',
        '',
        '[dev-dependencies]',
        'solana-program-test = "1.17"',
        'tokio = "1.0"'
      ]
    }
  ],

  tools: [
    {
      name: 'TOML Check',
      command: 'toml-check',
      description: 'Validate TOML syntax',
      category: 'analyzer'
    }
  ],

  testing: {
    framework: 'none',
    testCommand: '',
    testPattern: '',
    setupRequired: false
  }
};

export const YAML_CONFIG: LanguageConfig = {
  id: 'yaml',
  name: 'yaml',
  displayName: 'YAML',
  fileExtensions: ['yaml', 'yml'],
  priority: 'high',
  category: 'config',
  description: 'YAML configuration for CI/CD and Docker',
  
  syntax: {
    keywords: [
      'true', 'false', 'null', 'yes', 'no', 'on', 'off'
    ],
    types: [
      'string', 'number', 'boolean', 'array', 'object', 'null'
    ],
    operators: [
      ':', '-', '|', '>', '&', '*', '!', '%', '@'
    ],
    builtins: []
  },

  snippets: [
    {
      label: 'GitHub Actions Solana CI',
      description: 'GitHub Actions workflow for Solana projects',
      prefix: 'github-actions',
      category: 'config',
      body: [
        'name: ${1:Solana CI}',
        '',
        'on:',
        '  push:',
        '    branches: [main]',
        '  pull_request:',
        '    branches: [main]',
        '',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v3',
        '      ',
        '      - name: Setup Node.js',
        '        uses: actions/setup-node@v3',
        '        with:',
        '          node-version: 18',
        '          cache: "yarn"',
        '      ',
        '      - name: Setup Rust',
        '        uses: actions-rs/toolchain@v1',
        '        with:',
        '          toolchain: stable',
        '          override: true',
        '      ',
        '      - name: Setup Solana',
        '        run: |',
        '          sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"',
        '          echo "$HOME/.local/share/solana/install/active_release/bin" >> $GITHUB_PATH',
        '      ',
        '      - name: Setup Anchor',
        '        run: |',
        '          cargo install --git https://github.com/coral-xyz/anchor avm --locked --force',
        '          avm install latest',
        '          avm use latest',
        '      ',
        '      - name: Install dependencies',
        '        run: yarn install',
        '      ',
        '      - name: Build program',
        '        run: anchor build',
        '      ',
        '      - name: Run tests',
        '        run: anchor test --skip-local-validator'
      ]
    }
  ],

  tools: [
    {
      name: 'YAML Lint',
      command: 'yamllint',
      description: 'YAML linter',
      category: 'analyzer'
    }
  ],

  testing: {
    framework: 'none',
    testCommand: '',
    testPattern: '',
    setupRequired: false
  }
};