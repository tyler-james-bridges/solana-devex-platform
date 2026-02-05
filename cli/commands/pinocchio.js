/**
 * Pinocchio High-Performance Program Development
 * Alternative to Anchor for compute-optimized programs
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Main pinocchio command handler
 */
async function main(options = {}) {
  console.log(chalk.cyan('  Pinocchio High-Performance Programs'));
  console.log(chalk.yellow('Alternative to Anchor for compute unit optimization'));
  
  try {
    // Check if we're in a Pinocchio workspace
    const cargoToml = path.join(process.cwd(), 'Cargo.toml');
    if (!fs.existsSync(cargoToml)) {
      console.log(chalk.yellow('  No Cargo.toml found. Initialize Rust workspace first:'));
      console.log(chalk.gray('  cargo init --name my-program'));
      return;
    }

    if (options.optimize) {
      await optimizeForCompute();
    } else {
      await showPinocchioInfo();
    }

  } catch (error) {
    console.error(chalk.red(` Pinocchio command failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Show Pinocchio information and setup
 */
async function showPinocchioInfo() {
  console.log(chalk.cyan(' Pinocchio vs Anchor'));
  
  console.log(chalk.blue('\\n When to use Pinocchio:'));
  console.log(chalk.gray('   Need minimal compute unit usage'));
  console.log(chalk.gray('   Want smallest possible binary size'));
  console.log(chalk.gray('   Zero dependencies requirements'));
  console.log(chalk.gray('   Fine-grained control over parsing/allocations'));
  console.log(chalk.gray('   Maximum performance optimization'));
  
  console.log(chalk.blue('\\n When to use Anchor (default):'));
  console.log(chalk.gray('   Fast iteration and development'));
  console.log(chalk.gray('   IDL generation and TypeScript clients'));
  console.log(chalk.gray('   Mature tooling and ecosystem'));
  console.log(chalk.gray('   Built-in security patterns'));
  
  console.log(chalk.cyan('\\n Pinocchio Setup:'));
  console.log(chalk.gray('  1. Add pinocchio dependencies to Cargo.toml:'));
  console.log(chalk.yellow('     pinocchio = "0.4"'));
  console.log(chalk.yellow('     pinocchio-log = "0.1"'));
  console.log(chalk.yellow('     pinocchio-system = "0.1"'));
  
  console.log(chalk.gray('\\n  2. Use compute-optimized patterns:'));
  console.log(chalk.yellow('     use pinocchio::{account_info::AccountInfo, entrypoint, pubkey::Pubkey};'));
  
  console.log(chalk.cyan('\\n Next steps:'));
  console.log(chalk.gray('  solana-devex pinocchio --optimize   # Apply compute optimizations'));
  console.log(chalk.gray('  cargo build-sbf                     # Build optimized binary'));
}

/**
 * Apply compute optimizations
 */
async function optimizeForCompute() {
  console.log(chalk.blue(' Applying Pinocchio compute optimizations...'));
  
  try {
    // Check for Cargo.toml
    const cargoTomlPath = path.join(process.cwd(), 'Cargo.toml');
    let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
    
    // Add optimization flags if not present
    if (!cargoToml.includes('[profile.release]')) {
      console.log(chalk.yellow(' Adding release optimizations to Cargo.toml...'));
      cargoToml += `
[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1
[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
`;
      fs.writeFileSync(cargoTomlPath, cargoToml);
    }
    
    // Add Pinocchio dependencies if not present
    if (!cargoToml.includes('pinocchio =')) {
      console.log(chalk.yellow(' Adding Pinocchio dependencies...'));
      const lines = cargoToml.split('\\n');
      const depsIndex = lines.findIndex(line => line.includes('[dependencies]'));
      
      if (depsIndex !== -1) {
        lines.splice(depsIndex + 1, 0, 
          'pinocchio = "0.4"',
          'pinocchio-log = "0.1"',
          'pinocchio-system = "0.1"'
        );
        fs.writeFileSync(cargoTomlPath, lines.join('\\n'));
      }
    }
    
    // Create example optimized program structure
    await createOptimizedTemplate();
    
    console.log(chalk.green(' Pinocchio optimizations applied'));
    console.log(chalk.cyan(' Build with: cargo build-sbf'));
    
  } catch (error) {
    console.error(chalk.red('Optimization failed:', error.message));
    throw error;
  }
}

/**
 * Create optimized program template
 */
async function createOptimizedTemplate() {
  const srcDir = path.join(process.cwd(), 'src');
  const libPath = path.join(srcDir, 'lib.rs');
  
  if (!fs.existsSync(libPath)) {
    console.log(chalk.yellow(' Creating optimized program template...'));
    
    await fs.ensureDir(srcDir);
    
    const template = `//! Pinocchio High-Performance Solana Program
//! Optimized for minimal compute units and binary size

use pinocchio::{
    account_info::AccountInfo,
    entrypoint,
    program_error::ProgramError,
    pubkey::Pubkey,
};

entrypoint!(process_instruction);

/// Main instruction processor
/// Optimized for minimal compute usage
pub fn process_instruction(
    _program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> Result<(), ProgramError> {
    // Parse instruction with zero-copy patterns
    let instruction = parse_instruction(instruction_data)?;
    
    match instruction {
        MyInstruction::Initialize => {
            process_initialize(accounts)
        }
        MyInstruction::Execute { amount } => {
            process_execute(accounts, amount)
        }
    }
}

/// Zero-copy instruction parsing
/// Avoids allocations for better performance
#[repr(u8)]
enum MyInstruction {
    Initialize = 0,
    Execute { amount: u64 } = 1,
}

fn parse_instruction(data: &[u8]) -> Result<MyInstruction, ProgramError> {
    if data.is_empty() {
        return Err(ProgramError::InvalidInstructionData);
    }
    
    match data[0] {
        0 => Ok(MyInstruction::Initialize),
        1 => {
            if data.len() != 9 {
                return Err(ProgramError::InvalidInstructionData);
            }
            let amount = u64::from_le_bytes(
                data[1..9].try_into().map_err(|_| ProgramError::InvalidInstructionData)?
            );
            Ok(MyInstruction::Execute { amount })
        }
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn process_initialize(accounts: &[AccountInfo]) -> Result<(), ProgramError> {
    // Compute-optimized initialization logic
    Ok(())
}

fn process_execute(accounts: &[AccountInfo], amount: u64) -> Result<(), ProgramError> {
    // Compute-optimized execution logic
    Ok(())
}
`;
    
    fs.writeFileSync(libPath, template);
    console.log(chalk.green(' Created optimized program template'));
  }
}

module.exports = {
  main,
  optimizeForCompute
};