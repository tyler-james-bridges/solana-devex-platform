import { LanguageConfig } from './index';

export const RUST_CONFIG: LanguageConfig = {
  id: 'rust',
  name: 'rust',
  displayName: 'Rust (Solana)',
  fileExtensions: ['rs'],
  priority: 'critical',
  category: 'solana-native',
  description: 'Rust language with Solana program development support',
  
  syntax: {
    keywords: [
      'fn', 'let', 'mut', 'const', 'static', 'if', 'else', 'match', 'while', 'for', 'loop',
      'break', 'continue', 'return', 'struct', 'enum', 'impl', 'trait', 'mod', 'pub', 'use',
      'extern', 'crate', 'super', 'self', 'Self', 'as', 'where', 'async', 'await', 'move',
      'ref', 'dyn', 'Box', 'Vec', 'Result', 'Option', 'Ok', 'Err', 'Some', 'None'
    ],
    types: [
      'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
      'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
      'f32', 'f64', 'bool', 'char', 'str', 'String',
      'Pubkey', 'AccountInfo', 'ProgramResult', 'SystemProgram',
      'Context', 'Program', 'Account', 'Signer', 'AccountLoader'
    ],
    operators: [
      '+', '-', '*', '/', '%', '=', '==', '!=', '<', '>', '<=', '>=',
      '&&', '||', '!', '&', '|', '^', '<<', '>>', '+=', '-=', '*=', '/=',
      '%=', '&=', '|=', '^=', '<<=' ,' >>=', '->', '=>', '::', '.', '?'
    ],
    builtins: [
      'println!', 'print!', 'format!', 'vec!', 'panic!', 'assert!', 'assert_eq!',
      'cfg!', 'env!', 'file!', 'line!', 'column!', 'stringify!', 'concat!'
    ],
    macros: [
      'program!', 'declare_id!', 'derive!', 'account!', 'instruction!',
      'msg!', 'require!', 'error_code!', 'event!'
    ]
  },

  snippets: [
    {
      label: 'Anchor Program Structure',
      description: 'Basic Anchor program with initialize function',
      prefix: 'anchor-program',
      category: 'program',
      body: [
        'use anchor_lang::prelude::*;',
        '',
        'declare_id!("${1:YOUR_PROGRAM_ID}");',
        '',
        '#[program]',
        'pub mod ${2:program_name} {',
        '    use super::*;',
        '',
        '    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {',
        '        ${3:// Implementation}',
        '        Ok(())',
        '    }',
        '}',
        '',
        '#[derive(Accounts)]',
        'pub struct Initialize<\'info> {',
        '    #[account(',
        '        init,',
        '        payer = user,',
        '        space = 8 + ${4:AccountType}::LEN',
        '    )]',
        '    pub account: Account<\'info, ${4:AccountType}>,',
        '    #[account(mut)]',
        '    pub user: Signer<\'info>,',
        '    pub system_program: Program<\'info, System>,',
        '}',
        '',
        '#[account]',
        'pub struct ${4:AccountType} {',
        '    ${5:// Account fields}',
        '}'
      ]
    },
    {
      label: 'PDA Derivation',
      description: 'Program Derived Address creation pattern',
      prefix: 'pda',
      category: 'utility',
      body: [
        'let (${1:pda}, ${2:bump}) = Pubkey::find_program_address(',
        '    &[',
        '        ${3:"seed".as_bytes()},',
        '        ${4:user.key().as_ref()},',
        '    ],',
        '    ctx.program_id',
        ');'
      ]
    },
    {
      label: 'Cross-Program Invocation',
      description: 'CPI pattern for calling other programs',
      prefix: 'cpi',
      category: 'utility',
      body: [
        'let cpi_accounts = ${1:TargetAccounts} {',
        '    ${2:account1: ctx.accounts.account1.to_account_info()},',
        '    ${3:account2: ctx.accounts.account2.to_account_info()},',
        '};',
        'let cpi_program = ${4:target_program.to_account_info()};',
        'let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);',
        '',
        '${5:target_program::cpi::instruction_name}(cpi_ctx, ${6:args})?;'
      ]
    },
    {
      label: 'SPL Token Transfer',
      description: 'Transfer SPL tokens using CPI',
      prefix: 'token-transfer',
      category: 'utility',
      body: [
        'use anchor_spl::token::{self, Transfer, TokenAccount, Token};',
        '',
        'let transfer_accounts = Transfer {',
        '    from: ctx.accounts.${1:from_account}.to_account_info(),',
        '    to: ctx.accounts.${2:to_account}.to_account_info(),',
        '    authority: ctx.accounts.${3:authority}.to_account_info(),',
        '};',
        'let transfer_ctx = CpiContext::new(',
        '    ctx.accounts.token_program.to_account_info(),',
        '    transfer_accounts',
        ');',
        '',
        'token::transfer(transfer_ctx, ${4:amount})?;'
      ]
    },
    {
      label: 'Error Handling',
      description: 'Custom error definitions',
      prefix: 'error-code',
      category: 'utility',
      body: [
        '#[error_code]',
        'pub enum ${1:ErrorCode} {',
        '    #[msg("${2:Error message}")]',
        '    ${3:CustomError},',
        '}'
      ]
    },
    {
      label: 'Account Constraints',
      description: 'Common account validation constraints',
      prefix: 'account-constraints',
      category: 'utility',
      body: [
        '#[account(',
        '    ${1|init,mut,has_one,seeds,bump,constraint|}${2: = ${3:value}},',
        '    ${4:payer = user},',
        '    ${5:space = 8 + Account::LEN}',
        ')]',
        'pub ${6:account}: ${7|Account,AccountLoader,Signer,UncheckedAccount|}<\'info, ${8:AccountType}>,'
      ]
    }
  ],

  tools: [
    {
      name: 'Anchor Build',
      command: 'anchor build',
      description: 'Build Anchor program',
      category: 'compiler'
    },
    {
      name: 'Anchor Test',
      command: 'anchor test',
      description: 'Run Anchor tests',
      category: 'tester'
    },
    {
      name: 'Anchor Deploy',
      command: 'anchor deploy',
      description: 'Deploy program to cluster',
      category: 'compiler'
    },
    {
      name: 'Cargo Check',
      command: 'cargo check',
      description: 'Check code without building',
      category: 'analyzer'
    },
    {
      name: 'Cargo Fmt',
      command: 'cargo fmt',
      description: 'Format Rust code',
      category: 'formatter'
    },
    {
      name: 'Cargo Clippy',
      command: 'cargo clippy',
      description: 'Lint Rust code',
      category: 'analyzer'
    }
  ],

  testing: {
    framework: 'anchor-test',
    testCommand: 'anchor test',
    testPattern: '**/*.rs',
    setupRequired: true
  }
};