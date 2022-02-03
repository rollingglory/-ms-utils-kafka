import { SchemaRegistry } from '@kafkajs/confluent-schema-registry';
import { Logger, OnModuleInit } from '@nestjs/common';

export class SchemaRegistryManager implements OnModuleInit {
  private readonly logger: Logger;

  private ConsumerSchemas;

  private ProducerSchemas;

  private schemaRegistry: SchemaRegistry;

  constructor({
    producerSchemas,
    consumerSchemas,
  }: {
    producerSchemas: any[];
    consumerSchemas: any[];
  }) {
    this.ConsumerSchemas = consumerSchemas;
    this.ProducerSchemas = producerSchemas;
    this.logger = new Logger(SchemaRegistryManager.name);
  }

  async onModuleInit(): Promise<void> {
    const {
      SCHEMA_REGISTRY_HOST,
      SCHEMA_REGISTRY_USERNAME,
      SCHEMA_REGISTRY_PASSWORD,
    } = process.env || {};
    this.schemaRegistry = new SchemaRegistry({
      host: SCHEMA_REGISTRY_HOST,
      auth: {
        username: SCHEMA_REGISTRY_USERNAME,
        password: SCHEMA_REGISTRY_PASSWORD,
      },
    });
    await Promise.all([
      this.registerConsumerSchema(),
      this.registerProducerSchema(),
    ]);
  }

  private async registerProducerSchema(): Promise<void> {
    await Promise.all(
      this.ProducerSchemas.map(async (schema) => {
        await this.registerSchema(schema);
      }),
    );
  }

  private async registerConsumerSchema(): Promise<void> {
    await Promise.all(
      this.ConsumerSchemas.map(async (schema) => {
        await this.registerSchema(schema);
      }),
    );
  }

  private async registerSchema(schema) {
    const { name, namespace } = schema || {};
    if (!name || !namespace) {
      return;
    }
    const { id } = await this.schemaRegistry
      .register(schema, { subject: `${namespace}.${name}-value` })
      .catch((e) => {
        this.logger.error(
          `Error Schema Register of ${namespace}.${name} : \n${e}`,
        );
        return { id: 0 };
      });
    this.logger.log(`Register schema of ${namespace}.${name} with ID ${id}`);
  }
}
