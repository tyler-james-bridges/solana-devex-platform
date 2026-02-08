'use client'

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Zap,
  DollarSign,
  Clock,
  Target,
  Loader2,
  Info,
  Lock,
  Unlock,
  Code
} from 'lucide-react';

interface SimulationResult {
  id: string;
  status: 'running' | 'success' | 'warning' | 'error';
  timestamp: Date;
  simulation: {
    wouldSucceed: boolean;
    estimatedComputeUnits: number;
    estimatedFee: number;
    accountChanges: AccountChange[];
    programsInvolved: string[];
    cpiCalls: number;
    risks: Risk[];
    optimizations: Optimization[];
  };
  safetyChecks: SafetyCheck[];
  gasEstimate: {
    minFee: number;
    maxFee: number;
    recommendedFee: number;
    priorityFee?: number;
  };
}

interface AccountChange {
  account: string;
  type: 'balance' | 'data' | 'ownership' | 'creation';
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

interface Risk {
  type: 'high_value_transfer' | 'authority_change' | 'program_upgrade' | 'account_closure' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

interface Optimization {
  type: 'compute_reduction' | 'fee_optimization' | 'account_consolidation' | 'instruction_batching';
  description: string;
  potentialSaving: string;
  codeExample?: string;
}

interface SafetyCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
  details?: string;
}

interface TransactionSimulatorProps {
  transactionData?: string;
  onSimulationComplete?: (result: SimulationResult) => void;
}

export const TransactionSimulator: React.FC<TransactionSimulatorProps> = ({
  transactionData,
  onSimulationComplete
}) => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [showAdvancedRisks, setShowAdvancedRisks] = useState(false);
  const [simulationMode, setSimulationMode] = useState<'safe' | 'aggressive'>('safe');

  const runSimulation = async () => {
    setIsSimulating(true);
    setSimulationResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockResult: SimulationResult = {
      id: `sim_${Date.now()}`,
      status: simulationMode === 'safe' ? 'success' : 'warning',
      timestamp: new Date(),
      simulation: {
        wouldSucceed: simulationMode === 'safe' ? true : false,
        estimatedComputeUnits: simulationMode === 'safe' ? 145000 : 280000,
        estimatedFee: simulationMode === 'safe' ? 5000 : 12000,
        cpiCalls: simulationMode === 'safe' ? 3 : 7,
        programsInvolved: ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'],
        accountChanges: [
          {
            account: 'HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE',
            type: 'balance',
            before: '1000.5 SOL',
            after: '950.5 SOL',
            impact: 'medium'
          },
          {
            account: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
            type: 'data',
            before: '8192 bytes',
            after: '8256 bytes',
            impact: 'low'
          }
        ],
        risks: simulationMode === 'aggressive' ? [
          {
            type: 'high_value_transfer',
            severity: 'high',
            description: 'Large SOL transfer detected (50+ SOL)',
            mitigation: 'Consider breaking into smaller transactions'
          },
          {
            type: 'authority_change',
            severity: 'critical',
            description: 'Program authority modification detected',
            mitigation: 'Verify authority change is intentional'
          }
        ] : [
          {
            type: 'suspicious_activity',
            severity: 'low',
            description: 'First-time interaction with new program',
            mitigation: 'Verify program legitimacy'
          }
        ],
        optimizations: [
          {
            type: 'compute_reduction',
            description: 'Consolidate multiple token transfers into batch instruction',
            potentialSaving: '~30% compute units',
            codeExample: `// Before: Multiple transfers
await transferTokens(account1, amount1);
await transferTokens(account2, amount2);

// After: Batch transfer
await batchTransferTokens([
  {account: account1, amount: amount1},
  {account: account2, amount: amount2}
]);`
          },
          {
            type: 'fee_optimization',
            description: 'Use priority fee for faster confirmation',
            potentialSaving: '2x confirmation speed'
          }
        ]
      },
      safetyChecks: [
        {
          name: 'Account Balance Verification',
          status: 'passed',
          description: 'Sufficient balance for all operations'
        },
        {
          name: 'Program Authority Check',
          status: simulationMode === 'aggressive' ? 'warning' : 'passed',
          description: 'Program authorities verified',
          details: simulationMode === 'aggressive' ? 'Authority change detected - review required' : undefined
        },
        {
          name: 'Rent Exemption Status',
          status: 'passed',
          description: 'All accounts will remain rent-exempt'
        },
        {
          name: 'Compute Budget Validation',
          status: simulationMode === 'aggressive' ? 'failed' : 'passed',
          description: 'Transaction within compute limits',
          details: simulationMode === 'aggressive' ? 'Exceeds standard compute budget - may fail' : undefined
        },
        {
          name: 'Duplicate Account Check',
          status: 'passed',
          description: 'No conflicting account access detected'
        }
      ],
      gasEstimate: {
        minFee: simulationMode === 'safe' ? 5000 : 8000,
        maxFee: simulationMode === 'safe' ? 8000 : 15000,
        recommendedFee: simulationMode === 'safe' ? 6500 : 12000,
        priorityFee: simulationMode === 'aggressive' ? 5000 : undefined
      }
    };

    setSimulationResult(mockResult);
    setIsSimulating(false);
    onSimulationComplete?.(mockResult);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRiskIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Info className="w-4 h-4 text-blue-600" />;
      case 'medium': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-green-600" />
            Transaction Safety Simulator
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Pre-execution verification</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Simulation Mode:
              </label>
              <select
                value={simulationMode}
                onChange={(e) => setSimulationMode(e.target.value as 'safe' | 'aggressive')}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="safe">Safe Transaction</option>
                <option value="aggressive">Risky Transaction</option>
              </select>
            </div>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isSimulating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Simulating...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Run Simulation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Results */}
      {isSimulating && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center space-x-3 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <div className="text-lg font-semibold">Running safety simulation...</div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Checking safety constraints and estimating gas costs
          </p>
        </div>
      )}

      {simulationResult && (
        <div className="p-6 space-y-6">
          {/* Simulation Overview */}
          <div className={`p-4 rounded-lg border ${
            simulationResult.status === 'success'
              ? 'bg-green-50 dark:bg-gray-800 border-green-200 dark:border-gray-700'
              : simulationResult.status === 'warning'
              ? 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700'
              : 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {simulationResult.status === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                ) : simulationResult.status === 'warning' ? (
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {simulationResult.simulation.wouldSucceed ? 'Transaction will succeed' : 'Transaction may fail'}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Simulated at {simulationResult.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(simulationResult.simulation.estimatedFee / 1000000).toFixed(6)} SOL
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Estimated fee</div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Compute Units</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {simulationResult.simulation.estimatedComputeUnits.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">CPI Calls</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {simulationResult.simulation.cpiCalls}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Programs</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {simulationResult.simulation.programsInvolved.length}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Risks</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  {simulationResult.simulation.risks.length}
                </div>
              </div>
            </div>
          </div>

          {/* Safety Checks */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              Safety Checks
              <span className="ml-auto text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                {simulationResult.safetyChecks.filter(c => c.status === 'passed').length}/
                {simulationResult.safetyChecks.length} passed
              </span>
            </h4>

            <div className="space-y-3">
              {simulationResult.safetyChecks.map((check, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">{check.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{check.description}</div>
                    {check.details && (
                      <div className="text-sm text-red-600 dark:text-red-400 mt-1">{check.details}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Analysis */}
          {simulationResult.simulation.risks.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
                  Risk Analysis
                </h4>
                <button
                  onClick={() => setShowAdvancedRisks(!showAdvancedRisks)}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  {showAdvancedRisks ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              <div className="space-y-3">
                {simulationResult.simulation.risks.map((risk, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      risk.severity === 'critical'
                        ? 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-gray-700'
                        : risk.severity === 'high'
                        ? 'bg-orange-50 dark:bg-gray-800 border-orange-200 dark:border-gray-700'
                        : risk.severity === 'medium'
                        ? 'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700'
                        : 'bg-blue-50 dark:bg-gray-800 border-blue-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      {getRiskIcon(risk.severity)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {risk.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            risk.severity === 'critical'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                              : risk.severity === 'high'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                              : risk.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
                          }`}>
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{risk.description}</p>
                        {showAdvancedRisks && (
                          <div className="bg-white dark:bg-gray-800 p-3 rounded border">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                              Recommended mitigation:
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{risk.mitigation}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Zap className="w-5 h-5 mr-2 text-yellow-600" />
              Optimization Suggestions
            </h4>

            <div className="space-y-4">
              {simulationResult.simulation.optimizations.map((opt, index) => (
                <div key={index} className="bg-yellow-50 dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {opt.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <span className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                      {opt.potentialSaving}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{opt.description}</p>
                  
                  {opt.codeExample && (
                    <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                        <code>{opt.codeExample}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Gas Estimation */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-green-600" />
              Gas Estimation & Fee Optimization
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Minimum Fee</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(simulationResult.gasEstimate.minFee / 1000000).toFixed(6)} SOL
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 dark:bg-gray-800 rounded-lg border border-green-200 dark:border-gray-700">
                <div className="text-sm text-green-600 mb-1">Recommended</div>
                <div className="text-lg font-bold text-green-800 dark:text-green-200">
                  {(simulationResult.gasEstimate.recommendedFee / 1000000).toFixed(6)} SOL
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Maximum Fee</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(simulationResult.gasEstimate.maxFee / 1000000).toFixed(6)} SOL
                </div>
              </div>
            </div>

            {simulationResult.gasEstimate.priorityFee && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
                <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                  <Target className="w-4 h-4" />
                  <span className="font-medium">Priority Fee Recommended: {(simulationResult.gasEstimate.priorityFee / 1000000).toFixed(6)} SOL</span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  For faster confirmation during network congestion
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionSimulator;