import axios from 'axios';

export class MantisClient {
  private token: string | null;
  private apiKey: string | null;
  private authProvider: 'google' | 'github' | null;
  private apiUrl: string;

  // Default API URL
  private static readonly DEFAULT_API_URL =
    'https://mantis-backend.onrender.com';

  /**
   * Initialize MantisClient with either an API key or an OAuth token.
   *
   * @param options - Authentication options
   * @param options.apiKey - API key for users with username/password login
   * @param options.token - OAuth token for users logging in via Google/GitHub
   * @param options.authProvider - The OAuth provider (`google` or `github`)
   * @param options.apiUrl - The Mantis backend URL (default: production)
   */
  constructor({
    apiKey = null,
    token = null,
    authProvider = null,
    apiUrl = process?.env?.MANTIS_API_URL || MantisClient.DEFAULT_API_URL,
  }: {
    apiKey?: string | null;
    token?: string | null;
    authProvider?: 'google' | 'github' | null;
    apiUrl?: string;
  }) {
    if (!apiKey && (!token || !authProvider)) {
      throw new Error(
        'Either an API key or an OAuth token with provider must be provided.'
      );
    }

    this.apiKey = apiKey;
    this.token = token;
    this.authProvider = authProvider;
    this.apiUrl = apiUrl;
  }

  /**
   * Sends a metric to the Mantis backend.
   *
   * @param metric - The name of the metric (e.g., 'requests_per_second')
   * @param value - The value of the metric
   */
  async sendMetric(metric: string, value: number): Promise<void> {
    try {
      const headers: Record<string, string> = {};

      if (this.apiKey) {
        headers['X-API-Key'] = this.apiKey;
      } else if (this.token && this.authProvider) {
        headers['Authorization'] = `Bearer ${this.token}`;
        headers['X-Auth-Provider'] = this.authProvider;
      }

      await axios.post(
        `${this.apiUrl}/metrics`,
        { metric, value },
        { headers }
      );

      console.log(`Successfully sent metric: ${metric}=${value}`);
    } catch (error) {
      console.error('Error sending metric:', error);
    }
  }
}

export default MantisClient;
