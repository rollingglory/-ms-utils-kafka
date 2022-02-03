"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchemaRegistryManager = void 0;
const confluent_schema_registry_1 = require("@kafkajs/confluent-schema-registry");
const common_1 = require("@nestjs/common");
class SchemaRegistryManager {
    constructor({ producerSchemas, consumerSchemas, }) {
        this.ConsumerSchemas = consumerSchemas;
        this.ProducerSchemas = producerSchemas;
        this.logger = new common_1.Logger(SchemaRegistryManager.name);
    }
    async onModuleInit() {
        const { SCHEMA_REGISTRY_HOST, SCHEMA_REGISTRY_USERNAME, SCHEMA_REGISTRY_PASSWORD, } = process.env || {};
        this.schemaRegistry = new confluent_schema_registry_1.SchemaRegistry({
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
    async registerProducerSchema() {
        await Promise.all(this.ProducerSchemas.map(async (schema) => {
            await this.registerSchema(schema);
        }));
    }
    async registerConsumerSchema() {
        await Promise.all(this.ConsumerSchemas.map(async (schema) => {
            await this.registerSchema(schema);
        }));
    }
    async registerSchema(schema) {
        const { name, namespace } = schema || {};
        if (!name || !namespace) {
            return;
        }
        const { id } = await this.schemaRegistry
            .register(schema, { subject: `${namespace}.${name}-value` })
            .catch((e) => {
            this.logger.error(`Error Schema Register of ${namespace}.${name} : \n${e}`);
            return { id: 0 };
        });
        this.logger.log(`Register schema of ${namespace}.${name} with ID ${id}`);
    }
}
exports.SchemaRegistryManager = SchemaRegistryManager;
//# sourceMappingURL=schema-registry.js.map