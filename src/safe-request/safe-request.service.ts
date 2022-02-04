import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as CircuitBreaker from 'opossum';
import { lastValueFrom } from 'rxjs';
import urljoin from 'url-join';
import { SafeRequest } from './safe-request.abstract';

type CONFIG = AxiosRequestConfig & { circuitBreaker?: CircuitBreaker.Options };

/**
 * make axios request with circuit breaker pattern
 */
@Injectable()
export class SafeRequestService implements SafeRequest {
  private logger: Logger;

  constructor(private readonly httpService: HttpService) {
    this.logger = new Logger('CIRCUIT BREAKER');
  }

  /**
   * get request for with axios
   * @param {string} url
   * @param {CONFIG} config config.circuitBreaker is config for circuit breaker
   * @returns
   */
  async get<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>> {
    return this.request<T>(url, { ...config, method: 'get' });
  }

  async delete<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  head<T>(url: string, config?: CONFIG): Promise<AxiosResponse<T>> {
    return this.request<T>(url, { ...config, method: 'HEAD' });
  }

  post<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(url, data, { ...config, method: 'POST' });
  }

  put<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(url, data, { ...config, method: 'PUT' });
  }

  patch<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>(url, data, { ...config, method: 'PATCH' });
  }

  /**
   * make axios request with add to circuit breaker
   * @param url
   * @param config
   */
  private async request<T>(
    url: string,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>>;
  private async request<T>(
    url: string,
    data?: unknown,
    config?: CONFIG,
  ): Promise<AxiosResponse<T>>;
  private async request<T>(...args: any[]): Promise<AxiosResponse<T>> {
    const { circuitBreaker = {}, ...axiosConfig } = args.at(-1) || {};
    const { method, baseUrl } = axiosConfig || {};
    const fullUrl = baseUrl ? urljoin(baseUrl, args[0]) : args[0];
    const request = lastValueFrom(this.httpService[method]<T>(...args));

    return this.fireCircuitBreaker(
      fullUrl,
      request as Promise<AxiosResponse<T>>,
      circuitBreaker,
    );
  }

  /**
   * add request to circuit breaker
   * with listener of state each request to url
   * only request that return `5xx` that can make circuit breaker fail
   * @param fullUrl for logging purpose which url that has failed state
   * @param request
   * @param options
   * @returns
   */
  private async fireCircuitBreaker<T>(
    fullUrl: string,
    request: Promise<AxiosResponse<T>>,
    options: CircuitBreaker.Options = {},
  ): Promise<AxiosResponse<T>> {
    const url = fullUrl;
    const cb = new CircuitBreaker(() => request, {
      errorFilter: (err) => {
        if (err.response?.status < 500) {
          return true;
        }
        return false;
      },
      ...options,
    });

    cb.on('reject', () => {
      this.logger.error(`REJECT: ${url}`);
    })
      .on('open', () =>
        this.logger.error(`OPEN: The cb for ${url} just opened.`),
      )
      .on('timeout', () =>
        this.logger.error(`TIMEOUT: ${url} is taking too long to respond.`),
      )
      .on('halfOpen', () =>
        this.logger.warn(`HALF_OPEN: The cb for ${url}  is half open.`),
      )
      .on('close', () =>
        this.logger.log(`CLOSE: The cb for ${url} has closed. Service OK.`),
      );

    // cb.on('reject',
    //   (e) => {
    //     console.log(e);
    //     console.log('REJECTED: The cb for  is open. Failing fast.');
    //   });

    // cb.on('fallback',
    //   (data) => console.log(`FALLBACK: ${JSON.stringify(data)}`));
    return cb.fire();
  }
}
