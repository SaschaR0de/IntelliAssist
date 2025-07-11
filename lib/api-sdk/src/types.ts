//TODO SR: See the exact API payload needed
export type MonitorPayload = {
  userId: string;
  chatId: string;
  name?: string;
  prompt: string;
  response: string;
  durationMs?: number;
  timestamp?: string;
  error?: boolean;
  errorMessage?: string;
  stackTrace?: string;
  metadata?: Record<string, any>;
  tokens?: number;
  requestTime?: number;
  environment?: string;
  version?: string;
};

/**
 * Configuration for each monitored function
 */
export type MonitorOptions<TArgs extends any[], TResult> = {
  name: string;
  capture: (ctx: { args: TArgs; result: TResult }) => {
    input: any;
    output: any;
    metadata?: Record<string, any>;
  };
  onError?: (
    error: any,
    args: TArgs,
  ) => {
    input: any;
    output: any;
    metadata?: Record<string, any>;
  };
  // May be deprecated if not needed
  enabled?: boolean | ((args: TArgs) => boolean);
  sampleRate?: number; // 0-1, percentage of calls to monitor
  timeout?: number; // Timeout for the API call
  retries?: number; // Number of retries for failed API calls
  tags?: Record<string, string>; // Additional tags for filtering
  sanitize?: boolean; // Whether to sanitize sensitive data
  priority?: "low" | "normal" | "high"; // Priority for batching
};

/**
 * Global SDK configuration
 */
export type SDKConfig = {
  apiKey: string;
  apiUrl?: string;
  environment?: string;
  userId?: string;
  chatId?: string;
  version?: string;
  batchSize?: number;
  batchTimeout?: number;
  retries?: number;
  timeout?: number;
  enableLocalStorage?: boolean;
  localStorageKey?: string;
  maxLocalStorageSize?: number;
  debug?: boolean;
  onError?: (error: Error) => void;
  sanitizePatterns?: RegExp[];
};

export type BatchRequest = {
  id: string;
  payload: MonitorPayload;
  timestamp: number;
  retries: number;
  priority: "low" | "normal" | "high";
};
// Don't know if there is one yet
export type APIResponse = {
  success: boolean;
  message?: string;
  errors?: string[];
};

export type MetricsSnapshot = {
  totalCalls: number;
  successRate: number;
  averageDuration: number;
  errorRate: number;
  lastError?: string;
  lastErrorTime?: string;
};

export type FilterFunction<TArgs extends any[]> = (args: TArgs) => boolean;

export type Middleware<TArgs extends any[], TResult> = {
  name: string;
  beforeCall?: (args: TArgs) => TArgs | Promise<TArgs>;
  afterCall?: (result: TResult, args: TArgs) => TResult | Promise<TResult>;
  onError?: (error: any, args: TArgs) => void | Promise<void>;
};
