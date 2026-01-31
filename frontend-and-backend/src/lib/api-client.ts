/**
 * API client for communicating with the Python DigitalOcean NLP Parser backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DropletConfigurationRequest {
  user_input: string;
  user_id?: string;
  project_name?: string;
}

export interface DropletCreationResponse {
  success: boolean;
  message: string;
  droplet_id?: number;
  droplet_name?: string;
  droplet_status?: string;
  duration_minutes?: number;
  analysis?: {
    raw_input: string;
    extracted_name: string | null;
    extracted_region: string | null;
    extracted_size: string | null;
    extracted_image: string | null;
    extracted_env_type?: string | null;
    extracted_env_types?: string[] | null;
    extracted_duration_minutes?: number | null;
    confidence_score: number;
    missing_parameters: string[];
    suggestions: string[];
  };
  error?: string;
}

export interface AvailableOptions {
  regions: Array<{ value: string; name: string }>;
  sizes: Array<{ value: string; name: string }>;
  images: Array<{ value: string; name: string }>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.detail || 
        errorData.message || 
        `HTTP error! status: ${response.status}`
      );
    }

    return response.json();
  }

  /**
   * Create a droplet from chat input
   */
  async createDropletFromChat(
    request: DropletConfigurationRequest,
    authToken: string
  ): Promise<DropletCreationResponse> {
    return this.makeRequest<DropletCreationResponse>(
      '/create-droplet-from-chat',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(request),
      }
    );
  }

  /**
   * Analyze user input without creating a droplet
   */
  async analyzeInput(
    userInput: string,
    authToken: string
  ): Promise<DropletCreationResponse> {
    return this.makeRequest<DropletCreationResponse>(
      '/analyze',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          user_input: userInput,
          api_token: 'dummy', // Not used in authenticated endpoint
        }),
      }
    );
  }

  /**
   * Get available options for droplet creation
   */
  async getAvailableOptions(): Promise<AvailableOptions> {
    return this.makeRequest<AvailableOptions>('/available-options');
  }

  /**
   * Delete a droplet
   */
  async deleteDroplet(
    dropletId: number,
    authToken: string
  ): Promise<{ success: boolean; message: string; droplet_id?: number; error?: string }> {
    return this.makeRequest<{ success: boolean; message: string; droplet_id?: number; error?: string }>(
      `/delete-droplet/${dropletId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    return this.makeRequest<{ status: string; service: string }>('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
