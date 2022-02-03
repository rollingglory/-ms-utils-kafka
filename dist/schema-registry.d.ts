import { OnModuleInit } from '@nestjs/common';
export declare class SchemaRegistryManager implements OnModuleInit {
    private readonly logger;
    private ConsumerSchemas;
    private ProducerSchemas;
    private schemaRegistry;
    constructor({ producerSchemas, consumerSchemas, }: {
        producerSchemas: any[];
        consumerSchemas: any[];
    });
    onModuleInit(): Promise<void>;
    private registerProducerSchema;
    private registerConsumerSchema;
    private registerSchema;
}
