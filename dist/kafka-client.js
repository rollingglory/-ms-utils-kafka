"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ClientKafkaProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientKafkaProvider = void 0;
const confluent_schema_registry_1 = require("@kafkajs/confluent-schema-registry");
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const fs_1 = require("fs");
const path_1 = require("path");
const rxjs_1 = require("rxjs");
let ClientKafkaProvider = ClientKafkaProvider_1 = class ClientKafkaProvider extends microservices_1.ClientKafka {
    constructor(options) {
        super(options);
        this.producerPath = options.producerPath;
        this.plogger = new common_1.Logger(ClientKafkaProvider_1.name);
        const { SCHEMA_REGISTRY_HOST, SCHEMA_REGISTRY_USERNAME, SCHEMA_REGISTRY_PASSWORD, } = process.env || {};
        this.schemaRegistry = new confluent_schema_registry_1.SchemaRegistry({
            host: SCHEMA_REGISTRY_HOST,
            auth: {
                username: SCHEMA_REGISTRY_USERNAME,
                password: SCHEMA_REGISTRY_PASSWORD,
            },
        });
    }
    send(pattern, data) {
        return (0, rxjs_1.from)(this.encode(pattern, data)).pipe((0, rxjs_1.switchMap)((encodedMessage) => super.send(pattern, encodedMessage).pipe((0, rxjs_1.map)((emitResult) => {
            this.plogger.debug({ emit: emitResult });
            return emitResult;
        }))));
    }
    emit(pattern, data) {
        return (0, rxjs_1.from)(this.encode(pattern, data)).pipe((0, rxjs_1.switchMap)((encodedMessage) => super.emit(pattern, encodedMessage).pipe((0, rxjs_1.map)((emitResult) => {
            this.plogger.debug({ emit: emitResult });
            return emitResult;
        }))));
    }
    async encode(topic, payload) {
        const rawSchema = (0, fs_1.readFileSync)((0, path_1.resolve)(this.producerPath, `${topic}.json`));
        const schema = JSON.stringify(JSON.parse(rawSchema));
        const id = await this.schemaRegistry.getRegistryIdBySchema(`${topic}-value`, { schema, type: confluent_schema_registry_1.SchemaType.AVRO });
        return this.schemaRegistry.encode(+id, payload);
    }
    async decode(message) {
        if (Buffer.isBuffer(message)) {
            return this.schemaRegistry.decode(message);
        }
        if (typeof message === 'object' && message.value) {
            const messageObject = Buffer.isBuffer(message.value)
                ? await this.schemaRegistry.decode(message.value)
                : message.value;
            this.plogger.debug(messageObject, `${message.topic}, offset: ${message.offset}`);
            return messageObject;
        }
        return message;
    }
};
ClientKafkaProvider = ClientKafkaProvider_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [Object])
], ClientKafkaProvider);
exports.ClientKafkaProvider = ClientKafkaProvider;
//# sourceMappingURL=kafka-client.js.map