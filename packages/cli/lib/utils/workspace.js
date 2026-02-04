const fs = require('fs-extra');
const path = require('path');
const toml = require('toml');

/**
 * Find Anchor workspace root directory
 */
async function findAnchorWorkspace(startDir = process.cwd()) {
  let currentDir = startDir;
  
  while (currentDir !== path.dirname(currentDir)) {
    const anchorTomlPath = path.join(currentDir, 'Anchor.toml');
    
    if (await fs.pathExists(anchorTomlPath)) {
      return currentDir;
    }
    
    currentDir = path.dirname(currentDir);
  }
  
  return null;
}

/**
 * Load and parse Anchor.toml configuration
 */
async function loadAnchorConfig(workspacePath) {
  const anchorTomlPath = path.join(workspacePath, 'Anchor.toml');
  
  if (!(await fs.pathExists(anchorTomlPath))) {
    throw new Error('Anchor.toml not found');
  }
  
  try {
    const content = await fs.readFile(anchorTomlPath, 'utf8');
    return toml.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse Anchor.toml: ${error.message}`);
  }
}

/**
 * Get list of programs in the workspace
 */
async function getWorkspacePrograms(workspacePath) {
  const anchorConfig = await loadAnchorConfig(workspacePath);
  const programs = [];
  
  // Extract programs from different clusters
  for (const [clusterName, clusterPrograms] of Object.entries(anchorConfig.programs || {})) {
    for (const [programName, programId] of Object.entries(clusterPrograms)) {
      programs.push({
        name: programName,
        id: programId,
        cluster: clusterName,
        path: path.join(workspacePath, 'programs', programName)
      });
    }
  }
  
  return programs;
}

/**
 * Validate program exists and has required files
 */
async function validateProgram(programPath) {
  const errors = [];
  
  // Check if program directory exists
  if (!(await fs.pathExists(programPath))) {
    errors.push(`Program directory not found: ${programPath}`);
    return errors;
  }
  
  // Check for src/lib.rs
  const libRsPath = path.join(programPath, 'src', 'lib.rs');
  if (!(await fs.pathExists(libRsPath))) {
    errors.push(`lib.rs not found: ${libRsPath}`);
  }
  
  // Check for Cargo.toml
  const cargoTomlPath = path.join(programPath, 'Cargo.toml');
  if (!(await fs.pathExists(cargoTomlPath))) {
    errors.push(`Cargo.toml not found: ${cargoTomlPath}`);
  }
  
  return errors;
}

/**
 * Validate all programs in workspace
 */
async function validatePrograms(workspacePath) {
  const programs = await getWorkspacePrograms(workspacePath);
  const validationResults = [];
  
  for (const program of programs) {
    const errors = await validateProgram(program.path);
    validationResults.push({
      program: program.name,
      path: program.path,
      valid: errors.length === 0,
      errors
    });
  }
  
  return validationResults;
}

/**
 * Get program binary path
 */
function getProgramBinaryPath(workspacePath, programName) {
  return path.join(workspacePath, 'target', 'deploy', `${programName}.so`);
}

/**
 * Get program IDL path
 */
function getProgramIdlPath(workspacePath, programName) {
  return path.join(workspacePath, 'target', 'idl', `${programName}.json`);
}

/**
 * Check if program is built
 */
async function isProgramBuilt(workspacePath, programName) {
  const binaryPath = getProgramBinaryPath(workspacePath, programName);
  const idlPath = getProgramIdlPath(workspacePath, programName);
  
  const binaryExists = await fs.pathExists(binaryPath);
  const idlExists = await fs.pathExists(idlPath);
  
  return {
    built: binaryExists && idlExists,
    binary: binaryExists,
    idl: idlExists,
    binaryPath,
    idlPath
  };
}

/**
 * Get built program info
 */
async function getBuiltProgramInfo(workspacePath, programName) {
  const buildInfo = await isProgramBuilt(workspacePath, programName);
  
  if (!buildInfo.built) {
    return null;
  }
  
  const info = {
    name: programName,
    binaryPath: buildInfo.binaryPath,
    idlPath: buildInfo.idlPath
  };
  
  // Get binary size
  try {
    const stats = await fs.stat(buildInfo.binaryPath);
    info.size = stats.size;
    info.lastModified = stats.mtime;
  } catch {
    info.size = null;
    info.lastModified = null;
  }
  
  // Load IDL
  try {
    info.idl = await fs.readJSON(buildInfo.idlPath);
  } catch {
    info.idl = null;
  }
  
  return info;
}

/**
 * Get all built programs in workspace
 */
async function getAllBuiltPrograms(workspacePath) {
  const programs = await getWorkspacePrograms(workspacePath);
  const builtPrograms = [];
  
  for (const program of programs) {
    const programInfo = await getBuiltProgramInfo(workspacePath, program.name);
    if (programInfo) {
      builtPrograms.push({
        ...programInfo,
        cluster: program.cluster,
        programId: program.id
      });
    }
  }
  
  return builtPrograms;
}

/**
 * Validate workspace structure
 */
async function validateWorkspaceStructure(workspacePath) {
  const errors = [];
  const warnings = [];
  
  // Check for Anchor.toml
  const anchorTomlPath = path.join(workspacePath, 'Anchor.toml');
  if (!(await fs.pathExists(anchorTomlPath))) {
    errors.push('Anchor.toml not found');
  }
  
  // Check for Cargo.toml
  const cargoTomlPath = path.join(workspacePath, 'Cargo.toml');
  if (!(await fs.pathExists(cargoTomlPath))) {
    errors.push('Cargo.toml not found');
  }
  
  // Check for programs directory
  const programsDir = path.join(workspacePath, 'programs');
  if (!(await fs.pathExists(programsDir))) {
    errors.push('programs/ directory not found');
  } else {
    // Check if programs directory is empty
    const programDirs = await fs.readdir(programsDir);
    if (programDirs.length === 0) {
      warnings.push('No programs found in programs/ directory');
    }
  }
  
  // Check for tests directory
  const testsDir = path.join(workspacePath, 'tests');
  if (!(await fs.pathExists(testsDir))) {
    warnings.push('tests/ directory not found');
  }
  
  // Check for package.json (for TypeScript tests)
  const packageJsonPath = path.join(workspacePath, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    warnings.push('package.json not found - TypeScript tests may not work');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Initialize workspace structure
 */
async function initializeWorkspaceStructure(workspacePath, projectName) {
  // Create directories
  await fs.ensureDir(path.join(workspacePath, 'programs'));
  await fs.ensureDir(path.join(workspacePath, 'tests'));
  await fs.ensureDir(path.join(workspacePath, 'migrations'));
  await fs.ensureDir(path.join(workspacePath, 'target'));
  
  // Create Anchor.toml if it doesn't exist
  const anchorTomlPath = path.join(workspacePath, 'Anchor.toml');
  if (!(await fs.pathExists(anchorTomlPath))) {
    const anchorToml = createDefaultAnchorToml(projectName);
    await fs.writeFile(anchorTomlPath, anchorToml);
  }
  
  // Create Cargo.toml if it doesn't exist
  const cargoTomlPath = path.join(workspacePath, 'Cargo.toml');
  if (!(await fs.pathExists(cargoTomlPath))) {
    const cargoToml = createDefaultCargoToml();
    await fs.writeFile(cargoTomlPath, cargoToml);
  }
}

/**
 * Create default Anchor.toml content
 */
function createDefaultAnchorToml(projectName) {
  const programName = projectName.replace(/-/g, '_');
  
  return `[features]
seeds = false
skip-lint = false

[programs.localnet]
${programName} = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "Localnet"
wallet = "~/.config/solana/id.json"

[scripts]
test = "yarn run ts-mocha -p ./tsconfig.json -t 1000000 tests/**/*.ts"

[test]
startup_wait = 5000
shutdown_wait = 2000
`;
}

/**
 * Create default Cargo.toml content
 */
function createDefaultCargoToml() {
  return `[workspace]
members = [
    "programs/*"
]

[profile.release]
overflow-checks = true
lto = "fat"
codegen-units = 1

[profile.release.build-override]
opt-level = 3
incremental = false
codegen-units = 1
`;
}

/**
 * Get workspace metadata
 */
async function getWorkspaceMetadata(workspacePath) {
  const metadata = {
    path: workspacePath,
    valid: false,
    programs: [],
    builtPrograms: [],
    config: null,
    lastBuild: null
  };
  
  try {
    // Load Anchor config
    metadata.config = await loadAnchorConfig(workspacePath);
    
    // Get programs
    metadata.programs = await getWorkspacePrograms(workspacePath);
    
    // Get built programs
    metadata.builtPrograms = await getAllBuiltPrograms(workspacePath);
    
    // Get last build time
    const targetDir = path.join(workspacePath, 'target');
    if (await fs.pathExists(targetDir)) {
      const stats = await fs.stat(targetDir);
      metadata.lastBuild = stats.mtime;
    }
    
    // Validate structure
    const validation = await validateWorkspaceStructure(workspacePath);
    metadata.valid = validation.valid;
    metadata.errors = validation.errors;
    metadata.warnings = validation.warnings;
    
  } catch (error) {
    metadata.error = error.message;
  }
  
  return metadata;
}

/**
 * Watch workspace for changes
 */
function createWorkspaceWatcher(workspacePath, callback) {
  const chokidar = require('chokidar');
  
  const watchPaths = [
    path.join(workspacePath, 'programs/**/*.rs'),
    path.join(workspacePath, 'tests/**/*.ts'),
    path.join(workspacePath, 'tests/**/*.js'),
    path.join(workspacePath, 'Anchor.toml'),
    path.join(workspacePath, 'Cargo.toml')
  ];
  
  const watcher = chokidar.watch(watchPaths, {
    ignored: [
      /node_modules/,
      /target/,
      /\.git/
    ],
    persistent: true,
    ignoreInitial: true
  });
  
  watcher.on('change', (filePath) => {
    callback({
      type: 'change',
      file: filePath,
      relative: path.relative(workspacePath, filePath)
    });
  });
  
  watcher.on('add', (filePath) => {
    callback({
      type: 'add',
      file: filePath,
      relative: path.relative(workspacePath, filePath)
    });
  });
  
  watcher.on('unlink', (filePath) => {
    callback({
      type: 'remove',
      file: filePath,
      relative: path.relative(workspacePath, filePath)
    });
  });
  
  return watcher;
}

module.exports = {
  findAnchorWorkspace,
  loadAnchorConfig,
  getWorkspacePrograms,
  validateProgram,
  validatePrograms,
  getProgramBinaryPath,
  getProgramIdlPath,
  isProgramBuilt,
  getBuiltProgramInfo,
  getAllBuiltPrograms,
  validateWorkspaceStructure,
  initializeWorkspaceStructure,
  getWorkspaceMetadata,
  createWorkspaceWatcher,
  createDefaultAnchorToml,
  createDefaultCargoToml
};