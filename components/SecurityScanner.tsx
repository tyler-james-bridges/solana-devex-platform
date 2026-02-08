'use client'

import React, { useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  Info,
  TrendingUp,
  Zap,
  Eye,
  Clock,
  DollarSign,
  Users,
  Activity,
  Target,
  AlertCircle
} from 'lucide-react';

interface SecurityScannerProps {
  onScanComplete?: (result: any) => void;
}

interface ScanResult {
  scanType: string;
  results: any;
  timestamp: string;
  scanId: string;
}

export const SecurityScanner: React.FC<SecurityScannerProps> = ({ onScanComplete }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [scanType, setScanType] = useState<'auto' | 'token' | 'program' | 'whale' | 'comprehensive'>('auto');
  const [threatFeed, setThreatFeed] = useState<any[]>([]);
  const [showThreatFeed, setShowThreatFeed] = useState(false);

  const runSecurityScan = async () => {
    if (!inputValue.trim()) return;

    setIsScanning(true);
    setScanResult(null);

    try {
      const requestBody: any = {};
      
      // Determine what type of scan based on input format
      if (scanType === 'auto') {
        if (inputValue.length === 44 && inputValue.match(/^[1-9A-HJ-NP-Za-km-z]+$/)) {
          // Looks like a Solana address - could be token, program, or wallet
          if (inputValue.startsWith('So1') || inputValue.startsWith('Token')) {
            requestBody.mintAddress = inputValue;
          } else {
            requestBody.programId = inputValue;
          }
        } else {
          requestBody.mintAddress = inputValue;
        }
      } else if (scanType === 'token') {
        requestBody.mintAddress = inputValue;
      } else if (scanType === 'program') {
        requestBody.programId = inputValue;
      } else if (scanType === 'whale') {
        requestBody.walletAddress = inputValue;
      } else if (scanType === 'comprehensive') {
        requestBody.mintAddress = inputValue;
        requestBody.scanType = 'comprehensive';
      }

      requestBody.scanType = scanType === 'auto' ? undefined : scanType;

      const response = await fetch('/api/security/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success) {
        setScanResult(data.data);
        onScanComplete?.(data.data);
      } else {
        console.error('Scan failed:', data.error);
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const loadThreatFeed = async () => {
    try {
      const response = await fetch('/api/security/scan?type=threats');
      const data = await response.json();
      
      if (data.success) {
        setThreatFeed(data.data.results || []);
        setShowThreatFeed(true);
      }
    } catch (error) {
      console.error('Failed to load threat feed:', error);
    }
  };

  const getRiskColor = (riskScore: number) => {
    if (riskScore >= 80) return 'text-red-600 bg-red-50 border-red-200 dark:bg-gray-800 dark:border-gray-700 dark:text-red-400';
    if (riskScore >= 60) return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-gray-800 dark:border-gray-700 dark:text-orange-400';
    if (riskScore >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-gray-800 dark:border-gray-700 dark:text-yellow-400';
    return 'text-green-600 bg-green-50 border-green-200 dark:bg-gray-800 dark:border-gray-700 dark:text-green-400';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'low': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const renderTokenScanResults = (tokenScan: any, honeypotCheck: any) => (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className={`p-4 rounded-lg border ${getRiskColor(tokenScan.riskScore)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h4 className="font-semibold">{tokenScan.details.tokenName} ({tokenScan.details.tokenSymbol})</h4>
              <p className="text-sm opacity-75">Risk Level: {tokenScan.riskLevel.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{tokenScan.riskScore}/100</div>
            <div className="text-sm opacity-75">Risk Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-75">Total Supply</div>
            <div className="font-semibold">{(tokenScan.details.supply.total / 1000000).toFixed(2)}M</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Holders</div>
            <div className="font-semibold">{tokenScan.details.holder.count.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Liquidity</div>
            <div className="font-semibold">${tokenScan.details.liquidity.totalValue.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Verified</div>
            <div className="font-semibold">{tokenScan.details.metadata.verified ? 'Yes' : 'No'}</div>
          </div>
        </div>
      </div>

      {/* Security Flags */}
      {tokenScan.flags && tokenScan.flags.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Security Flags
            <span className="ml-auto text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
              {tokenScan.flags.length}
            </span>
          </h4>

          <div className="space-y-3">
            {tokenScan.flags.map((flag: any, index: number) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                {getSeverityIcon(flag.severity)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {flag.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{flag.description}</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  flag.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                  flag.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                  flag.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                  'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
                }`}>
                  {flag.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Honeypot Analysis */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Target className="w-5 h-5 mr-2 text-purple-600" />
          Honeypot Analysis
          <span className={`ml-auto text-sm px-2 py-1 rounded ${
            honeypotCheck.isHoneypot 
              ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          }`}>
            {honeypotCheck.isHoneypot ? 'HONEYPOT DETECTED' : 'SAFE'}
          </span>
        </h4>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">{honeypotCheck.confidence}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Can Buy</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {honeypotCheck.analysis.canBuy ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Can Sell</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {honeypotCheck.analysis.canSell ? 'Yes' : 'No'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Sell Tax</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {honeypotCheck.analysis.sellTax || 0}%
            </div>
          </div>
        </div>

        {honeypotCheck.warnings && honeypotCheck.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Warnings:</div>
            {honeypotCheck.warnings.map((warning: any, index: number) => (
              <div key={index} className="flex items-start space-x-2 text-sm">
                {getSeverityIcon(warning.severity)}
                <span className="text-gray-600 dark:text-gray-400">{warning.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderProgramScanResults = (programScan: any) => (
    <div className="space-y-6">
      {/* Overall Risk */}
      <div className={`p-4 rounded-lg border ${getRiskColor(programScan.overallRisk.score)}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6" />
            <div>
              <h4 className="font-semibold">Program Security Report</h4>
              <p className="text-sm opacity-75">{programScan.overallRisk.summary}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{programScan.overallRisk.score}/100</div>
            <div className="text-sm opacity-75">Risk Score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm opacity-75">Instructions</div>
            <div className="font-semibold">{programScan.codeAnalysis.instructionCount}</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Complexity</div>
            <div className="font-semibold">{programScan.codeAnalysis.complexityScore}/100</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Success Rate</div>
            <div className="font-semibold">{programScan.runtimeMetrics.successRate}%</div>
          </div>
          <div>
            <div className="text-sm opacity-75">Vulnerabilities</div>
            <div className="font-semibold">{programScan.vulnerabilities.length}</div>
          </div>
        </div>
      </div>

      {/* Vulnerabilities */}
      {programScan.vulnerabilities && programScan.vulnerabilities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <XCircle className="w-5 h-5 mr-2 text-red-600" />
            Vulnerabilities Found
            <span className="ml-auto text-sm bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded">
              {programScan.vulnerabilities.length}
            </span>
          </h4>

          <div className="space-y-4">
            {programScan.vulnerabilities.map((vuln: any, index: number) => (
              <div key={index} className="bg-red-50 dark:bg-gray-800 p-4 rounded-lg border border-red-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white">{vuln.title}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    vuln.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    vuln.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                  }`}>
                    {vuln.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{vuln.description}</p>
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">Impact: {vuln.impact}</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  <strong>Recommendation:</strong> {vuln.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2 text-yellow-600" />
          Security Recommendations
        </h4>

        <div className="space-y-4">
          {programScan.recommendations.map((rec: any, index: number) => (
            <div key={index} className="bg-yellow-50 dark:bg-gray-800 p-4 rounded-lg border border-yellow-200 dark:border-gray-700">
              <div className="flex items-start justify-between mb-2">
                <span className="font-medium text-gray-900 dark:text-white">{rec.title}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  rec.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                  rec.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                  'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rec.description}</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">
                <strong>Implementation:</strong> {rec.implementation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWhaleResults = (whaleData: any) => (
    <div className="space-y-6">
      {/* Whale Overview */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Whale Activity Analysis
          </h4>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            whaleData.metrics.classification === 'trader' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
            'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
          }`}>
            {whaleData.metrics.classification}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Portfolio Value</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              ${whaleData.holdings.totalValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">SOL Balance</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {whaleData.holdings.solBalance.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Risk Score</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {whaleData.metrics.riskScore}/100
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Wallet Age</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {whaleData.metrics.walletAge} days
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      {whaleData.recentTransactions && whaleData.recentTransactions.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-green-600" />
            Recent Large Transactions
          </h4>

          <div className="space-y-3">
            {whaleData.recentTransactions.map((tx: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{tx.type.toUpperCase()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900 dark:text-white">
                    ${tx.value.toLocaleString()}
                  </div>
                  <div className={`text-sm px-2 py-1 rounded ${
                    tx.impact === 'market_moving' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    tx.impact === 'significant' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                    'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
                  }`}>
                    {tx.impact}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
      {/* Header */}
      <div className="p-6 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Shield className="w-6 h-6 mr-3 text-purple-600" />
            Guardian Security Scanner
          </h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadThreatFeed}
              className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
            >
              <Eye className="w-4 h-4 inline mr-1" />
              Threat Feed
            </button>
            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Guardian Swarm Online</span>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter Solana address (token, program, or wallet)..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <select
              value={scanType}
              onChange={(e) => setScanType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="auto">Auto Detect</option>
              <option value="token">Token Scan</option>
              <option value="program">Program Audit</option>
              <option value="whale">Whale Track</option>
              <option value="comprehensive">Full Scan</option>
            </select>
            <button
              onClick={runSecurityScan}
              disabled={isScanning || !inputValue.trim()}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Scanning...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Scan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scanning Progress */}
      {isScanning && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center space-x-3 text-purple-600 dark:text-purple-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <div className="text-lg font-semibold">Guardian agents analyzing...</div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Running comprehensive security analysis
          </p>
        </div>
      )}

      {/* Scan Results */}
      {scanResult && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              Scan Results - {scanResult.scanType.toUpperCase()}
            </h4>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4 inline mr-1" />
              {new Date(scanResult.timestamp).toLocaleString()}
            </div>
          </div>

          {scanResult.scanType === 'token' && scanResult.results.tokenScan && 
            renderTokenScanResults(scanResult.results.tokenScan, scanResult.results.honeypotCheck)
          }

          {scanResult.scanType === 'program' && 
            renderProgramScanResults(scanResult.results)
          }

          {scanResult.scanType === 'whale' && 
            renderWhaleResults(scanResult.results)
          }

          {scanResult.scanType === 'comprehensive' && (
            <div className="space-y-8">
              {scanResult.results.tokenScan && (
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Token Analysis</h5>
                  {renderTokenScanResults(scanResult.results.tokenScan, scanResult.results.honeypotCheck)}
                </div>
              )}
              
              {scanResult.results.programScan && (
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Program Audit</h5>
                  {renderProgramScanResults(scanResult.results.programScan)}
                </div>
              )}
              
              {scanResult.results.whaleActivity && (
                <div>
                  <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Whale Activity</h5>
                  {renderWhaleResults(scanResult.results.whaleActivity)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Threat Feed */}
      {showThreatFeed && threatFeed.length > 0 && (
        <div className="border-t dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
              Active Threat Feed
            </h4>
            <button
              onClick={() => setShowThreatFeed(false)}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Hide
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {threatFeed.slice(0, 10).map((threat: any, index: number) => (
              <div key={index} className={`p-4 rounded-lg border ${
                threat.severity === 'critical' ? 'bg-red-50 dark:bg-gray-800 border-red-200 dark:border-gray-700' :
                threat.severity === 'high' ? 'bg-orange-50 dark:bg-gray-800 border-orange-200 dark:border-gray-700' :
                'bg-yellow-50 dark:bg-gray-800 border-yellow-200 dark:border-gray-700'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getSeverityIcon(threat.severity)}
                      <span className="font-medium text-gray-900 dark:text-white">
                        {threat.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{threat.description}</p>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {new Date(threat.timestamp).toLocaleString()}
                      {threat.intelligence && (
                        <span className="ml-4">
                          Confidence: {threat.intelligence.confidence}% | {threat.intelligence.source}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    threat.severity === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                    threat.severity === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                  }`}>
                    {threat.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results State */}
      {!isScanning && !scanResult && !showThreatFeed && (
        <div className="p-6 text-center">
          <Shield className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Guardian Security Ready
          </h4>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Enter a Solana address above to run a comprehensive security analysis. 
            Guardian's 17-agent swarm will analyze tokens for honeypots, track whale activity, 
            audit program security, and provide real-time threat intelligence.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl mx-auto">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Token Security</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Risk scoring, honeypot detection, whale concentration analysis, and liquidity verification.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Program Auditing</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Vulnerability scanning, best practice compliance, and security recommendations.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Whale Tracking</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Large wallet monitoring, transaction impact analysis, and market movement alerts.
              </p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <h5 className="font-medium text-gray-900 dark:text-white mb-2">Threat Intelligence</h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Real-time exploit detection, rug pull warnings, and ecosystem-wide security monitoring.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityScanner;