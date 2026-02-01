import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Upload, FileText, AlertTriangle, CheckCircle, Info, Download } from 'lucide-react';

interface AgreementIssue {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendation: string;
  rentersRightsAct: string;
}

interface AnalysisResult {
  overallCompliance: 'compliant' | 'needs-attention' | 'non-compliant';
  issues: AgreementIssue[];
  score: number;
}

const AgreementChecker: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeAgreement = async () => {
    if (!file) return;
    
    setIsAnalyzing(true);
    
    // Simulate API call for analysis
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        overallCompliance: 'needs-attention',
        score: 72,
        issues: [
          {
            id: '1',
            severity: 'high',
            title: 'Missing Renters Rights Act Compliance Clause',
            description: 'Your agreement does not include the required clause about the Renters Rights Act 2024.',
            recommendation: 'Add a specific clause referencing compliance with the Renters Rights Act 2024 and any subsequent amendments.',
            rentersRightsAct: 'Section 3: All tenancy agreements must reference compliance with current landlord-tenant legislation.'
          },
          {
            id: '2',
            severity: 'medium',
            title: 'Unclear Rent Increase Terms',
            description: 'The rent increase clause is vague and does not specify the notice period required.',
            recommendation: 'Clearly state the notice period for rent increases (minimum 2 months for periodic tenancies under the new act).',
            rentersRightsAct: 'Section 12: Landlords must provide minimum 2 months notice for rent increases.'
          },
          {
            id: '3',
            severity: 'low',
            title: 'Outdated Termination Notice Period',
            description: 'The termination notice period mentioned does not align with new requirements.',
            recommendation: 'Update to reflect the new minimum notice periods for different tenancy types.',
            rentersRightsAct: 'Section 8: Updated notice periods for tenancy termination.'
          }
        ]
      };
      
      setAnalysisResult(mockResult);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getComplianceColor = (compliance: string) => {
    switch (compliance) {
      case 'compliant': return 'text-green-600';
      case 'needs-attention': return 'text-yellow-600';
      case 'non-compliant': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const downloadReport = () => {
    if (!analysisResult) return;
    
    const reportContent = `
LetzPocket Tenancy Agreement Analysis Report
Generated: ${new Date().toLocaleDateString()}

Overall Compliance Score: ${analysisResult.score}%
Status: ${analysisResult.overallCompliance.toUpperCase()}

Issues Found:
${analysisResult.issues.map(issue => `
${issue.severity.toUpperCase()}: ${issue.title}
Description: ${issue.description}
Recommendation: ${issue.recommendation}
Renters Rights Act Reference: ${issue.rentersRightsAct}
---`).join('\n')}
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenancy-agreement-analysis.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tenancy Agreement Checker</h1>
        <p className="text-gray-600 mt-2">
          Upload your tenancy agreement to check compliance with the Renters Rights Act 2024
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Upload Agreement</span>
          </CardTitle>
          <CardDescription>
            Upload your current tenancy agreement (PDF, DOC, or DOCX format)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium text-gray-900">
                {file ? file.name : 'Drop your agreement here or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Supports PDF, DOC, and DOCX files up to 10MB
              </p>
            </div>
            <div className="mt-4">
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  Choose File
                </Button>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </Label>
            </div>
          </div>
          
          {file && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-500">
                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button 
                onClick={analyzeAgreement} 
                disabled={isAnalyzing}
                className="ml-auto"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Agreement'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Analysis Results</span>
                <Button variant="outline" size="sm" onClick={downloadReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {analysisResult.score}% Compliant
                  </p>
                  <p className={`text-sm font-medium ${getComplianceColor(analysisResult.overallCompliance)}`}>
                    Status: {analysisResult.overallCompliance.replace('-', ' ').toUpperCase()}
                  </p>
                </div>
                <div className="w-24 h-24 relative">
                  <svg className="transform -rotate-90 w-24 h-24">
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="36"
                      stroke={analysisResult.score >= 80 ? '#10b981' : analysisResult.score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(analysisResult.score / 100) * 226} 226`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">{analysisResult.score}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Issues */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Issues Found</h3>
            {analysisResult.issues.map((issue) => (
              <Card key={issue.id} className={`border-l-4 ${getSeverityColor(issue.severity)}`}>
                <CardHeader>
                  <div className="flex items-start space-x-3">
                    {issue.severity === 'high' && <AlertTriangle className="h-5 w-5 text-red-600 mt-1" />}
                    {issue.severity === 'medium' && <Info className="h-5 w-5 text-yellow-600 mt-1" />}
                    {issue.severity === 'low' && <CheckCircle className="h-5 w-5 text-blue-600 mt-1" />}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityColor(issue.severity)}`}>
                          {issue.severity.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Issue</h4>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Recommendation</h4>
                      <p className="text-sm text-gray-600 mt-1">{issue.recommendation}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <h4 className="font-medium text-gray-900 text-sm">Renters Rights Act Reference</h4>
                      <p className="text-sm text-gray-600 mt-1">{issue.rentersRightsAct}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreementChecker;
