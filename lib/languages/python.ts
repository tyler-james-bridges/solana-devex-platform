import { LanguageConfig } from './index';

export const PYTHON_CONFIG: LanguageConfig = {
  id: 'python',
  name: 'python',
  displayName: 'Python (Solana)',
  fileExtensions: ['py', 'pyi'],
  priority: 'high',
  category: 'agent-dev',
  description: 'Python for Solana client development, data analysis, and backtesting',
  
  syntax: {
    keywords: [
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class',
      'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from',
      'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal', 'not', 'or', 'pass',
      'raise', 'return', 'try', 'while', 'with', 'yield'
    ],
    types: [
      'int', 'float', 'str', 'bool', 'list', 'dict', 'tuple', 'set', 'frozenset',
      'bytes', 'bytearray', 'memoryview', 'complex', 'type', 'object', 'Callable',
      'Optional', 'Union', 'Any', 'TypeVar', 'Generic', 'Protocol'
    ],
    operators: [
      '+', '-', '*', '/', '//', '%', '**', '=', '+=', '-=', '*=', '/=', '//=', '%=', '**=',
      '==', '!=', '<', '>', '<=', '>=', 'and', 'or', 'not', '&', '|', '^', '~', '<<', '>>'
    ],
    builtins: [
      'abs', 'all', 'any', 'bin', 'bool', 'bytearray', 'bytes', 'chr', 'classmethod',
      'compile', 'complex', 'delattr', 'dict', 'dir', 'divmod', 'enumerate', 'eval',
      'exec', 'filter', 'float', 'format', 'frozenset', 'getattr', 'globals', 'hasattr',
      'hash', 'hex', 'id', 'input', 'int', 'isinstance', 'issubclass', 'iter', 'len',
      'list', 'locals', 'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord',
      'pow', 'print', 'property', 'range', 'repr', 'reversed', 'round', 'set', 'setattr',
      'slice', 'sorted', 'staticmethod', 'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip'
    ]
  },

  snippets: [
    {
      label: 'Solana-py Client Setup',
      description: 'Setup solana-py client connection',
      prefix: 'solana-client',
      category: 'client',
      body: [
        'from solana.rpc.api import Client',
        'from solana.rpc.commitment import Commitment',
        '',
        'client = Client("${1:https://api.devnet.solana.com}")',
        'commitment = Commitment("${2|confirmed,finalized,processed|}")'
      ]
    },
    {
      label: 'Anchorpy Program Client',
      description: 'Setup anchorpy program client',
      prefix: 'anchorpy-client',
      category: 'client',
      body: [
        'from anchorpy import Program, Provider, Wallet',
        'from solana.keypair import Keypair',
        'from solana.rpc.api import Client',
        'import json',
        '',
        'with open("${1:target/idl/program.json}") as f:',
        '    idl = json.load(f)',
        '',
        'client = Client("${2:http://127.0.0.1:8899}")',
        'keypair = Keypair.from_secret_key(bytes(${3:[/* private key */]}))',
        'wallet = Wallet(keypair)',
        'provider = Provider(client, wallet)',
        '',
        'program_id = "${4:PROGRAM_ID}"',
        'program = Program(idl, program_id, provider)'
      ]
    },
    {
      label: 'Transaction Builder',
      description: 'Build and send transaction',
      prefix: 'transaction',
      category: 'utility',
      body: [
        'from solana.transaction import Transaction',
        'from solana.system_program import SysVar',
        '',
        'tx = await program.rpc["${1:method_name}"](',
        '    ${2:args},',
        '    ctx=Context(',
        '        accounts={',
        '            "${3:account_name}": ${4:account_pubkey},',
        '            "user": wallet.public_key,',
        '            "system_program": SysVar.rent(),',
        '        },',
        '        signers=[${5:additional_signers}]',
        '    )',
        ')',
        '',
        'print(f"Transaction signature: {tx}")'
      ]
    },
    {
      label: 'Backtesting Framework',
      description: 'Basic backtesting setup for DeFi strategies',
      prefix: 'backtest',
      category: 'utility',
      body: [
        'import pandas as pd',
        'import numpy as np',
        'from datetime import datetime, timedelta',
        '',
        'class ${1:StrategyBacktest}:',
        '    def __init__(self, initial_balance: float = 10000):',
        '        self.initial_balance = initial_balance',
        '        self.balance = initial_balance',
        '        self.positions = []',
        '        self.trades = []',
        '',
        '    def execute_strategy(self, price_data: pd.DataFrame):',
        '        """Execute trading strategy on historical data"""',
        '        for index, row in price_data.iterrows():',
        '            ${2:# Strategy logic}',
        '            pass',
        '',
        '    def calculate_metrics(self):',
        '        """Calculate performance metrics"""',
        '        total_return = (self.balance - self.initial_balance) / self.initial_balance',
        '        return {',
        '            "total_return": total_return,',
        '            "final_balance": self.balance,',
        '            "num_trades": len(self.trades)',
        '        }'
      ]
    },
    {
      label: 'Jupiter Price Fetcher',
      description: 'Fetch token prices using Jupiter API',
      prefix: 'jupiter-price',
      category: 'utility',
      body: [
        'import aiohttp',
        'import asyncio',
        '',
        'async def get_token_price(token_mint: str) -> float:',
        '    """Fetch token price from Jupiter API"""',
        '    url = f"https://price.jup.ag/v4/price?ids={token_mint}"',
        '    ',
        '    async with aiohttp.ClientSession() as session:',
        '        async with session.get(url) as response:',
        '            data = await response.json()',
        '            return data["data"][token_mint]["price"]',
        '',
        '# Usage',
        'price = await get_token_price("${1:TOKEN_MINT_ADDRESS}")',
        'print(f"Token price: ${price}")'
      ]
    }
  ],

  tools: [
    {
      name: 'Python',
      command: 'python',
      description: 'Python interpreter',
      category: 'compiler'
    },
    {
      name: 'Pytest',
      command: 'pytest',
      description: 'Python testing framework',
      category: 'tester'
    },
    {
      name: 'Black',
      command: 'black',
      description: 'Python code formatter',
      category: 'formatter'
    },
    {
      name: 'Pylint',
      command: 'pylint',
      description: 'Python code analyzer',
      category: 'analyzer'
    }
  ],

  testing: {
    framework: 'pytest',
    testCommand: 'pytest',
    testPattern: '**/*test*.py',
    setupRequired: false
  }
};