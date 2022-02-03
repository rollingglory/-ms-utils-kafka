/// <reference types="node" />
import { ClientKafka, KafkaOptions } from '@nestjs/microservices';
import { Observable } from 'rxjs';
export declare class ClientKafkaProvider extends ClientKafka {
    private readonly plogger;
    private readonly producerPath;
    private schemaRegistry;
    constructor(options: KafkaOptions['options'] & {
        producerPath: string;
    });
    send<TResult = any, TInput = any>(pattern: any, data: TInput): Observable<TResult>;
    emit<TResult = any, TInput = any>(pattern: any, data: TInput): Observable<TResult>;
    private encode;
    decode(message: Buffer | string | Record<string, unknown>): Promise<any>;
}
