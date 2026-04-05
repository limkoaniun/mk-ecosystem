/**
 * Placeholder HTTP client for core-request package
 * This will be expanded during the training program
 */

export interface ClientConfig {
  baseURL?: string;
  timeout?: number;
}

export interface RequestClient {
  request: (config: any) => Promise<any>;
}

/**
 * Creates a new HTTP client instance
 * @param config - Client configuration options
 * @returns Configured HTTP client
 */
export function createClient(_config?: ClientConfig): RequestClient {
  return {
    request: async () => {
      throw new Error('Not implemented yet - placeholder for training');
    },
  };
}

export { type ClientConfig as Config };