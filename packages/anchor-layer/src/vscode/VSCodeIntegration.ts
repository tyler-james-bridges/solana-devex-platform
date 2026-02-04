import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { WebSocketServer } from 'ws';

export interface VSCodeConfig {
  enabled?: boolean;
  autoTestRun?: boolean;
  deploymentTracking?: boolean;
  websocketPort?: number;
  createTasks?: boolean;
  createLaunchConfig?: boolean;
}

export interface VSCodeTask {
  label: string;
  type: string;
  command: string;
  args?: string[];
  group?: string;
  presentation?: {
    echo?: boolean;
    reveal?: string;
    focus?: boolean;
    panel?: string;
    showReuseMessage?: boolean;
    clear?: boolean;
  };
  options?: {
    cwd?: string;
  };
  problemMatcher?: string[];
}

export interface VSCodeLaunchConfig {
  name: string;
  type: string;
  request: string;
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  preLaunchTask?: string;
  postDebugTask?: string;
}

export class VSCodeIntegration extends EventEmitter {
  private config: VSCodeConfig;
  private wsServer?: WebSocketServer;
  private projectRoot: string;
  private vscodeDir: string;

  constructor(config: VSCodeConfig = {}) {
    super();
    this.config = {
      enabled: true,
      autoTestRun: true,
      deploymentTracking: true,
      websocketPort: 8768,
      createTasks: true,
      createLaunchConfig: true,
      ...config
    };
    
    this.projectRoot = process.cwd();
    this.vscodeDir = path.join(this.projectRoot, '.vscode');
  }

  public async initialize(): Promise<void> {
    if (!this.config.enabled) return;

    console.log('🔧 Initializing VS Code integration...');

    // Create .vscode directory if it doesn't exist
    await this.ensureVSCodeDirectory();

    // Create enhanced tasks
    if (this.config.createTasks) {
      await this.createEnhancedTasks();
    }

    // Create launch configurations
    if (this.config.createLaunchConfig) {
      await this.createLaunchConfigurations();
    }

    // Create settings for enhanced experience
    await this.createVSCodeSettings();

    // Create recommended extensions file
    await this.createExtensionsRecommendations();

    // Start WebSocket server for real-time communication
    await this.startWebSocketServer();

    console.log('✅ VS Code integration initialized');
  }

  private async ensureVSCodeDirectory(): Promise<void> {
    if (!fs.existsSync(this.vscodeDir)) {
      fs.mkdirSync(this.vscodeDir, { recursive: true });
    }
  }

  private async createEnhancedTasks(): Promise<void> {
    const tasksFile = path.join(this.vscodeDir, 'tasks.json');
    
    const tasks: VSCodeTask[] = [
      {
        label: "Anchor: Enhanced Test",
        type: "shell",
        command: "npx anchor-enhance test",
        group: "test",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared",
          showReuseMessage: true,
          clear: true
        },
        problemMatcher: ["$tsc"]
      },
      {
        label: "Anchor: Enhanced Test (Watch)",
        type: "shell",
        command: "npx anchor-enhance test --watch",
        group: "test",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "dedicated",
          showReuseMessage: false
        },
        problemMatcher: ["$tsc"]
      },
      {
        label: "Anchor: Enhanced Deploy",
        type: "shell",
        command: "npx anchor-enhance deploy",
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: true,
          panel: "shared",
          clear: true
        },
        problemMatcher: []
      },
      {
        label: "Anchor: Enhanced Deploy (Devnet)",
        type: "shell",
        command: "npx anchor-enhance deploy --network devnet",
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: true,
          panel: "shared",
          clear: true
        },
        problemMatcher: []
      },
      {
        label: "Anchor: Build with Monitoring",
        type: "shell",
        command: "npx anchor-enhance build",
        group: "build",
        presentation: {
          echo: true,
          reveal: "silent",
          focus: false,
          panel: "shared"
        },
        problemMatcher: ["$rustc"]
      },
      {
        label: "Anchor: Start Performance Monitor",
        type: "shell",
        command: "npx anchor-enhance monitor",
        group: "test",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "dedicated"
        },
        problemMatcher: []
      },
      {
        label: "Anchor: Clean Build",
        type: "shell",
        command: "anchor clean && anchor build",
        group: "build",
        presentation: {
          echo: true,
          reveal: "always",
          focus: false,
          panel: "shared",
          clear: true
        },
        problemMatcher: ["$rustc"]
      }
    ];

    const tasksConfig = {
      version: "2.0.0",
      tasks
    };

    // Merge with existing tasks if file exists
    if (fs.existsSync(tasksFile)) {
      try {
        const existingTasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
        const mergedTasks = [...(existingTasks.tasks || [])];
        
        // Add our tasks, avoiding duplicates
        for (const task of tasks) {
          if (!mergedTasks.find(t => t.label === task.label)) {
            mergedTasks.push(task);
          }
        }
        
        tasksConfig.tasks = mergedTasks;
      } catch (error) {
        console.warn('Warning: Could not parse existing tasks.json, creating new file');
      }
    }

    fs.writeFileSync(tasksFile, JSON.stringify(tasksConfig, null, 2));
    console.log('📝 Enhanced tasks created in .vscode/tasks.json');
  }

  private async createLaunchConfigurations(): Promise<void> {
    const launchFile = path.join(this.vscodeDir, 'launch.json');
    
    const configurations: VSCodeLaunchConfig[] = [
      {
        name: "Debug Anchor Tests",
        type: "node",
        request: "launch",
        program: "${workspaceFolder}/tests/test.js",
        cwd: "${workspaceFolder}",
        env: {
          "NODE_ENV": "test",
          "ANCHOR_PROVIDER_URL": "http://localhost:8899"
        },
        preLaunchTask: "Anchor: Build with Monitoring"
      },
      {
        name: "Debug Enhanced Test Runner",
        type: "node",
        request: "launch",
        program: "${workspaceFolder}/node_modules/.bin/anchor-enhance",
        args: ["test", "--debug"],
        cwd: "${workspaceFolder}",
        env: {
          "DEBUG": "anchor-enhance:*"
        }
      }
    ];

    const launchConfig = {
      version: "0.2.0",
      configurations
    };

    // Merge with existing launch config if file exists
    if (fs.existsSync(launchFile)) {
      try {
        const existingLaunch = JSON.parse(fs.readFileSync(launchFile, 'utf8'));
        const mergedConfigs = [...(existingLaunch.configurations || [])];
        
        // Add our configurations, avoiding duplicates
        for (const config of configurations) {
          if (!mergedConfigs.find(c => c.name === config.name)) {
            mergedConfigs.push(config);
          }
        }
        
        launchConfig.configurations = mergedConfigs;
      } catch (error) {
        console.warn('Warning: Could not parse existing launch.json, creating new file');
      }
    }

    fs.writeFileSync(launchFile, JSON.stringify(launchConfig, null, 2));
    console.log('🐛 Debug configurations created in .vscode/launch.json');
  }

  private async createVSCodeSettings(): Promise<void> {
    const settingsFile = path.join(this.vscodeDir, 'settings.json');
    
    const enhancedSettings = {
      // Rust settings for Anchor programs
      "rust-analyzer.cargo.features": "all",
      "rust-analyzer.checkOnSave.command": "clippy",
      "rust-analyzer.checkOnSave.allTargets": false,
      
      // TypeScript settings for tests
      "typescript.preferences.importModuleSpecifier": "relative",
      "typescript.updateImportsOnFileMove.enabled": "always",
      
      // File associations
      "files.associations": {
        "Anchor.toml": "toml",
        "*.ts": "typescript"
      },
      
      // Terminal settings
      "terminal.integrated.defaultProfile.osx": "zsh",
      "terminal.integrated.defaultProfile.linux": "bash",
      
      // Enhanced Anchor settings
      "anchorEnhancement.realTimeUpdates": true,
      "anchorEnhancement.autoTestOnSave": this.config.autoTestRun,
      "anchorEnhancement.deploymentTracking": this.config.deploymentTracking,
      
      // Editor settings for better development experience
      "editor.formatOnSave": true,
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
      },
      
      // File watching
      "files.watcherExclude": {
        "**/target/**": true,
        "**/node_modules/**": true,
        "**/.anchor/**": true
      }
    };

    let finalSettings = enhancedSettings;
    
    // Merge with existing settings if file exists
    if (fs.existsSync(settingsFile)) {
      try {
        const existingSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        finalSettings = { ...existingSettings, ...enhancedSettings };
      } catch (error) {
        console.warn('Warning: Could not parse existing settings.json, creating new file');
      }
    }

    fs.writeFileSync(settingsFile, JSON.stringify(finalSettings, null, 2));
    console.log('⚙️ Enhanced settings created in .vscode/settings.json');
  }

  private async createExtensionsRecommendations(): Promise<void> {
    const extensionsFile = path.join(this.vscodeDir, 'extensions.json');
    
    const recommendations = [
      // Rust support
      "rust-lang.rust-analyzer",
      
      // TypeScript/JavaScript support
      "ms-vscode.vscode-typescript-next",
      
      // TOML support for Anchor.toml
      "be5invis.toml",
      
      // Git support
      "eamodio.gitlens",
      
      // Testing support
      "ms-vscode.test-adapter-converter",
      
      // JSON support
      "ms-vscode.json",
      
      // Terminal enhancements
      "ms-vscode.terminal",
      
      // Markdown support for documentation
      "yzhang.markdown-all-in-one",
      
      // Prettier for code formatting
      "esbenp.prettier-vscode",
      
      // ESLint for code quality
      "dbaeumer.vscode-eslint"
    ];

    const extensionsConfig = {
      recommendations
    };

    // Merge with existing recommendations if file exists
    if (fs.existsSync(extensionsFile)) {
      try {
        const existingExtensions = JSON.parse(fs.readFileSync(extensionsFile, 'utf8'));
        const mergedRecommendations = [...(existingExtensions.recommendations || [])];
        
        // Add our recommendations, avoiding duplicates
        for (const rec of recommendations) {
          if (!mergedRecommendations.includes(rec)) {
            mergedRecommendations.push(rec);
          }
        }
        
        extensionsConfig.recommendations = mergedRecommendations;
      } catch (error) {
        console.warn('Warning: Could not parse existing extensions.json, creating new file');
      }
    }

    fs.writeFileSync(extensionsFile, JSON.stringify(extensionsConfig, null, 2));
    console.log('🔌 Extension recommendations created in .vscode/extensions.json');
  }

  private async startWebSocketServer(): Promise<void> {
    if (this.wsServer) return;

    this.wsServer = new WebSocketServer({ port: this.config.websocketPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log('🔗 VS Code extension connected');
      
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'VS Code integration active',
        features: {
          autoTestRun: this.config.autoTestRun,
          deploymentTracking: this.config.deploymentTracking
        }
      }));

      ws.on('message', (message) => {
        try {
          const request = JSON.parse(message.toString());
          this.handleVSCodeRequest(ws, request);
        } catch (error) {
          console.error('Error handling VS Code message:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔗 VS Code extension disconnected');
      });
    });

    console.log(`🔗 VS Code integration WebSocket server started on port ${this.config.websocketPort}`);
  }

  private handleVSCodeRequest(ws: any, request: any): void {
    switch (request.type) {
      case 'test:run':
        this.emit('vscode:test:run', request.data);
        break;
        
      case 'deploy:run':
        this.emit('vscode:deploy:run', request.data);
        break;
        
      case 'monitor:start':
        this.emit('vscode:monitor:start');
        break;
        
      case 'monitor:stop':
        this.emit('vscode:monitor:stop');
        break;
        
      case 'get:status':
        ws.send(JSON.stringify({
          type: 'status',
          data: {
            projectRoot: this.projectRoot,
            config: this.config,
            active: true
          }
        }));
        break;
    }
  }

  public notifyVSCode(type: string, data: any): void {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type,
            data,
            timestamp: Date.now()
          }));
        }
      });
    }
  }

  public async createCodeSnippets(): Promise<void> {
    const snippetsDir = path.join(this.vscodeDir, 'snippets');
    if (!fs.existsSync(snippetsDir)) {
      fs.mkdirSync(snippetsDir);
    }

    // TypeScript snippets for Anchor tests
    const typescriptSnippets = {
      "Anchor Test Template": {
        prefix: "anchor-test",
        body: [
          "import * as anchor from '@coral-xyz/anchor';",
          "import { Program } from '@coral-xyz/anchor';",
          "import { ${1:ProgramName} } from '../target/types/${2:program_name}';",
          "",
          "describe('${3:test_description}', () => {",
          "  const provider = anchor.AnchorProvider.env();",
          "  anchor.setProvider(provider);",
          "",
          "  const program = anchor.workspace.${1:ProgramName} as Program<${1:ProgramName}>;",
          "",
          "  it('${4:test_case}', async () => {",
          "    $0",
          "  });",
          "});"
        ],
        description: "Create an Anchor test template"
      },
      "Enhanced Anchor Test": {
        prefix: "anchor-enhanced-test",
        body: [
          "import { AnchorEnhancementLayer } from 'anchor-enhancement-layer';",
          "import * as anchor from '@coral-xyz/anchor';",
          "",
          "describe('${1:test_description}', () => {",
          "  const enhancement = new AnchorEnhancementLayer();",
          "  const provider = anchor.AnchorProvider.env();",
          "  anchor.setProvider(provider);",
          "",
          "  before(async () => {",
          "    await enhancement.startRealTimeUpdates();",
          "  });",
          "",
          "  after(async () => {",
          "    await enhancement.stopRealTimeUpdates();",
          "  });",
          "",
          "  it('${2:test_case}', async () => {",
          "    const result = await enhancement.runTests('${3:test_pattern}');",
          "    $0",
          "  });",
          "});"
        ],
        description: "Create an enhanced Anchor test with monitoring"
      }
    };

    fs.writeFileSync(
      path.join(snippetsDir, 'typescript.json'),
      JSON.stringify(typescriptSnippets, null, 2)
    );

    // Rust snippets for Anchor programs
    const rustSnippets = {
      "Anchor Program Template": {
        prefix: "anchor-program",
        body: [
          "use anchor_lang::prelude::*;",
          "",
          "declare_id!(\"${1:PROGRAM_ID}\");",
          "",
          "#[program]",
          "pub mod ${2:program_name} {",
          "    use super::*;",
          "",
          "    pub fn ${3:instruction_name}(ctx: Context<${4:InstructionContext}>) -> Result<()> {",
          "        $0",
          "        Ok(())",
          "    }",
          "}",
          "",
          "#[derive(Accounts)]",
          "pub struct ${4:InstructionContext} {",
          "    // Add accounts here",
          "}"
        ],
        description: "Create an Anchor program template"
      }
    };

    fs.writeFileSync(
      path.join(snippetsDir, 'rust.json'),
      JSON.stringify(rustSnippets, null, 2)
    );

    console.log('📝 Code snippets created in .vscode/snippets/');
  }

  public async cleanup(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = undefined;
    }
    console.log('🧹 VS Code integration cleaned up');
  }
}