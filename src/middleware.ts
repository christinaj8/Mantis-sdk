import { Request, Response, NextFunction } from 'express';
import MantisClient from './mantisClient';

export type MetricFunction = (
  req: Request,
  res: Response,
  start: [number, number]
) => Promise<{ name: string; value: number } | null>;

export interface MantisMiddlewareOptions {
  metrics?: MetricFunction[]; // Optional custom metric functions
}

let requestCount = 0; // Tracks total requests
let errorCount = 0; // Tracks total error responses
let startTime = Date.now(); // Tracks the start time for RPS calculation

export function mantisMiddleware(
  auth: { apiKey?: string; token?: string; authProvider?: 'google' | 'github' },
  options?: MantisMiddlewareOptions
) {
  // Ensure at least one authentication method is provided
  if (!auth.apiKey && (!auth.token || !auth.authProvider)) {
    throw new Error(
      'Either an API key or an OAuth token with provider must be provided.'
    );
  }

  // Initialize MantisClient with the provided auth credentials
  const client = new MantisClient(auth);

  return async (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime(); // Start timing when request begins
    requestCount++; // Increment total request count

    res.on('finish', async () => {
      try {
        // 🔹 New Default Metrics
        const newMetrics: MetricFunction[] = [
          // Latency in milliseconds
          async (req, res, start) => ({
            name: 'latency_ms',
            value: process.hrtime(start)[1] / 1e6, // Convert nanoseconds to milliseconds
          }),

          // Requests per second (RPS)
          async () => {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            return {
              name: 'requests_per_second',
              value: requestCount / elapsedSeconds, // Total requests divided by elapsed time
            };
          },

          // Error rate (% of total requests that resulted in error responses)
          async (req, res) => {
            if (res.statusCode >= 400) errorCount++; // Count errors if status code is 400+
            return {
              name: 'error_rate',
              value: (errorCount / requestCount) * 100, // Error rate percentage
            };
          },
        ];

        // Merge user-defined metrics (if any) with default metrics
        const allMetrics = [...(options?.metrics || []), ...newMetrics];

        // Iterate through all metrics and send them to Mantis
        for (const metricFunction of allMetrics) {
          const metric = await metricFunction(req, res, start);
          if (metric) {
            await client.sendMetric(metric.name, metric.value);
          }
        }
      } catch (error) {
        console.error('Mantis Middleware Error:', error);
      }
    });

    next();
  };
}
