//TODO SR : See if this file is truly necessary

import type { MetricsSnapshot } from "./types";

class MetricsCollector {
  private metrics: {
    [functionName: string]: {
      totalCalls: number;
      successfulCalls: number;
      failedCalls: number;
      totalDuration: number;
      lastError?: string;
      lastErrorTime?: string;
      callHistory: { timestamp: string; duration: number; success: boolean }[];
    };
  } = {};

  private maxHistorySize = 100;

  recordCall(
    functionName: string,
    duration: number,
    success: boolean,
    error?: string,
  ) {
    if (!this.metrics[functionName]) {
      this.metrics[functionName] = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        callHistory: [],
      };
    }

    const metric = this.metrics[functionName];
    metric.totalCalls++;
    metric.totalDuration += duration;

    if (success) {
      metric.successfulCalls++;
    } else {
      metric.failedCalls++;
      if (error) {
        metric.lastError = error;
        metric.lastErrorTime = new Date().toISOString();
      }
    }

    // Add to call history
    metric.callHistory.push({
      timestamp: new Date().toISOString(),
      duration,
      success,
    });

    // Limit history size
    if (metric.callHistory.length > this.maxHistorySize) {
      metric.callHistory = metric.callHistory.slice(-this.maxHistorySize);
    }
  }

  getSnapshot(
    functionName?: string,
  ): MetricsSnapshot | Record<string, MetricsSnapshot> {
    if (functionName) {
      const metric = this.metrics[functionName];
      if (!metric) {
        return {
          totalCalls: 0,
          successRate: 0,
          averageDuration: 0,
          errorRate: 0,
        };
      }

      return {
        totalCalls: metric.totalCalls,
        successRate:
          metric.totalCalls > 0
            ? (metric.successfulCalls / metric.totalCalls) * 100
            : 0,
        averageDuration:
          metric.totalCalls > 0 ? metric.totalDuration / metric.totalCalls : 0,
        errorRate:
          metric.totalCalls > 0
            ? (metric.failedCalls / metric.totalCalls) * 100
            : 0,
        lastError: metric.lastError,
        lastErrorTime: metric.lastErrorTime,
      };
    }

    // Return all metrics
    const result: Record<string, MetricsSnapshot> = {};
    for (const [name, metric] of Object.entries(this.metrics)) {
      result[name] = {
        totalCalls: metric.totalCalls,
        successRate:
          metric.totalCalls > 0
            ? (metric.successfulCalls / metric.totalCalls) * 100
            : 0,
        averageDuration:
          metric.totalCalls > 0 ? metric.totalDuration / metric.totalCalls : 0,
        errorRate:
          metric.totalCalls > 0
            ? (metric.failedCalls / metric.totalCalls) * 100
            : 0,
        lastError: metric.lastError,
        lastErrorTime: metric.lastErrorTime,
      };
    }
    return result;
  }

  getCallHistory(functionName: string, limit?: number) {
    const metric = this.metrics[functionName];
    if (!metric) return [];

    const history = metric.callHistory;
    return limit ? history.slice(-limit) : history;
  }

  reset(functionName?: string) {
    if (functionName) {
      delete this.metrics[functionName];
    } else {
      this.metrics = {};
    }
  }

  // Get performance percentiles
  getPercentiles(
    functionName: string,
    percentiles: number[] = [50, 90, 95, 99],
  ) {
    const metric = this.metrics[functionName];
    if (!metric || metric.callHistory.length === 0) {
      return {};
    }

    const durations = metric.callHistory
      .map((call) => call.duration)
      .sort((a, b) => a - b);

    const result: Record<string, number> = {};
    percentiles.forEach((p) => {
      const index = Math.ceil((p / 100) * durations.length) - 1;
      result[`p${p}`] = durations[Math.max(0, index)];
    });

    return result;
  }

  // Get error patterns
  getErrorPatterns(functionName?: string) {
    const functions = functionName ? [functionName] : Object.keys(this.metrics);
    const errorPatterns: Record<string, number> = {};

    functions.forEach((name) => {
      const metric = this.metrics[name];
      if (metric?.lastError) {
        errorPatterns[metric.lastError] =
          (errorPatterns[metric.lastError] || 0) + 1;
      }
    });

    return errorPatterns;
  }

  // Export data for external analysis
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      summary: this.getSnapshot(),
    };
  }
}

// Global metrics collector instance
const globalMetricsCollector = new MetricsCollector();

export function createMetricsCollector(): MetricsCollector {
  return new MetricsCollector();
}

export function getGlobalMetrics(): MetricsCollector {
  return globalMetricsCollector;
}

export { MetricsCollector };
