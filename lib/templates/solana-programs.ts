import { Template } from './index';

export const SOLANA_PROGRAM_TEMPLATES: Template[] = [
  {
    id: 'anchor-basic-program',
    name: 'Basic Anchor Program',
    description: 'A simple Anchor program with initialize and update functions',
    category: 'program',
    language: 'rust',
    files: [
      {
        path: 'programs/${project_name}/src/lib.rs',
        content: `use anchor_lang::prelude::*;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod ${project_name} {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, data: u64) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.data = data;
        Ok(())
    }

    pub fn update(ctx: Context<Update>, data: u64) -> Result<()> {
        let base_account = &mut ctx.accounts.base_account;
        base_account.data = data;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8
    )]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Update<'info> {
    #[account(mut)]
    pub base_account: Account<'info, BaseAccount>,
}

#[account]
pub struct BaseAccount {
    pub data: u64,
}
`
      },
      {
        path: 'programs/${project_name}/Cargo.toml',
        content: `[package]
name = "${project_name}"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${project_name}"

[dependencies]
anchor-lang = "0.29.0"
`
      }
    ],
    dependencies: ['anchor-lang'],
    setup: [
      'anchor init ${PROJECT_NAME}',
      'cd ${PROJECT_NAME}',
      'anchor build',
      'anchor test'
    ]
  },

  {
    id: 'spl-token-program',
    name: 'SPL Token Program',
    description: 'Token creation and management with SPL Token integration',
    category: 'program',
    language: 'rust',
    files: [
      {
        path: 'programs/${project_name}/src/lib.rs',
        content: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, MintTo, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod ${project_name} {
    use super::*;

    pub fn create_token(ctx: Context<CreateToken>, decimals: u8) -> Result<()> {
        msg!("Token created successfully");
        Ok(())
    }

    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::mint_to(cpi_ctx, amount)?;
        Ok(())
    }

    pub fn transfer_tokens(ctx: Context<TransferTokens>, amount: u64) -> Result<()> {
        let cpi_accounts = Transfer {
            from: ctx.accounts.from.to_account_info(),
            to: ctx.accounts.to.to_account_info(),
            authority: ctx.accounts.from_authority.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::transfer(cpi_ctx, amount)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct CreateToken<'info> {
    #[account(
        init,
        payer = payer,
        mint::decimals = decimals,
        mint::authority = authority,
    )]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub payer: Signer<'info>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct TransferTokens<'info> {
    #[account(mut)]
    pub from: Account<'info, TokenAccount>,
    #[account(mut)]
    pub to: Account<'info, TokenAccount>,
    pub from_authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
}
`
      },
      {
        path: 'programs/${project_name}/Cargo.toml',
        content: `[package]
name = "${project_name}"
version = "0.1.0"
description = "SPL Token Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${project_name}"

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
spl-token = { version = "4.0", features = ["no-entrypoint"] }
spl-associated-token-account = { version = "2.0", features = ["no-entrypoint"] }
`
      }
    ],
    dependencies: ['anchor-lang', 'anchor-spl'],
    setup: [
      'anchor init ${PROJECT_NAME}',
      'cd ${PROJECT_NAME}',
      'anchor build',
      'anchor test'
    ]
  },

  {
    id: 'defi-trading-program',
    name: 'DeFi Trading Program',
    description: 'Automated trading program with Jupiter integration',
    category: 'program',
    language: 'rust',
    files: [
      {
        path: 'programs/${project_name}/src/lib.rs',
        content: `use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

declare_id!("11111111111111111111111111111112");

#[program]
pub mod ${project_name} {
    use super::*;

    pub fn initialize_strategy(
        ctx: Context<InitializeStrategy>,
        min_profit_bps: u16,
        max_slippage_bps: u16
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        strategy.authority = ctx.accounts.authority.key();
        strategy.min_profit_bps = min_profit_bps;
        strategy.max_slippage_bps = max_slippage_bps;
        strategy.is_active = true;
        strategy.total_trades = 0;
        strategy.total_profit = 0;
        
        msg!("Trading strategy initialized");
        Ok(())
    }

    pub fn execute_trade(
        ctx: Context<ExecuteTrade>,
        input_amount: u64,
        min_output_amount: u64
    ) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        
        require!(strategy.is_active, TradingError::StrategyInactive);
        require!(input_amount > 0, TradingError::InvalidAmount);
        
        // Simulate trading logic (replace with actual Jupiter integration)
        let estimated_output = calculate_trade_output(input_amount, min_output_amount);
        
        require!(
            estimated_output >= min_output_amount,
            TradingError::InsufficientOutput
        );

        // Execute the trade
        strategy.total_trades += 1;
        strategy.total_profit += estimated_output.saturating_sub(input_amount);
        
        msg!("Trade executed: {} -> {}", input_amount, estimated_output);
        Ok(())
    }

    pub fn pause_strategy(ctx: Context<UpdateStrategy>) -> Result<()> {
        let strategy = &mut ctx.accounts.strategy;
        strategy.is_active = false;
        msg!("Trading strategy paused");
        Ok(())
    }
}

fn calculate_trade_output(input_amount: u64, min_output: u64) -> u64 {
    // Simplified calculation - replace with actual Jupiter price calculation
    input_amount.saturating_mul(102).saturating_div(100) // 2% profit simulation
}

#[derive(Accounts)]
pub struct InitializeStrategy<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + TradingStrategy::LEN
    )]
    pub strategy: Account<'info, TradingStrategy>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteTrade<'info> {
    #[account(
        mut,
        has_one = authority,
        constraint = strategy.is_active @ TradingError::StrategyInactive
    )]
    pub strategy: Account<'info, TradingStrategy>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateStrategy<'info> {
    #[account(
        mut,
        has_one = authority
    )]
    pub strategy: Account<'info, TradingStrategy>,
    pub authority: Signer<'info>,
}

#[account]
pub struct TradingStrategy {
    pub authority: Pubkey,
    pub min_profit_bps: u16,
    pub max_slippage_bps: u16,
    pub is_active: bool,
    pub total_trades: u64,
    pub total_profit: u64,
}

impl TradingStrategy {
    pub const LEN: usize = 32 + 2 + 2 + 1 + 8 + 8;
}

#[error_code]
pub enum TradingError {
    #[msg("Trading strategy is not active")]
    StrategyInactive,
    #[msg("Invalid trade amount")]
    InvalidAmount,
    #[msg("Insufficient output amount")]
    InsufficientOutput,
}
`
      },
      {
        path: 'programs/${project_name}/Cargo.toml',
        content: `[package]
name = "${project_name}"
version = "0.1.0"
description = "DeFi Trading Program"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "${project_name}"

[dependencies]
anchor-lang = "0.29.0"
anchor-spl = "0.29.0"
spl-token = { version = "4.0", features = ["no-entrypoint"] }
`
      }
    ],
    dependencies: ['anchor-lang', 'anchor-spl'],
    setup: [
      'anchor init ${PROJECT_NAME}',
      'cd ${PROJECT_NAME}',
      'anchor build',
      'anchor deploy --provider.cluster devnet'
    ]
  }
];`