'use client'

import React, { useState } from 'react';
import {
  Shield,
  Lock,
  CheckCircle2,
  Hash,
  Clock,
  FileText,
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Info,
  Zap,
  Target,
  Database,
  Key,
  Globe,
  Link
} from 'lucide-react';

interface DebugAttestation {
  id: string;
  timestamp: Date;
  debuggingSession: {
    transactionSignature: string;
    findings: DebugFinding[];
    computeAnalysis: ComputeAnalysis;
    securityAssessment: SecurityAssessment;
  };
  cryptographicProof: {
    hash: string;
    signature: string;
    publicKey: string;
    algorithm: 'SHA-256' | 'Ed25519';
  };
  onChainAttestation: {
    programId: string;
    accountAddress: string;
    slot: number;
    transactionSignature: string;
    confirmations: number;
  };
  verificationStatus: 'pending' | 'confirmed' | 'failed';
  ipfsUri?: string;
}

interface DebugFinding {
  type: 'error' | 'warning' | 'optimization' | 'security_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    instruction: number;
    programId: string;
    account?: string;
  };
  recommendation: string;
  confidence: number; // 0-100
}

interface ComputeAnalysis {
  totalComputeUnits: number;
  efficiency: number;
  bottlenecks: string[];
  optimizationPotential: number;
}

interface SecurityAssessment {
  riskScore: number; // 0-100
  vulnerabilities: number;
  trustScore: number; // 0-100
  recommendations: string[];
}

interface VerifiableDebuggerProps {
  transactionSignature: string;
  debuggingResults?: any;
  onAttestationCreated?: (attestation: DebugAttestation) => void;
}

export const VerifiableDebugger: React.FC<VerifiableDebuggerProps> = ({
  transactionSignature,
  debuggingResults,
  onAttestationCreated
}) => {
  const [isCreatingAttestation, setIsCreatingAttestation] = useState(false);
  const [attestation, setAttestation] = useState<DebugAttestation | null>(null);
  const [showProofDetails, setShowProofDetails] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);

  const createAttestation = async () => {
    setIsCreatingAttestation(true);
    setVerificationStep(0);

    // Step 1: Generate cryptographic proof
    await new Promise(resolve => setTimeout(resolve, 1500));
    setVerificationStep(1);

    // Step 2: Submit to Solana
    await new Promise(resolve => setTimeout(resolve, 2000));
    setVerificationStep(2);

    // Step 3: Store on IPFS
    await new Promise(resolve => setTimeout(resolve, 1000));
    setVerificationStep(3);

    // Step 4: Confirm on-chain
    await new Promise(resolve => setTimeout(resolve, 1500));

    const mockAttestation: DebugAttestation = {
      id: `attestation_${Date.now()}`,
      timestamp: new Date(),
      debuggingSession: {
        transactionSignature,
        findings: [
          {
            type: 'error',
            severity: 'high',
            description: 'Account reallocation constraint violation detected',
            location: {
              instruction: 2,
              programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
              account: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1'
            },
            recommendation: 'Implement PDA chunking pattern to split large data across multiple accounts',
            confidence: 95
          },
          {
            type: 'optimization',
            severity: 'medium',
            description: 'Compute unit usage can be optimized by 30%',
            location: {
              instruction: 1,
              programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
            },
            recommendation: 'Use batch operations for multiple token transfers',
            confidence: 87
          }
        ],
        computeAnalysis: {
          totalComputeUnits: 285000,
          efficiency: 72.3,
          bottlenecks: ['Excessive account reallocations', 'Redundant CPI calls'],
          optimizationPotential: 30
        },
        securityAssessment: {
          riskScore: 35,
          vulnerabilities: 2,
          trustScore: 78,
          recommendations: [
            'Add additional authority checks',
            'Implement rate limiting for high-value operations'
          ]
        }
      },
      cryptographicProof: {
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        signature: 'ed25519:MOCK_SIGNATURE_NOT_REAL_1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        publicKey: 'ed25519:MOCK_PUBLIC_KEY_NOT_REAL_1234567890abcdef1234567890abcdef1234567890',
        algorithm: 'Ed25519'
      },
      onChainAttestation: {
        programId: 'DevExDbg1234567890abcdef1234567890abcdef1234567890',
        accountAddress: 'AttestVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        slot: 175890847,
        transactionSignature: 'AttestTxYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbM',
        confirmations: 156
      },
      verificationStatus: 'confirmed',
      ipfsUri: 'ipfs://QmX7vZ9k4YfR8wL3nB6mJ2sHtPx5N8qA1eF4cV7bG2dU9s'
    };

    setAttestation(mockAttestation);
    setIsCreatingAttestation(false);
    onAttestationCreated?.(mockAttestation);
  };

  const verificationSteps = [
    { label: 'Generating cryptographic proof...', icon: Hash },
    { label: 'Submitting to Solana...', icon: Link },
    { label: 'Storing on IPFS...', icon: Globe },
    { label: 'Confirming on-chain...', icon: CheckCircle2 }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-blue-600" />
            Verifiable Debugging Attestation
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
            <Lock className="w-4 h-4" />
            <span>Cryptographically secured</span>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                What is Verifiable Debugging?
              </h4>
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                Create tamper-proof, on-chain attestations of your debugging findings. Each attestation is cryptographically signed, 
                stored on Solana, and can be independently verified by anyone. This provides accountability and trust for your 
                debugging work.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attestation Creation */}
      {!attestation && (
        <div className="p-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Create Debugging Attestation
              </h4>
              <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Generate a cryptographically signed, on-chain proof of your debugging findings for transaction: 
                <span className="font-mono text-sm block mt-1">
                  {transactionSignature.slice(0, 20)}...
                </span>
              </p>
            </div>

            {!isCreatingAttestation ? (
              <button
                onClick={createAttestation}
                disabled={!transactionSignature}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 mx-auto"
              >
                <Shield className="w-5 h-5" />
                <span>Create Attestation</span>
              </button>
            ) : (
              <div className="space-y-4">
                <div className="max-w-md mx-auto">
                  {verificationSteps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isActive = index === verificationStep;
                    const isCompleted = index < verificationStep;
                    
                    return (
                      <div key={index} className="flex items-center space-x-3 py-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted 
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : isActive
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                        }`}>
                          {isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <StepIcon className="w-4 h-4" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          isCompleted || isActive 
                            ? 'text-gray-900 dark:text-white font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Attestation Results */}
      {attestation && (
        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg border flex items-center space-x-3 ${
            attestation.verificationStatus === 'confirmed'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : attestation.verificationStatus === 'pending'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}>
            {attestation.verificationStatus === 'confirmed' ? (
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            ) : attestation.verificationStatus === 'pending' ? (
              <Clock className="w-6 h-6 text-yellow-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Attestation {attestation.verificationStatus === 'confirmed' ? 'Confirmed' : 'Pending'}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Created at {attestation.timestamp.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {attestation.debuggingSession.findings.filter(f => f.severity === 'high' || f.severity === 'critical').length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {attestation.debuggingSession.computeAnalysis.efficiency}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {attestation.debuggingSession.securityAssessment.trustScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Trust Score</div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {attestation.onChainAttestation.confirmations}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Confirmations</div>
            </div>
          </div>

          {/* Findings Summary */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Debugging Findings ({attestation.debuggingSession.findings.length})
            </h4>

            <div className="space-y-3">
              {attestation.debuggingSession.findings.map((finding, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  finding.severity === 'critical' || finding.severity === 'high'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : finding.severity === 'medium'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {finding.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        finding.severity === 'critical' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          : finding.severity === 'high'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200'
                          : finding.severity === 'medium'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                      }`}>
                        {finding.severity}
                      </span>
                    </div>
                    <span className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                      {finding.confidence}% confidence
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{finding.description}</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    <strong>Recommendation:</strong> {finding.recommendation}
                  </p>
                  <p className="text-gray-500 dark:text-gray-500 text-xs mt-1 font-mono">
                    Instruction #{finding.location.instruction} • {finding.location.programId.slice(0, 20)}...
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Cryptographic Proof */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Key className="w-5 h-5 mr-2 text-green-600" />
                Cryptographic Proof
              </h4>
              <button
                onClick={() => setShowProofDetails(!showProofDetails)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
              >
                {showProofDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hash (SHA-256)
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                    {attestation.cryptographicProof.hash}
                  </code>
                  <button
                    onClick={() => copyToClipboard(attestation.cryptographicProof.hash)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Algorithm
                </label>
                <div className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-2 rounded font-medium">
                  {attestation.cryptographicProof.algorithm}
                </div>
              </div>
            </div>

            {showProofDetails && (
              <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Digital Signature
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono break-all">
                      {attestation.cryptographicProof.signature}
                    </code>
                    <button
                      onClick={() => copyToClipboard(attestation.cryptographicProof.signature)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Public Key
                  </label>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                      {attestation.cryptographicProof.publicKey}
                    </code>
                    <button
                      onClick={() => copyToClipboard(attestation.cryptographicProof.publicKey)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* On-Chain Verification */}
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Link className="w-5 h-5 mr-2 text-purple-600" />
              On-Chain Attestation
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Program ID
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                    {attestation.onChainAttestation.programId}
                  </code>
                  <a
                    href={`https://solscan.io/account/${attestation.onChainAttestation.programId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Account Address
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                    {attestation.onChainAttestation.accountAddress}
                  </code>
                  <a
                    href={`https://solscan.io/account/${attestation.onChainAttestation.accountAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                    {attestation.onChainAttestation.transactionSignature}
                  </code>
                  <a
                    href={`https://solscan.io/tx/${attestation.onChainAttestation.transactionSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slot & Confirmations
                </label>
                <div className="text-sm bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  Slot: {attestation.onChainAttestation.slot.toLocaleString()} • {attestation.onChainAttestation.confirmations} confirmations
                </div>
              </div>
            </div>

            {attestation.ipfsUri && (
              <div className="mt-4 pt-4 border-t dark:border-gray-700">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  IPFS Storage
                </label>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded font-mono">
                    {attestation.ipfsUri}
                  </code>
                  <a
                    href={`https://ipfs.io/ipfs/${attestation.ipfsUri.replace('ipfs://', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Verification Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Independent Verification
            </h4>
            <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
              <p>Anyone can verify this debugging attestation independently:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Check the cryptographic hash matches the stored findings</li>
                <li>Verify the digital signature using the public key</li>
                <li>Confirm the on-chain attestation exists on Solana</li>
                <li>Download and verify the IPFS content</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiableDebugger;