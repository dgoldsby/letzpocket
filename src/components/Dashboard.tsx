import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, FileText, Calculator, TrendingUp, AlertCircle } from 'lucide-react';

interface DashboardProps {
  onPageChange: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const stats = [
    {
      title: 'Total Properties',
      value: '3',
      description: 'Active rental properties',
      icon: Building2,
      color: 'text-lp-blue-600',
    },
    {
      title: 'Agreements Checked',
      value: '2',
      description: 'Tenancy agreements reviewed',
      icon: FileText,
      color: 'text-lp-blue-600',
    },
    {
      title: 'Avg. Yield',
      value: '5.2%',
      description: 'Across all properties',
      icon: Calculator,
      color: 'text-lp-orange-600',
    },
    {
      title: 'Market Value',
      value: '£1.2M',
      description: 'Estimated portfolio value',
      icon: TrendingUp,
      color: 'text-lp-orange-600',
    },
  ];

  const quickActions = [
    {
      title: 'Check Tenancy Agreement',
      description: 'Upload and analyze your current tenancy agreement for compliance with the Renters Rights Act',
      action: () => onPageChange('agreement-checker'),
      icon: FileText,
      urgent: true,
    },
    {
      title: 'Calculate Rental Yield',
      description: 'Calculate the potential yield on your rental properties',
      action: () => onPageChange('yield-calculator'),
      icon: Calculator,
      urgent: false,
    },
    {
      title: 'Estimate Property Value',
      description: 'Get an estimate of your property\'s current market value',
      action: () => onPageChange('price-estimator'),
      icon: TrendingUp,
      urgent: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Welcome to LetzPocket</h1>
        <p className="text-gray-600 mt-2">
          Your comprehensive property management solution for UK landlords
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={action.action}
              >
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Icon className="h-5 w-5 text-lp-blue-600" />
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    {action.urgent && (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest property management activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-lp-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Tenancy agreement for 123 High Street checked - 2 issues found
              </span>
              <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-lp-orange-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                New property added: 45 Oak Avenue
              </span>
              <span className="text-xs text-gray-400 ml-auto">1 day ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-lp-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Yield calculation completed for portfolio
              </span>
              <span className="text-xs text-gray-400 ml-auto">3 days ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
