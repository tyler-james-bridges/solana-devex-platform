import { LanguageConfig } from './index';

export const CAIRO_CONFIG: LanguageConfig = {
  id: 'cairo',
  name: 'cairo',
  displayName: 'Cairo',
  fileExtensions: ['cairo'],
  priority: 'medium',
  category: 'cross-chain',
  description: 'Cairo language for StarkNet development',
  
  syntax: {
    keywords: [
      'func', 'struct', 'namespace', 'const', 'let', 'tempvar', 'local', 'if', 'else',
      'with', 'with_attr', 'alloc', 'cast', 'assert', 'static_assert', 'from', 'import',
      'return', 'call', 'ret', 'jmp', 'jmp_rel', 'jmp_abs', 'ap', 'fp', 'pc', 'end',
      'member', 'codeoffset', 'dw', 'felt', 'hint', 'nondet', 'range_check_ptr'
    ],
    types: [
      'felt', 'felt*', 'Uint256', 'bool', 'CodeOffset', 'HashBuiltin', 'SignatureBuiltin',
      'BitwiseBuiltin', 'EcOpBuiltin', 'KeccakBuiltin', 'PoseidonBuiltin'
    ],
    operators: [
      '+', '-', '*', '/', '=', '==', '!=', '<', '>', '<=', '>=', '&', '|', '^', '~',
      '<<', '>>', '->', '.', '::', '[', ']', '(', ')', '{', '}'
    ],
    builtins: [
      'assert', 'assert_not_zero', 'assert_not_equal', 'assert_nn', 'assert_le',
      'assert_lt', 'assert_in_range', 'tempvar', 'local', 'const', 'alloc_locals'
    ]
  },

  snippets: [
    {
      label: 'Cairo Contract',
      description: 'Basic Cairo contract structure',
      prefix: 'contract',
      category: 'program',
      body: [
        '%lang starknet',
        '',
        'from starkware.cairo.common.cairo_builtins import HashBuiltin',
        'from starkware.starknet.common.syscalls import get_caller_address',
        '',
        '@storage_var',
        'func ${1:storage_variable}() -> (value: felt) {',
        '}',
        '',
        '@constructor',
        'func constructor{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(',
        '    ${2:initial_value}: felt',
        ') {',
        '    ${1:storage_variable}.write(${2:initial_value});',
        '    return ();',
        '}',
        '',
        '@external',
        'func ${3:function_name}{syscall_ptr: felt*, pedersen_ptr: HashBuiltin*, range_check_ptr}(',
        '    ${4:parameter}: felt',
        ') -> (${5:return_value}: felt) {',
        '    ${6:// Implementation}',
        '    return (${5:return_value}=${4:parameter});',
        '}'
      ]
    }
  ],

  tools: [
    {
      name: 'Cairo Compile',
      command: 'cairo-compile',
      description: 'Cairo compiler',
      category: 'compiler'
    },
    {
      name: 'Starknet Compile',
      command: 'starknet-compile',
      description: 'StarkNet Cairo compiler',
      category: 'compiler'
    }
  ],

  testing: {
    framework: 'cairo-test',
    testCommand: 'cairo-test',
    testPattern: '**/*test*.cairo',
    setupRequired: true
  }
};