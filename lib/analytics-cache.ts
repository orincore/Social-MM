import connectDB from '@/lib/db';
import { AnalyticsCache } from '@/models/AnalyticsCache';
import User from '@/models/User';

export interface CacheOptions {
  userId: string;
  platform: 'instagram' | 'youtube' | 'combined';
  period: string;
  customStartDate?: string;
  customEndDate?: string;
  ttlMinutes?: number; // Time to live in minutes
  staleMinutes?: number; // Time after which data is considered stale
}

export class AnalyticsCacheManager {
  private static readonly DEFAULT_TTL_MINUTES = 60; // 1 hour
  private static readonly DEFAULT_STALE_MINUTES = 15; // 15 minutes

  /**
   * Get cached analytics data with stale-while-revalidate pattern
   */
  static async getCachedData(options: CacheOptions): Promise<{
    data: any | null;
    isStale: boolean;
    cacheHit: boolean;
  }> {
    try {
      await connectDB();

      const user = await User.findOne({ email: options.userId });
      if (!user) {
        return { data: null, isStale: false, cacheHit: false };
      }

      const cacheKey = this.buildCacheKey(options);
      const cached = await AnalyticsCache.findOne({
        userId: user._id,
        ...cacheKey,
      });

      if (!cached) {
        return { data: null, isStale: false, cacheHit: false };
      }

      const now = new Date();
      const staleThreshold = new Date(
        cached.lastFetched.getTime() + 
        (options.staleMinutes || this.DEFAULT_STALE_MINUTES) * 60 * 1000
      );

      const isStale = now > staleThreshold;

      // Update stale flag if needed
      if (isStale && !cached.isStale) {
        cached.isStale = true;
        await cached.save();
      }

      return {
        data: cached.data,
        isStale,
        cacheHit: true,
      };
    } catch (error) {
      console.error('Error getting cached data:', error);
      return { data: null, isStale: false, cacheHit: false };
    }
  }

  /**
   * Set cached analytics data
   */
  static async setCachedData(options: CacheOptions, data: any): Promise<void> {
    try {
      await connectDB();

      const user = await User.findOne({ email: options.userId });
      if (!user) return;

      const cacheKey = this.buildCacheKey(options);
      const ttlMinutes = options.ttlMinutes || this.DEFAULT_TTL_MINUTES;
      const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

      await AnalyticsCache.findOneAndUpdate(
        {
          userId: user._id,
          ...cacheKey,
        },
        {
          userId: user._id,
          ...cacheKey,
          data,
          isStale: false,
          lastFetched: new Date(),
          expiresAt,
        },
        {
          upsert: true,
          new: true,
        }
      );
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  /**
   * Invalidate cache for a user and platform
   */
  static async invalidateCache(
    userId: string, 
    platform?: 'instagram' | 'youtube' | 'combined'
  ): Promise<void> {
    try {
      await connectDB();

      const user = await User.findOne({ email: userId });
      if (!user) return;

      const query: any = { userId: user._id };
      if (platform) {
        query.platform = platform;
      }

      await AnalyticsCache.deleteMany(query);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }

  /**
   * Mark cache as stale (for background refresh)
   */
  static async markAsStale(options: CacheOptions): Promise<void> {
    try {
      await connectDB();

      const user = await User.findOne({ email: options.userId });
      if (!user) return;

      const cacheKey = this.buildCacheKey(options);
      await AnalyticsCache.updateOne(
        {
          userId: user._id,
          ...cacheKey,
        },
        {
          isStale: true,
        }
      );
    } catch (error) {
      console.error('Error marking cache as stale:', error);
    }
  }

  /**
   * Get stale cache entries for background refresh
   */
  static async getStaleEntries(limit: number = 10): Promise<any[]> {
    try {
      await connectDB();

      return await AnalyticsCache.find({
        isStale: true,
        expiresAt: { $gt: new Date() }, // Not expired yet
      })
      .populate('userId', 'email')
      .limit(limit)
      .sort({ lastFetched: 1 }); // Oldest first
    } catch (error) {
      console.error('Error getting stale entries:', error);
      return [];
    }
  }

  /**
   * Clean up expired cache entries
   */
  static async cleanupExpired(): Promise<number> {
    try {
      await connectDB();

      const result = await AnalyticsCache.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      return result.deletedCount || 0;
    } catch (error) {
      console.error('Error cleaning up expired cache:', error);
      return 0;
    }
  }

  private static buildCacheKey(options: CacheOptions) {
    return {
      platform: options.platform,
      period: options.period,
      ...(options.customStartDate && { customStartDate: options.customStartDate }),
      ...(options.customEndDate && { customEndDate: options.customEndDate }),
    };
  }
}

/**
 * Wrapper function for analytics endpoints to use caching
 */
export async function withCache<T>(
  options: CacheOptions,
  fetchFunction: () => Promise<T>
): Promise<{
  data: T;
  fromCache: boolean;
  isStale: boolean;
}> {
  // Try to get from cache first
  const cached = await AnalyticsCacheManager.getCachedData(options);

  if (cached.cacheHit && cached.data) {
    // If we have fresh data, return it
    if (!cached.isStale) {
      return {
        data: cached.data,
        fromCache: true,
        isStale: false,
      };
    }

    // If data is stale, start background refresh but return stale data immediately
    setImmediate(async () => {
      try {
        const freshData = await fetchFunction();
        await AnalyticsCacheManager.setCachedData(options, freshData);
      } catch (error) {
        console.error('Background refresh failed:', error);
      }
    });

    return {
      data: cached.data,
      fromCache: true,
      isStale: true,
    };
  }

  // No cache hit, fetch fresh data
  const freshData = await fetchFunction();
  
  // Cache the fresh data
  await AnalyticsCacheManager.setCachedData(options, freshData);

  return {
    data: freshData,
    fromCache: false,
    isStale: false,
  };
}
