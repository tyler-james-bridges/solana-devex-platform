import { LanguageConfig } from './index';

export const MOVE_CONFIG: LanguageConfig = {
  id: 'move',
  name: 'move',
  displayName: 'Move',
  fileExtensions: ['move'],
  priority: 'medium',
  category: 'cross-chain',
  description: 'Move language for Aptos and Sui development',
  
  syntax: {
    keywords: [
      'module', 'script', 'use', 'struct', 'resource', 'fun', 'public', 'native', 'friend',
      'has', 'copy', 'drop', 'store', 'key', 'if', 'else', 'while', 'loop', 'break',
      'continue', 'return', 'abort', 'let', 'mut', 'move', 'copy', 'borrow', 'borrow_global',
      'exists', 'move_from', 'move_to', 'freeze', 'assert', 'spec', 'pragma', 'include',
      'requires', 'ensures', 'aborts_if', 'invariant', 'modifies', 'global'
    ],
    types: [
      'bool', 'u8', 'u16', 'u32', 'u64', 'u128', 'u256', 'address', 'signer', 'vector',
      'Option', 'String', 'TypeInfo', 'Object', 'Coin'
    ],
    operators: [
      '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!',
      '&', '|', '^', '<<', '>>', '+=', '-=', '*=', '/=', '%=', '::', '.', '->'
    ],
    builtins: [
      'vector', 'option', 'error', 'debug', 'string', 'type_info', 'account', 'event',
      'table', 'simple_map', 'aptos_framework', 'std'
    ]
  },

  snippets: [
    {
      label: 'Move Module',
      description: 'Basic Move module structure',
      prefix: 'module',
      category: 'program',
      body: [
        'module ${1:address}::${2:module_name} {',
        '    use std::signer;',
        '',
        '    struct ${3:ResourceName} has key {',
        '        ${4:field}: ${5:type},',
        '    }',
        '',
        '    public fun ${6:function_name}(account: &signer) {',
        '        ${7:// Implementation}',
        '    }',
        '}'
      ]
    },
    {
      label: 'Coin Operations',
      description: 'Move coin transfer operations',
      prefix: 'coin-transfer',
      category: 'utility',
      body: [
        'use aptos_framework::coin;',
        'use aptos_framework::aptos_coin::AptosCoin;',
        '',
        'public fun transfer_coins(',
        '    from: &signer,',
        '    to: address,',
        '    amount: u64',
        ') {',
        '    coin::transfer<AptosCoin>(from, to, amount);',
        '}'
      ]
    }
  ],

  tools: [
    {
      name: 'Move CLI',
      command: 'move',
      description: 'Move compiler and CLI',
      category: 'compiler'
    },
    {
      name: 'Aptos CLI',
      command: 'aptos move compile',
      description: 'Aptos Move compilation',
      category: 'compiler'
    }
  ],

  testing: {
    framework: 'move-test',
    testCommand: 'move test',
    testPattern: '**/*.move',
    setupRequired: true
  }
};