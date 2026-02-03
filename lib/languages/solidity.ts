import { LanguageConfig } from './index';

export const SOLIDITY_CONFIG: LanguageConfig = {
  id: 'solidity',
  name: 'solidity',
  displayName: 'Solidity',
  fileExtensions: ['sol'],
  priority: 'high',
  category: 'cross-chain',
  description: 'Solidity for bridge contracts and multi-chain development',
  
  syntax: {
    keywords: [
      'contract', 'library', 'interface', 'function', 'modifier', 'event', 'struct', 'enum',
      'mapping', 'array', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'return',
      'throw', 'try', 'catch', 'pragma', 'import', 'using', 'assembly', 'override', 'virtual'
    ],
    types: [
      'bool', 'uint', 'int', 'address', 'bytes', 'string', 'fixed', 'ufixed',
      'uint8', 'uint16', 'uint32', 'uint64', 'uint128', 'uint256',
      'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
      'bytes1', 'bytes4', 'bytes8', 'bytes16', 'bytes32'
    ],
    operators: [
      '+', '-', '*', '/', '%', '**', '++', '--', '=', '+=', '-=', '*=', '/=', '%=',
      '==', '!=', '<', '>', '<=', '>=', '&&', '||', '!', '&', '|', '^', '~', '<<', '>>'
    ],
    builtins: [
      'msg', 'block', 'tx', 'now', 'require', 'assert', 'revert', 'keccak256', 'sha256',
      'ripemd160', 'ecrecover', 'addmod', 'mulmod', 'this', 'super', 'selfdestruct'
    ]
  },

  snippets: [
    {
      label: 'Basic Contract',
      description: 'Basic Solidity contract structure',
      prefix: 'contract',
      category: 'program',
      body: [
        '// SPDX-License-Identifier: MIT',
        'pragma solidity ^0.8.0;',
        '',
        'contract ${1:ContractName} {',
        '    ${2:// State variables}',
        '',
        '    constructor() {',
        '        ${3:// Constructor logic}',
        '    }',
        '',
        '    ${4:// Functions}',
        '}'
      ]
    },
    {
      label: 'Bridge Contract',
      description: 'Cross-chain bridge contract template',
      prefix: 'bridge',
      category: 'program',
      body: [
        '// SPDX-License-Identifier: MIT',
        'pragma solidity ^0.8.0;',
        '',
        'import "@openzeppelin/contracts/security/ReentrancyGuard.sol";',
        'import "@openzeppelin/contracts/access/Ownable.sol";',
        '',
        'contract ${1:BridgeContract} is ReentrancyGuard, Ownable {',
        '    mapping(bytes32 => bool) public processedTransactions;',
        '',
        '    event Deposit(address indexed user, uint256 amount, string solanaAddress);',
        '    event Withdraw(address indexed user, uint256 amount, bytes32 txHash);',
        '',
        '    function deposit(string memory solanaAddress) external payable {',
        '        require(msg.value > 0, "Amount must be greater than 0");',
        '        emit Deposit(msg.sender, msg.value, solanaAddress);',
        '    }',
        '',
        '    function withdraw(uint256 amount, bytes32 txHash) external nonReentrant {',
        '        require(!processedTransactions[txHash], "Transaction already processed");',
        '        processedTransactions[txHash] = true;',
        '        payable(msg.sender).transfer(amount);',
        '        emit Withdraw(msg.sender, amount, txHash);',
        '    }',
        '}'
      ]
    }
  ],

  tools: [
    {
      name: 'Solc',
      command: 'solc',
      description: 'Solidity compiler',
      category: 'compiler'
    },
    {
      name: 'Hardhat',
      command: 'npx hardhat compile',
      description: 'Hardhat compilation',
      category: 'compiler'
    },
    {
      name: 'Foundry',
      command: 'forge build',
      description: 'Foundry build',
      category: 'compiler'
    }
  ],

  testing: {
    framework: 'hardhat',
    testCommand: 'npx hardhat test',
    testPattern: '**/*.test.js',
    setupRequired: true
  }
};