import { HttpService } from '@nestjs/axios';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as CircuitBreaker from 'opossum';
import { SafeRequest } from './safe-request.abstract';
declare type CONFIG = AxiosRequestConfig & {
    circuitBreaker?: CircuitBreaker.Options;
};
export declare class SafeRequestService implements SafeRequest {
    private readonly httpService;
    private logger;
    constructor(httpService: HttpService);
    get<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
    delete<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
    head<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>>;
    post<T>(url: string, data?: unknown, config?: CONFIG): Promise<AxiosResponse<T>>;
    put<T>(url: string, data?: unknown, config?: CONFIG): Promise<AxiosResponse<T>>;
    patch<T>(url: string, data?: unknown, config?: CONFIG): Promise<AxiosResponse<T>>;
    private request;
    private fireCircuitBreaker;
}
export {};
