/**
 * Custom hook for droplet creation functionality
 */

import { useState, useCallback } from 'react';
import { apiClient, DropletConfigurationRequest, DropletCreationResponse } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';

export interface UseDropletCreationReturn {
  createDroplet: (userInput: string, projectName?: string) => Promise<DropletCreationResponse>;
  analyzeInput: (userInput: string) => Promise<DropletCreationResponse>;
  isLoading: boolean;
  error: string | null;
  lastResponse: DropletCreationResponse | null;
}

export function useDropletCreation(): UseDropletCreationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<DropletCreationResponse | null>(null);
  const { getToken } = useAuth();

  const createDroplet = useCallback(async (
    userInput: string,
    projectName?: string
  ): Promise<DropletCreationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const request: DropletConfigurationRequest = {
        user_input: userInput,
        project_name: projectName,
      };

      const response = await apiClient.createDropletFromChat(request, token);
      
      console.log(`[Frontend] Received droplet creation response:`, {
        success: response.success,
        droplet_id: response.droplet_id,
        droplet_name: response.droplet_name,
        droplet_status: response.droplet_status
      });
      
      // Save droplet to database if creation was successful
      if (response.success && response.droplet_id) {
        console.log(`[Frontend] Saving droplet to database with ID: ${response.droplet_id}`);
        try {
          const dbResponse = await fetch('/api/droplets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              dropletId: response.droplet_id,
              dropletName: response.droplet_name,
              dropletStatus: response.droplet_status,
              region: response.analysis?.extracted_region || 'tor1',
              size: response.analysis?.extracted_size || 's-2vcpu-4gb',
              image: response.analysis?.extracted_image || 'ubuntu-25-04-x64',
              ipAddress: null,
              projectName: projectName,
              userInput: userInput,
              costPerHour: null,
              durationMinutes: response.duration_minutes || 30
            })
          });
          
          if (dbResponse.ok) {
            const dbData = await dbResponse.json();
            console.log(`[Frontend] Successfully saved droplet to database:`, dbData);
          } else {
            const errorData = await dbResponse.json().catch(() => ({}));
            console.error(`[Frontend] Failed to save droplet to database:`, errorData);
          }
        } catch (dbError) {
          console.error('[Frontend] Error saving droplet to database:', dbError);
          // Don't fail the whole operation if database save fails
        }
      }
      
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const analyzeInput = useCallback(async (
    userInput: string
  ): Promise<DropletCreationResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await apiClient.analyzeInput(userInput, token);
      setLastResponse(response);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  return {
    createDroplet,
    analyzeInput,
    isLoading,
    error,
    lastResponse,
  };
}
