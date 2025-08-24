import { RequestHandler } from 'express';

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  duration: number;
  timestamp: number;
  statusCode: number;
  userAgent?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 1000; // Keep last 1000 requests

  addMetric(metric: PerformanceMetrics) {
    this.metrics.push(metric);

    // Keep only the latest metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAverageResponseTime(endpoint?: string): number {
    const filteredMetrics = endpoint ? this.metrics.filter((m) => m.endpoint === endpoint) : this.metrics;

    if (filteredMetrics.length === 0) return 0;

    const total = filteredMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / filteredMetrics.length;
  }

  getSlowestEndpoints(limit: number = 10): Array<{ endpoint: string; avgDuration: number }> {
    const endpointStats = new Map<string, { total: number; count: number }>();

    this.metrics.forEach((metric) => {
      const key = `${metric.method} ${metric.endpoint}`;
      const existing = endpointStats.get(key) || { total: 0, count: 0 };
      endpointStats.set(key, {
        total: existing.total + metric.duration,
        count: existing.count + 1,
      });
    });

    return Array.from(endpointStats.entries())
      .map(([endpoint, stats]) => ({
        endpoint,
        avgDuration: stats.total / stats.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, limit);
  }

  getMetrics(limit?: number): PerformanceMetrics[] {
    return limit ? this.metrics.slice(-limit) : this.metrics;
  }

  clear() {
    this.metrics = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Performance monitoring middleware
export const performanceMiddleware: RequestHandler = (req, res, next) => {
  const startTime = Date.now();

  // Store original res.end to capture response time
  const originalEnd = res.end;

  res.end = function (chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;

    // Record the metric
    performanceMonitor.addMetric({
      endpoint: req.route?.path || req.path,
      method: req.method,
      duration,
      timestamp: startTime,
      statusCode: res.statusCode,
      userAgent: req.get('User-Agent'),
    });

    // Log slow requests (> 1 second)
    if (duration > 1000 && req.logger) {
      req.logger.warn('Slow request detected', {
        endpoint: req.route?.path || req.path,
        method: req.method,
        duration: `${duration}ms`,
        statusCode: res.statusCode,
      });
    }

    // Add performance headers
    res.set('X-Response-Time', `${duration}ms`);

    // Call original res.end
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Health check endpoint data
export const getPerformanceStats = () => ({
  averageResponseTime: performanceMonitor.getAverageResponseTime(),
  slowestEndpoints: performanceMonitor.getSlowestEndpoints(5),
  recentRequests: performanceMonitor.getMetrics(10),
  timestamp: new Date().toISOString(),
});
