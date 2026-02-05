import { UserApiQuota, ApiUsageLog } from '../types/property';

// Quota management for PropertyData API
export interface QuotaPlan {
  id: string;
  name: string;
  monthlyCredits: number;
  features: string[];
  price?: string;
}

export interface QuotaUsage {
  userId: string;
  planId: string;
  usedCredits: number;
  remainingCredits: number;
  resetDate: Date;
  usageBreakdown: {
    valuations: number;
    rents: number;
    soldPrices: number;
    growth: number;
    demographics: number;
    batchRequests: number;
  };
  endpoint?: string; // Add optional endpoint field
}

// Predefined quota plans
export const QUOTA_PLANS: QuotaPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    monthlyCredits: 10,
    features: ['Basic valuations', 'Monthly updates', 'Email support'],
    price: '£0/month'
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyCredits: 100,
    features: ['Unlimited valuations', 'Real-time updates', 'Priority support', 'Advanced analytics', 'Batch processing'],
    price: '£29/month'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyCredits: 500,
    features: ['Everything in Professional', 'Custom integrations', 'Dedicated support', 'API access', 'White-label options'],
    price: 'Custom pricing'
  },
  {
    id: 'trial',
    name: '14-Day Trial',
    monthlyCredits: 50,
    features: ['Full API access', 'All features enabled'],
    price: 'Free trial'
  }
];

export class PropertyDataQuotaManager {
  private apiUsageCache = new Map<string, QuotaUsage>();

  /**
   * Get available quota plans
   */
  static getAvailablePlans(): QuotaPlan[] {
    return QUOTA_PLANS;
  }

  /**
   * Get current quota for a user
   */
  async getUserQuota(userId: string): Promise<QuotaUsage> {
    // Check cache first
    if (this.apiUsageCache.has(userId)) {
      return this.apiUsageCache.get(userId)!;
    }

    // This would integrate with your database
    const usage = await this.fetchUserQuotaFromDB(userId);
    this.apiUsageCache.set(userId, usage);
    return usage;
  }

  /**
   * Update user's quota plan
   */
  async updateUserPlan(userId: string, planId: string): Promise<void> {
    // Validate plan exists
    const plan = QUOTA_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error(`Invalid plan ID: ${planId}`);
    }

    // Update user's plan in database
    await this.updateUserPlanInDB(userId, planId);
    
    // Clear cache to force refresh
    this.apiUsageCache.delete(userId);
    
    console.log(`Updated user ${userId} to plan ${planId} (${plan.name})`);
  }

  /**
   * Check if user has sufficient credits for operation
   */
  async checkCredits(userId: string, requiredCredits: number = 1): Promise<boolean> {
    const quota = await this.getUserQuota(userId);
    return quota.remainingCredits >= requiredCredits;
  }

  /**
   * Deduct credits from user's quota
   */
  async deductCredits(userId: string, credits: number, endpoint: string, params?: any): Promise<void> {
    const quota = await this.getUserQuota(userId);
    
    if (quota.remainingCredits < credits) {
      throw new Error(`Insufficient credits. Required: ${credits}, Available: ${quota.remainingCredits}`);
    }

    // Deduct credits
    const newRemaining = quota.remainingCredits - credits;
    await this.updateUsageInDB(userId, {
      usedCredits: quota.usedCredits + credits,
      remainingCredits: newRemaining,
      endpoint,
      params
    });

    // Update cache
    quota.usedCredits += credits;
    quota.remainingCredits = newRemaining;
    this.apiUsageCache.set(userId, quota);

    console.log(`Deducted ${credits} credits from user ${userId}. Remaining: ${newRemaining}`);
  }

  /**
   * Add credits to user's quota (admin function)
   */
  async addCredits(userId: string, credits: number, reason: string): Promise<void> {
    const quota = await this.getUserQuota(userId);
    
    const newRemaining = quota.remainingCredits + credits;
    await this.updateUsageInDB(userId, {
      usedCredits: quota.usedCredits, // Don't change used credits for bonus
      remainingCredits: newRemaining,
      endpoint: 'credit_bonus',
      params: { credits, reason }
    });

    // Update cache
    quota.remainingCredits = newRemaining;
    this.apiUsageCache.set(userId, quota);

    console.log(`Added ${credits} credits to user ${userId}. Reason: ${reason}. New total: ${newRemaining}`);
  }

  /**
   * Get quota usage statistics for admin dashboard
   */
  async getQuotaStatistics(): Promise<{
    totalUsers: number;
    planDistribution: Record<string, number>;
    totalCreditsUsed: number;
    totalCreditsAllocated: number;
    averageUsagePerUser: number;
    topUsers: Array<{
      userId: string;
      planId: string;
      creditsUsed: number;
      efficiency: number; // cache hit rate
    }>;
  }> {
    // This would query your database for aggregate statistics
    return {
      totalUsers: 0,
      planDistribution: {
        free: 0,
        professional: 0,
        enterprise: 0,
        trial: 0
      },
      totalCreditsUsed: 0,
      totalCreditsAllocated: 0,
      averageUsagePerUser: 0,
      topUsers: []
    };
  }

  /**
   * Reset monthly quotas (scheduled job)
   */
  async resetMonthlyQuotas(): Promise<void> {
    // Get all users and reset their quotas
    const affectedUsers = await this.resetQuotasInDB();
    
    // Clear cache for all affected users
    affectedUsers.forEach(userId => {
      this.apiUsageCache.delete(userId);
    });

    console.log(`Reset monthly quotas for ${affectedUsers.length} users`);
  }

  /**
   * Get users approaching quota limits
   */
  async getUsersNearQuotaLimit(threshold: number = 0.8): Promise<string[]> {
    // This would query your database for users with usage > threshold
    return [];
  }

  /**
   * Get efficiency metrics for cost optimization
   */
  async getEfficiencyMetrics(): Promise<{
    averageCacheHitRate: number;
    totalApiCalls: number;
    estimatedCostSavings: number;
    recommendations: string[];
  }> {
    // This would analyze API usage patterns
    return {
      averageCacheHitRate: 0.75, // 75% cache hit rate target
      totalApiCalls: 0,
      estimatedCostSavings: 0,
      recommendations: [
        'Increase cache duration for stable data types',
        'Implement batch processing for similar postcodes',
        'Review user patterns for optimization opportunities'
      ]
    };
  }

  /**
   * Database integration methods (to be implemented)
   */
  private async fetchUserQuotaFromDB(userId: string): Promise<QuotaUsage> {
    // TODO: Integrate with your database
    const plan = QUOTA_PLANS.find(p => p.id === 'professional'); // Default to professional for demo
    
    // Mock usage data - replace with actual database query
    const mockUsage: QuotaUsage = {
      userId,
      planId: plan.id,
      usedCredits: Math.floor(Math.random() * 50), // Mock usage
      remainingCredits: plan.monthlyCredits - Math.floor(Math.random() * 50),
      resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
      usageBreakdown: {
        valuations: Math.floor(Math.random() * 20),
        rents: Math.floor(Math.random() * 15),
        soldPrices: Math.floor(Math.random() * 10),
        growth: Math.floor(Math.random() * 5),
        demographics: Math.floor(Math.random() * 5),
        batchRequests: Math.floor(Math.random() * 3)
      }
    };

    return mockUsage;
  }

  private async updateUserPlanInDB(userId: string, planId: string): Promise<void> {
    // TODO: Implement database update
    console.log(`DB: Update user ${userId} plan to ${planId}`);
  }

  private async updateUsageInDB(userId: string, usage: {
    usedCredits: number;
    remainingCredits: number;
    endpoint?: string;
    params?: any;
  }): Promise<void> {
    // TODO: Implement database update
    console.log(`DB: Update usage for user ${userId}:`, usage);
  }

  private async resetQuotasInDB(): Promise<string[]> {
    // TODO: Implement database reset for monthly quotas
    console.log('DB: Reset monthly quotas for all users');
    return ['user1', 'user2', 'user3']; // Mock affected users
  }
}

// Admin functions for quota management
export class PropertyDataAdmin {
  private quotaManager: PropertyDataQuotaManager;

  constructor() {
    this.quotaManager = new PropertyDataQuotaManager();
  }

  /**
   * Update user plan (admin only)
   */
  async updateUserPlan(userId: string, planId: string, adminUserId: string): Promise<void> {
    // Log admin action
    console.log(`Admin ${adminUserId} updated user ${userId} to plan ${planId}`);
    
    await this.quotaManager.updateUserPlan(userId, planId);
  }

  /**
   * Grant bonus credits (admin only)
   */
  async grantBonusCredits(
    userId: string, 
    credits: number, 
    reason: string, 
    adminUserId: string
  ): Promise<void> {
    console.log(`Admin ${adminUserId} granted ${credits} bonus credits to user ${userId}. Reason: ${reason}`);
    
    await this.quotaManager.addCredits(userId, credits, reason);
  }

  /**
   * Get admin dashboard data
   */
  async getAdminDashboard(): Promise<{
    quotaStats: any;
    recentActivity: any[];
    systemHealth: any;
  }> {
    const [quotaStats, efficiencyMetrics] = await Promise.all([
      this.quotaManager.getQuotaStatistics(),
      this.quotaManager.getEfficiencyMetrics()
    ]);

    return {
      quotaStats,
      recentActivity: [], // TODO: Fetch recent API usage
      systemHealth: {
        apiStatus: 'operational',
        cacheHitRate: efficiencyMetrics.averageCacheHitRate,
        lastReset: new Date()
      }
    };
  }

  /**
   * Bulk update user plans
   */
  async bulkUpdatePlans(updates: Array<{ userId: string; planId: string }>, adminUserId: string): Promise<void> {
    console.log(`Admin ${adminUserId} bulk updating ${updates.length} user plans`);
    
    for (const update of updates) {
      const plan = QUOTA_PLANS.find(p => p.id === update.planId);
      if (plan) {
        console.log(`Updating user ${update.userId} to plan ${update.planId} (${plan.name})`);
      }
      await this.quotaManager.updateUserPlan(update.userId, update.planId);
    }
  }

  /**
   * Get users needing attention
   */
  async getActionableUsers(): Promise<{
    nearQuotaLimit: string[];
    inactiveUsers: string[];
    highUsage: string[];
  }> {
    const [nearLimit] = await Promise.all([
      this.quotaManager.getUsersNearQuotaLimit(0.9),
      // TODO: Add more user segments
    ]);

    return {
      nearQuotaLimit: nearLimit,
      inactiveUsers: [], // TODO: Implement inactive user detection
      highUsage: [] // TODO: Implement high usage detection
    };
  }
}

// Singleton instances
export const propertyDataQuotaManager = new PropertyDataQuotaManager();
export const propertyDataAdmin = new PropertyDataAdmin();
