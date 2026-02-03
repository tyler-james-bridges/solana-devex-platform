import { Template } from './index';

export const TESTING_TEMPLATES: Template[] = [
  {
    id: 'anchor-test-suite',
    name: 'Anchor Test Suite',
    description: 'Comprehensive testing setup for Anchor programs',
    category: 'test',
    language: 'typescript',
    files: [
      {
        path: 'tests/${project_name}.ts',
        content: `import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { ${ProjectName} } from "../target/types/${project_name}";
import { expect } from "chai";
import { Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";

describe("${project_name}", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.${ProjectName} as Program<${ProjectName}>;
  let baseAccount: Keypair;

  beforeEach(async () => {
    baseAccount = Keypair.generate();
  });

  describe("initialize", () => {
    it("initializes account with correct data", async () => {
      const data = new anchor.BN(42);
      
      await program.methods
        .initialize(data)
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      expect(account.data.toNumber()).to.equal(42);
    });

    it("fails with invalid data", async () => {
      const data = new anchor.BN(-1); // Assuming data should be positive
      
      try {
        await program.methods
          .initialize(data)
          .accounts({
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([baseAccount])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("Invalid data");
      }
    });

    it("prevents double initialization", async () => {
      const data = new anchor.BN(42);
      
      // First initialization
      await program.methods
        .initialize(data)
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();

      // Second initialization should fail
      try {
        await program.methods
          .initialize(data)
          .accounts({
            baseAccount: baseAccount.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([baseAccount])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("already in use");
      }
    });
  });

  describe("update", () => {
    beforeEach(async () => {
      // Initialize account first
      await program.methods
        .initialize(new anchor.BN(42))
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();
    });

    it("updates account data", async () => {
      const newData = new anchor.BN(100);
      
      await program.methods
        .update(newData)
        .accounts({
          baseAccount: baseAccount.publicKey,
        })
        .rpc();

      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      expect(account.data.toNumber()).to.equal(100);
    });

    it("allows multiple updates", async () => {
      const updates = [100, 200, 300];
      
      for (const value of updates) {
        await program.methods
          .update(new anchor.BN(value))
          .accounts({
            baseAccount: baseAccount.publicKey,
          })
          .rpc();

        const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
        expect(account.data.toNumber()).to.equal(value);
      }
    });
  });

  describe("integration tests", () => {
    it("handles multiple accounts", async () => {
      const accounts = [];
      const numAccounts = 5;
      
      // Create multiple accounts
      for (let i = 0; i < numAccounts; i++) {
        const account = Keypair.generate();
        await program.methods
          .initialize(new anchor.BN(i * 10))
          .accounts({
            baseAccount: account.publicKey,
            user: provider.wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([account])
          .rpc();
        
        accounts.push(account);
      }
      
      // Verify all accounts
      for (let i = 0; i < numAccounts; i++) {
        const account = await program.account.baseAccount.fetch(accounts[i].publicKey);
        expect(account.data.toNumber()).to.equal(i * 10);
      }
    });

    it("stress test: rapid updates", async () => {
      await program.methods
        .initialize(new anchor.BN(0))
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();

      const numUpdates = 50;
      const promises = [];
      
      for (let i = 0; i < numUpdates; i++) {
        promises.push(
          program.methods
            .update(new anchor.BN(i))
            .accounts({
              baseAccount: baseAccount.publicKey,
            })
            .rpc()
        );
      }
      
      await Promise.all(promises);
      
      // Final state should be the last update
      const finalAccount = await program.account.baseAccount.fetch(baseAccount.publicKey);
      expect(finalAccount.data.toNumber()).to.be.at.least(0);
      expect(finalAccount.data.toNumber()).to.be.lessThan(numUpdates);
    });
  });

  describe("event tests", () => {
    it("emits events correctly", (done) => {
      const listener = program.addEventListener("dataChanged", (event) => {
        expect(event.oldValue).to.exist;
        expect(event.newValue).to.exist;
        program.removeEventListener(listener);
        done();
      });

      // Trigger event
      program.methods
        .initialize(new anchor.BN(42))
        .accounts({
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([baseAccount])
        .rpc();
    });
  });

  describe("error handling", () => {
    it("handles insufficient funds", async () => {
      // Create a poor user
      const poorUser = Keypair.generate();
      
      try {
        await program.methods
          .initialize(new anchor.BN(42))
          .accounts({
            baseAccount: baseAccount.publicKey,
            user: poorUser.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([baseAccount, poorUser])
          .rpc();
        
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error.message).to.include("insufficient funds");
      }
    });
  });
});

// Utility functions for tests
export class TestUtils {
  static async airdrop(connection: any, publicKey: any, amount: number = LAMPORTS_PER_SOL) {
    const signature = await connection.requestAirdrop(publicKey, amount);
    await connection.confirmTransaction(signature);
  }

  static async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateTestData(size: number): number[] {
    return Array.from({ length: size }, (_, i) => i);
  }
}
`
      },
      {
        path: 'tests/utils.ts',
        content: `import * as anchor from "@project-serum/anchor";
import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";

export class TestHelper {
  static async createFundedWallet(
    connection: Connection,
    lamports: number = LAMPORTS_PER_SOL
  ): Promise<Keypair> {
    const wallet = Keypair.generate();
    
    const signature = await connection.requestAirdrop(wallet.publicKey, lamports);
    await connection.confirmTransaction(signature);
    
    return wallet;
  }

  static async waitForTransaction(
    connection: Connection,
    signature: string,
    commitment: anchor.web3.Commitment = "confirmed"
  ): Promise<void> {
    await connection.confirmTransaction(signature, commitment);
  }

  static expectError(error: any, expectedMessage: string) {
    if (!error.message.includes(expectedMessage)) {
      throw new Error(\`Expected error message to contain "\${expectedMessage}", but got: \${error.message}\`);
    }
  }

  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; time: number }> {
    const start = Date.now();
    const result = await fn();
    const time = Date.now() - start;
    return { result, time };
  }
}
`
      }
    ],
    dependencies: ['chai', '@types/chai', '@types/mocha'],
    setup: [
      'anchor test'
    ]
  },

  {
    id: 'python-pytest-suite',
    name: 'Python Pytest Suite',
    description: 'Python testing framework for Solana programs',
    category: 'test',
    language: 'python',
    files: [
      {
        path: 'tests/test_${project_name}.py',
        content: `"""
Test suite for ${PROJECT_NAME} Solana program
"""
import pytest
import asyncio
from solana.rpc.async_api import AsyncClient
from solana.rpc.commitment import Commitment
from solana.keypair import Keypair
from solana.publickey import PublicKey
from anchorpy import Program, Provider, Wallet
import json

@pytest.fixture
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture
async def client():
    """Create a test client"""
    connection = AsyncClient("http://127.0.0.1:8899", commitment=Commitment("confirmed"))
    yield connection
    await connection.close()

@pytest.fixture
async def program(client):
    """Initialize test program"""
    # Load test keypair
    with open("tests/test-keypair.json", "r") as f:
        secret_key = json.load(f)
    
    keypair = Keypair.from_secret_key(bytes(secret_key))
    wallet = Wallet(keypair)
    provider = Provider(client, wallet)
    
    # Load IDL
    with open("target/idl/${project_name}.json", "r") as f:
        idl = json.load(f)
    
    program_id = "${PROGRAM_ID}"  # Replace with actual program ID
    program = Program(idl, program_id, provider)
    
    return program

class Test${ProjectName}:
    """Test class for ${PROJECT_NAME}"""
    
    @pytest.mark.asyncio
    async def test_initialization(self, program):
        """Test program initialization"""
        base_account = Keypair.generate()
        
        # Request airdrop for test
        await self._request_airdrop(program.provider.connection, program.provider.wallet.public_key)
        
        # Initialize account
        tx = await program.rpc["initialize"](
            42,  # Initial data value
            ctx=Context(
                accounts={
                    "base_account": base_account.public_key,
                    "user": program.provider.wallet.public_key,
                    "system_program": PublicKey("11111111111111111111111111111112"),
                },
                signers=[base_account]
            )
        )
        
        assert tx is not None
        assert len(tx) == 64  # Signature length
        
        # Verify account data
        account_data = await program.account["base_account"].fetch(base_account.public_key)
        assert account_data["data"] == 42

    @pytest.mark.asyncio
    async def test_update(self, program):
        """Test account update functionality"""
        base_account = Keypair.generate()
        
        # Initialize first
        await program.rpc["initialize"](
            42,
            ctx=Context(
                accounts={
                    "base_account": base_account.public_key,
                    "user": program.provider.wallet.public_key,
                    "system_program": PublicKey("11111111111111111111111111111112"),
                },
                signers=[base_account]
            )
        )
        
        # Update
        await program.rpc["update"](
            100,
            ctx=Context(
                accounts={
                    "base_account": base_account.public_key,
                }
            )
        )
        
        # Verify update
        account_data = await program.account["base_account"].fetch(base_account.public_key)
        assert account_data["data"] == 100

    @pytest.mark.asyncio
    async def test_multiple_accounts(self, program):
        """Test handling multiple accounts"""
        accounts = []
        
        for i in range(5):
            account = Keypair.generate()
            await program.rpc["initialize"](
                i * 10,
                ctx=Context(
                    accounts={
                        "base_account": account.public_key,
                        "user": program.provider.wallet.public_key,
                        "system_program": PublicKey("11111111111111111111111111111112"),
                    },
                    signers=[account]
                )
            )
            accounts.append(account)
        
        # Verify all accounts
        for i, account in enumerate(accounts):
            account_data = await program.account["base_account"].fetch(account.public_key)
            assert account_data["data"] == i * 10

    @pytest.mark.asyncio
    async def test_error_cases(self, program):
        """Test error handling"""
        # Test invalid initialization
        with pytest.raises(Exception):
            await program.rpc["initialize"](
                -1,  # Invalid data
                ctx=Context(
                    accounts={
                        "base_account": Keypair.generate().public_key,
                        "user": program.provider.wallet.public_key,
                        "system_program": PublicKey("11111111111111111111111111111112"),
                    }
                )
            )

    async def _request_airdrop(self, connection, pubkey, amount=1000000000):
        """Helper function to request airdrop"""
        signature = await connection.request_airdrop(pubkey, amount)
        await connection.confirm_transaction(signature)

class TestPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_batch_operations(self, program):
        """Test batch operations performance"""
        import time
        
        start_time = time.time()
        
        # Create multiple accounts concurrently
        tasks = []
        for i in range(10):
            account = Keypair.generate()
            task = program.rpc["initialize"](
                i,
                ctx=Context(
                    accounts={
                        "base_account": account.public_key,
                        "user": program.provider.wallet.public_key,
                        "system_program": PublicKey("11111111111111111111111111111112"),
                    },
                    signers=[account]
                )
            )
            tasks.append(task)
        
        await asyncio.gather(*tasks)
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        print(f"Batch operation completed in {execution_time:.2f} seconds")
        assert execution_time < 30  # Should complete within 30 seconds

# Utility functions for testing
class TestUtils:
    @staticmethod
    async def create_test_keypair():
        """Create a test keypair with airdrop"""
        return Keypair.generate()
    
    @staticmethod
    def load_test_data(filename):
        """Load test data from JSON file"""
        with open(f"tests/data/{filename}", "r") as f:
            return json.load(f)
    
    @staticmethod
    async def wait_for_confirmation(connection, signature):
        """Wait for transaction confirmation"""
        await connection.confirm_transaction(signature)
`
      },
      {
        path: 'tests/conftest.py',
        content: `"""
Pytest configuration and shared fixtures
"""
import pytest
import asyncio
import json
from solana.keypair import Keypair

@pytest.fixture(scope="session")
def test_keypair():
    """Generate a test keypair for the session"""
    keypair = Keypair.generate()
    
    # Save to file for reuse
    with open("tests/test-keypair.json", "w") as f:
        json.dump(list(keypair.secret_key), f)
    
    return keypair

@pytest.fixture(scope="session")
def program_id():
    """Return the program ID for testing"""
    return "${PROGRAM_ID}"  # Replace with actual program ID

# Configure pytest-asyncio
pytest_plugins = ('pytest_asyncio',)
`
      }
    ],
    dependencies: ['pytest', 'pytest-asyncio', 'solana-py', 'anchorpy'],
    setup: [
      'pytest tests/'
    ]
  }
];`