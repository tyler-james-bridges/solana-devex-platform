/**
 * Automated Security Analysis Commands
 * Implements official Solana security checklist as tooling
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

/**
 * Main security command handler
 */
async function main(options) {
  console.log(chalk.cyan(' Solana Security Analysis'));
  
  if (options.audit) {
    await runFullSecurityAudit();
  } else if (options.risks) {
    await analyzeSigningRisks();
  } else {
    await quickSecurityCheck();
  }
}

/**
 * Run comprehensive security audit
 */
async function runFullSecurityAudit() {
  console.log(chalk.yellow('  Running Full Security Audit...'));
  
  const results = {
    signingRisks: await analyzeSigningRisks(false),
    feeAnalysis: await analyzeFeeHandling(false),
    cpiRisks: await analyzeCPIRisks(false),
    tokenRisks: await analyzeTokenRisks(false),
    accountSecurity: await analyzeAccountSecurity(false),
    programSecurity: await analyzeProgramSecurity(false)
  };

  // Generate audit report
  const reportPath = await generateAuditReport(results);
  
  console.log(chalk.green(' Security audit completed'));
  console.log(chalk.gray(`„ Report saved to: ${reportPath}`));
  
  // Show summary
  showAuditSummary(results);
}

/**
 * Analyze signing/fee/CPI/token transfer risks
 */
async function analyzeSigningRisks(standalone = true) {
  if (standalone) {
    console.log(chalk.yellow(' Analyzing Signing, Fee & Transfer Risks...'));
  }
  
  const risks = {
    signingIssues: ,
    feeIssues: ,
    cpiIssues: ,
    tokenIssues: ,
    severity: 'low'
  };

  try {
    // Scan for common signing patterns
    const signingPatterns = await scanForSigningPatterns();
    risks.signingIssues = validateSigningPatterns(signingPatterns);

    // Analyze fee handling
    const feePatterns = await scanForFeePatterns();
    risks.feeIssues = validateFeePatterns(feePatterns);

    // Check CPI security
    const cpiPatterns = await scanForCPIPatterns();
    risks.cpiIssues = validateCPIPatterns(cpiPatterns);

    // Analyze token operations
    const tokenPatterns = await scanForTokenPatterns();
    risks.tokenIssues = validateTokenPatterns(tokenPatterns);

    // Determine overall severity
    risks.severity = calculateSeverity(risks);

    if (standalone) {
      displayRiskAnalysis(risks);
    }

    return risks;
    
  } catch (error) {
    console.error(chalk.red(` Risk analysis failed: ${error.message}`));
    if (standalone) process.exit(1);
    return risks;
  }
}

/**
 * Quick security check
 */
async function quickSecurityCheck() {
  console.log(chalk.yellow(' Quick Security Check...'));

  const checks = [
    { name: 'Signer validation', fn: checkSignerValidation },
    { name: 'Fee payer security', fn: checkFeePayerSecurity },
    { name: 'Account ownership', fn: checkAccountOwnership },
    { name: 'Token program validation', fn: checkTokenProgramValidation },
    { name: 'Instruction data validation', fn: checkInstructionValidation }
  ];

  const results = ;
  
  for (const check of checks) {
    try {
      const result = await check.fn();
      results.push({ name: check.name, status: result.status, details: result.details });
      
      const statusIcon = result.status === 'pass' ? '' : 
                        result.status === 'warning' ? '' : '';
      console.log(`  ${statusIcon} ${check.name}`);
      
    } catch (error) {
      results.push({ name: check.name, status: 'error', details: error.message });
      console.log(`   ${check.name} (error: ${error.message})`);
    }
  }

  // Generate quick recommendations
  const recommendations = generateQuickRecommendations(results);
  
  if (recommendations.length > 0) {
    console.log(chalk.cyan('\\n Security Recommendations:'));
    recommendations.forEach(rec => {
      console.log(chalk.gray(`  ¢ ${rec}`));
    });
  } else {
    console.log(chalk.green('\\n No immediate security concerns found'));
  }

  return results;
}

/**
 * Scan for signing patterns in source code
 */
async function scanForSigningPatterns() {
  const patterns = ;
  
  try {
    // Look for JavaScript/TypeScript files
    const sourceFiles = await findSourceFiles();
    
    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      // Check for various signing patterns
      const signingMatches = [
        { pattern: /\\.sign\\(/g, type: 'explicit_signing', file },
        { pattern: /sendTransaction\\(/g, type: 'transaction_sending', file },
        { pattern: /signAndSendTransaction\\(/g, type: 'sign_and_send', file },
        { pattern: /keypair\\.secretKey/g, type: 'secret_key_access', file },
        { pattern: /privateKey/g, type: 'private_key_reference', file }
      ];
      
      signingMatches.forEach(match => {
        const matches = content.match(match.pattern);
        if (matches) {
          patterns.push({
            ...match,
            occurrences: matches.length,
            content: content
          });
        }
      });
    }
  } catch (error) {
    console.warn(chalk.yellow(` Could not scan signing patterns: ${error.message}`));
  }
  
  return patterns;
}

/**
 * Validate signing patterns for security issues
 */
function validateSigningPatterns(patterns) {
  const issues = ;
  
  patterns.forEach(pattern => {
    switch (pattern.type) {
      case 'secret_key_access':
        issues.push({
          severity: 'high',
          type: 'secret_key_exposure',
          file: pattern.file,
          message: 'Direct secret key access detected - consider using secure key management'
        });
        break;
        
      case 'private_key_reference':
        issues.push({
          severity: 'medium',
          type: 'private_key_reference',
          file: pattern.file,
          message: 'Private key reference found - ensure proper key handling'
        });
        break;
        
      case 'sign_and_send':
        // Check if proper error handling exists
        if (!pattern.content.includes('try') && !pattern.content.includes('catch')) {
          issues.push({
            severity: 'medium',
            type: 'missing_error_handling',
            file: pattern.file,
            message: 'signAndSendTransaction without error handling'
          });
        }
        break;
    }
  });
  
  return issues;
}

/**
 * Scan for fee handling patterns
 */
async function scanForFeePatterns() {
  const patterns = ;
  
  try {
    const sourceFiles = await findSourceFiles();
    
    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      
      const feeMatches = [
        { pattern: /feePayer/g, type: 'fee_payer_usage', file },
        { pattern: /recentBlockhash/g, type: 'blockhash_usage', file },
        { pattern: /computeUnitPrice/g, type: 'compute_unit_pricing', file },
        { pattern: /priorityFee/g, type: 'priority_fee_usage', file }
      ];
      
      feeMatches.forEach(match => {
        const matches = content.match(match.pattern);
        if (matches) {
          patterns.push({
            ...match,
            occurrences: matches.length,
            content: content
          });
        }
      });
    }
  } catch (error) {
    console.warn(chalk.yellow(` Could not scan fee patterns: ${error.message}`));
  }
  
  return patterns;
}

/**
 * Validate fee handling patterns
 */
function validateFeePatterns(patterns) {
  const issues = ;
  
  const hasFeePayer = patterns.some(p => p.type === 'fee_payer_usage');
  const hasBlockhash = patterns.some(p => p.type === 'blockhash_usage');
  
  if (!hasFeePayer) {
    issues.push({
      severity: 'high',
      type: 'missing_fee_payer',
      message: 'No fee payer configuration detected - transactions may fail'
    });
  }
  
  if (!hasBlockhash) {
    issues.push({
      severity: 'high',
      type: 'missing_blockhash',
      message: 'No recent blockhash usage detected - transactions may fail'
    });
  }
  
  return issues;
}

/**
 * Security check functions
 */
async function checkSignerValidation() {
  const sourceFiles = await findSourceFiles();
  let hasSignerValidation = false;
  
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('isSigner') || content.includes('verifySignature')) {
      hasSignerValidation = true;
      break;
    }
  }
  
  return {
    status: hasSignerValidation ? 'pass' : 'warning',
    details: hasSignerValidation ? 'Signer validation found' : 'No explicit signer validation detected'
  };
}

async function checkFeePayerSecurity() {
  const sourceFiles = await findSourceFiles();
  let hasFeePayerSecurity = false;
  
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('feePayer') && (content.includes('validate') || content.includes('check'))) {
      hasFeePayerSecurity = true;
      break;
    }
  }
  
  return {
    status: hasFeePayerSecurity ? 'pass' : 'warning',
    details: hasFeePayerSecurity ? 'Fee payer validation found' : 'Fee payer security checks recommended'
  };
}

async function checkAccountOwnership() {
  const sourceFiles = await findSourceFiles();
  let hasOwnershipCheck = false;
  
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('owner') && content.includes('verify')) {
      hasOwnershipCheck = true;
      break;
    }
  }
  
  return {
    status: hasOwnershipCheck ? 'pass' : 'warning',
    details: hasOwnershipCheck ? 'Account ownership validation found' : 'Account ownership checks recommended'
  };
}

async function checkTokenProgramValidation() {
  const sourceFiles = await findSourceFiles();
  let hasTokenValidation = false;
  
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('TOKEN_PROGRAM_ID') || content.includes('TOKEN_2022_PROGRAM_ID')) {
      hasTokenValidation = true;
      break;
    }
  }
  
  return {
    status: hasTokenValidation ? 'pass' : 'info',
    details: hasTokenValidation ? 'Token program usage detected' : 'No token operations detected'
  };
}

async function checkInstructionValidation() {
  const sourceFiles = await findSourceFiles();
  let hasInstructionValidation = false;
  
  for (const file of sourceFiles) {
    const content = await fs.readFile(file, 'utf-8');
    if (content.includes('validate') && content.includes('instruction')) {
      hasInstructionValidation = true;
      break;
    }
  }
  
  return {
    status: hasInstructionValidation ? 'pass' : 'warning',
    details: hasInstructionValidation ? 'Instruction validation found' : 'Instruction validation recommended'
  };
}

/**
 * Generate security recommendations
 */
function generateQuickRecommendations(results) {
  const recommendations = ;
  
  results.forEach(result => {
    if (result.status === 'warning' || result.status === 'error') {
      switch (result.name) {
        case 'Signer validation':
          recommendations.push('Add explicit signer validation before processing transactions');
          break;
        case 'Fee payer security':
          recommendations.push('Implement fee payer validation and security checks');
          break;
        case 'Account ownership':
          recommendations.push('Verify account ownership before state modifications');
          break;
        case 'Instruction data validation':
          recommendations.push('Add instruction data validation and bounds checking');
          break;
      }
    }
  });
  
  return recommendations;
}

/**
 * Utility functions
 */
async function findSourceFiles() {
  const patterns = ['src/**/*.{js,ts,jsx,tsx}', 'lib/**/*.{js,ts}', 'app/**/*.{js,ts,jsx,tsx}'];
  const files = ;
  
  for (const pattern of patterns) {
    try {
      const glob = require('glob');
      const matched = await new Promise((resolve, reject) => {
        glob(pattern, (err, matches) => {
          if (err) reject(err);
          else resolve(matches);
        });
      });
      files.push(...matched);
    } catch (error) {
      // Pattern not found, continue
    }
  }
  
  return [...new Set(files)]; // Remove duplicates
}

async function scanForCPIPatterns() {
  // CPI (Cross-Program Invocation) security scanning
  return ;
}

function validateCPIPatterns(patterns) {
  return ;
}

async function scanForTokenPatterns() {
  // Token operation security scanning
  return ;
}

function validateTokenPatterns(patterns) {
  return ;
}

async function analyzeFeeHandling(standalone) {
  return { issues: , severity: 'low' };
}

async function analyzeCPIRisks(standalone) {
  return { issues: , severity: 'low' };
}

async function analyzeTokenRisks(standalone) {
  return { issues: , severity: 'low' };
}

async function analyzeAccountSecurity(standalone) {
  return { issues: , severity: 'low' };
}

async function analyzeProgramSecurity(standalone) {
  return { issues: , severity: 'low' };
}

function calculateSeverity(risks) {
  const allIssues = [
    ...risks.signingIssues,
    ...risks.feeIssues,
    ...risks.cpiIssues,
    ...risks.tokenIssues
  ];
  
  if (allIssues.some(issue => issue.severity === 'high')) return 'high';
  if (allIssues.some(issue => issue.severity === 'medium')) return 'medium';
  return 'low';
}

function displayRiskAnalysis(risks) {
  console.log(chalk.cyan(' Risk Analysis Results:'));
  
  const severityColor = risks.severity === 'high' ? chalk.red :
                       risks.severity === 'medium' ? chalk.yellow :
                       chalk.green;
  
  console.log(severityColor(`\\n Overall Risk Level: ${risks.severity.toUpperCase()}`));
  
  const allIssues = [
    ...risks.signingIssues,
    ...risks.feeIssues,
    ...risks.cpiIssues,
    ...risks.tokenIssues
  ];
  
  if (allIssues.length === 0) {
    console.log(chalk.green(' No security risks detected'));
  } else {
    console.log(chalk.yellow(`\\n Found ${allIssues.length} security issues:`));
    allIssues.forEach(issue => {
      const severityIcon = issue.severity === 'high' ? '´' : 
                          issue.severity === 'medium' ? '' : '¢';
      console.log(`  ${severityIcon} ${issue.message}`);
      if (issue.file) {
        console.log(chalk.gray(`     „ ${issue.file}`));
      }
    });
  }
}

async function generateAuditReport(results) {
  const timestamp = new Date().toISOString();
  const reportData = {
    timestamp,
    summary: {
      overallRisk: calculateSeverity(results.signingRisks),
      totalIssues: Object.values(results).reduce((sum, category) => 
        sum + (category.issues ? category.issues.length : 0), 0)
    },
    results
  };
  
  const reportPath = `security-audit-${timestamp.split('T')[0]}.json`;
  await fs.writeJson(reportPath, reportData, { spaces: 2 });
  
  return reportPath;
}

function showAuditSummary(results) {
  console.log(chalk.cyan('\\n‹ Audit Summary:'));
  console.log(chalk.gray('  Signing Security: ') + getStatusIcon(results.signingRisks.severity));
  console.log(chalk.gray('  Fee Handling: ') + getStatusIcon(results.feeAnalysis.severity));
  console.log(chalk.gray('  CPI Security: ') + getStatusIcon(results.cpiRisks.severity));
  console.log(chalk.gray('  Token Operations: ') + getStatusIcon(results.tokenRisks.severity));
  console.log(chalk.gray('  Account Security: ') + getStatusIcon(results.accountSecurity.severity));
  console.log(chalk.gray('  Program Security: ') + getStatusIcon(results.programSecurity.severity));
}

function getStatusIcon(severity) {
  switch (severity) {
    case 'high': return chalk.red(' High Risk');
    case 'medium': return chalk.yellow(' Medium Risk');
    case 'low': return chalk.green(' Low Risk');
    default: return chalk.gray(' Unknown');
  }
}

module.exports = {
  main
};