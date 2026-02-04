import { PublicKey, Connection } from '@solana/web3.js';
import { Program, Workspace } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import * as toml from 'toml';

export interface AnchorConfig {
  programs: {
    [network: string]: {
      [programName: string]: string;
    };
  };
  provider: {
    cluster: string;
    wallet: string;
  };
  test?: {
    startup_wait?: number;
    shutdown_wait?: number;
    upgradeable?: boolean;
  };
  scripts?: {
    [scriptName: string]: string;
  };
}

export class AnchorUtils {
  private static anchorConfigCache?: AnchorConfig;
  
  /**
   * Read and parse Anchor.toml configuration
   */
  public static getAnchorConfig(): AnchorConfig {
    if (this.anchorConfigCache) {
      return this.anchorConfigCache;
    }

    const anchorTomlPath = path.join(process.cwd(), 'Anchor.toml');
    
    if (!fs.existsSync(anchorTomlPath)) {
      throw new Error('Anchor.toml not found. Are you in an Anchor workspace?');
    }

    try {
      const content = fs.readFileSync(anchorTomlPath, 'utf8');
      this.anchorConfigCache = toml.parse(content) as AnchorConfig;
      return this.anchorConfigCache;
    } catch (error) {
      throw new Error(`Failed to parse Anchor.toml: ${error}`);
    }
  }

  /**
   * Get program IDs from Anchor.toml
   */
  public static getProgramIds(network: string = 'localnet'): Record<string, PublicKey> {
    const config = this.getAnchorConfig();
    const programs = config.programs[network];
    
    if (!programs) {
      throw new Error(`No programs configured for network: ${network}`);
    }

    const programIds: Record<string, PublicKey> = {};
    
    for (const [name, id] of Object.entries(programs)) {
      programIds[name] = new PublicKey(id);
    }

    return programIds;
  }

  /**
   * Get the cluster URL from Anchor.toml or environment
   */
  public static getClusterUrl(): string {
    const config = this.getAnchorConfig();
    const cluster = config.provider.cluster;

    // Handle predefined clusters
    switch (cluster) {
      case 'localnet':
        return 'http://localhost:8899';
      case 'devnet':
        return 'https://api.devnet.solana.com';
      case 'testnet':
        return 'https://api.testnet.solana.com';
      case 'mainnet-beta':
        return 'https://api.mainnet-beta.solana.com';
      default:
        // Assume it's a custom URL
        return cluster;
    }
  }

  /**
   * Create a connection using Anchor configuration
   */
  public static createConnection(): Connection {
    const url = this.getClusterUrl();
    return new Connection(url, 'confirmed');
  }

  /**
   * Get wallet path from Anchor.toml
   */
  public static getWalletPath(): string {
    const config = this.getAnchorConfig();
    let walletPath = config.provider.wallet;
    
    // Expand tilde to home directory
    if (walletPath.startsWith('~')) {
      const os = require('os');
      walletPath = path.join(os.homedir(), walletPath.slice(1));
    }
    
    return walletPath;
  }

  /**
   * Check if current directory is an Anchor workspace
   */
  public static isAnchorWorkspace(): boolean {
    const anchorToml = path.join(process.cwd(), 'Anchor.toml');
    const programsDir = path.join(process.cwd(), 'programs');
    
    return fs.existsSync(anchorToml) && fs.existsSync(programsDir);
  }

  /**
   * Get all program names from the workspace
   */
  public static getProgramNames(): string[] {
    const programsDir = path.join(process.cwd(), 'programs');
    
    if (!fs.existsSync(programsDir)) {
      return [];
    }

    return fs.readdirSync(programsDir)
      .filter(name => {
        const programPath = path.join(programsDir, name);
        return fs.statSync(programPath).isDirectory();
      });
  }

  /**
   * Get IDL file path for a program
   */
  public static getIdlPath(programName: string): string {
    return path.join(process.cwd(), 'target', 'idl', `${programName}.json`);
  }

  /**
   * Check if program IDL exists
   */
  public static hasIdl(programName: string): boolean {
    const idlPath = this.getIdlPath(programName);
    return fs.existsSync(idlPath);
  }

  /**
   * Load program IDL
   */
  public static loadIdl(programName: string): any {
    const idlPath = this.getIdlPath(programName);
    
    if (!fs.existsSync(idlPath)) {
      throw new Error(`IDL not found for program: ${programName}. Run 'anchor build' first.`);
    }

    try {
      const content = fs.readFileSync(idlPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to parse IDL for ${programName}: ${error}`);
    }
  }

  /**
   * Get test files directory
   */
  public static getTestsDir(): string {
    return path.join(process.cwd(), 'tests');
  }

  /**
   * Get all test files
   */
  public static getTestFiles(): string[] {
    const testsDir = this.getTestsDir();
    
    if (!fs.existsSync(testsDir)) {
      return [];
    }

    const findTestFiles = (dir: string): string[] => {
      const files: string[] = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files.push(...findTestFiles(fullPath));
        } else if (item.endsWith('.ts') || item.endsWith('.js')) {
          files.push(fullPath);
        }
      }
      
      return files;
    };

    return findTestFiles(testsDir);
  }

  /**
   * Validate Anchor workspace structure
   */
  public static validateWorkspace(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    // Check for Anchor.toml
    if (!fs.existsSync(path.join(process.cwd(), 'Anchor.toml'))) {
      issues.push('Anchor.toml not found');
    }
    
    // Check for programs directory
    const programsDir = path.join(process.cwd(), 'programs');
    if (!fs.existsSync(programsDir)) {
      issues.push('programs/ directory not found');
    } else if (fs.readdirSync(programsDir).length === 0) {
      issues.push('No programs found in programs/ directory');
    }
    
    // Check for tests directory
    const testsDir = path.join(process.cwd(), 'tests');
    if (!fs.existsSync(testsDir)) {
      issues.push('tests/ directory not found');
    }
    
    // Check for package.json (for dependencies)
    if (!fs.existsSync(path.join(process.cwd(), 'package.json'))) {
      issues.push('package.json not found (needed for test dependencies)');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Get build artifacts directory
   */
  public static getTargetDir(): string {
    return path.join(process.cwd(), 'target');
  }

  /**
   * Check if programs are built
   */
  public static areProgramsBuilt(): boolean {
    const targetDir = this.getTargetDir();
    const deployDir = path.join(targetDir, 'deploy');
    
    if (!fs.existsSync(deployDir)) {
      return false;
    }

    const programNames = this.getProgramNames();
    return programNames.every(name => {
      const soFile = path.join(deployDir, `${name}.so`);
      return fs.existsSync(soFile);
    });
  }

  /**
   * Get network from environment or default
   */
  public static getCurrentNetwork(): string {
    return process.env.ANCHOR_PROVIDER_URL?.includes('devnet') ? 'devnet' :
           process.env.ANCHOR_PROVIDER_URL?.includes('testnet') ? 'testnet' :
           process.env.ANCHOR_PROVIDER_URL?.includes('mainnet') ? 'mainnet-beta' :
           'localnet';
  }

  /**
   * Clear Anchor config cache
   */
  public static clearConfigCache(): void {
    this.anchorConfigCache = undefined;
  }
}