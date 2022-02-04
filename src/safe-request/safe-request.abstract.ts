import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as CircuitBreaker from 'opossum';

type CONFIG = AxiosRequestConfig & { circuitBreaker?: CircuitBreaker.Options };

export abstract class SafeRequest {
  abstract get<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
  abstract delete<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
  abstract head<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
  abstract patch<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>>;
  abstract put<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>>;
  abstract post<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>>;
}
