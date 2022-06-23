import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { Injectable, Logger } from '@nestjs/common';
import { ClientKafka, KafkaOptions } from '@nestjs/microservices';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { from, map, Observable, switchMap } from 'rxjs';

@Injectable()
export class ClientKafkaProvider extends ClientKafka {
  private readonly plogger: Logger;

  private readonly producerPath: string = 'asdg';

  private schemaRegistry: SchemaRegistry;

  constructor(options: KafkaOptions['options'] & { producerPath: string }) {
    super(options);
    this.producerPath = options.producerPath;
    this.plogger = new Logger(ClientKafkaProvider.name);

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
  }

  override send<TResult = any, TInput = any>(
    pattern: any,
    data: TInput,
  ): Observable<TResult> {
    return from(this.encode(pattern, data)).pipe(
      switchMap((encodedMessage) =>
        super.send<TResult, TInput>(pattern, encodedMessage as any).pipe(
          map((emitResult) => {
            this.plogger.debug({ emit: emitResult });
            return emitResult;
          }),
        ),
      ),
    );
  }

  override emit<TResult = any, TInput = any>(
    pattern: any,
    data: TInput,
  ): Observable<TResult> {
    return from(this.encode(pattern, data)).pipe(
      switchMap((encodedMessage) =>
        super.emit<TResult, TInput>(pattern, encodedMessage as any).pipe(
          map((emitResult) => {
            this.plogger.debug({ emit: emitResult });
            return emitResult;
          }),
        ),
      ),
    );
  }

  private async encode(topic: string, payload: any) {
    const rawSchema: any = readFileSync(
      resolve(this.producerPath, `${topic}.json`),
    );
    const schema = JSON.stringify(JSON.parse(rawSchema));
    const id = await this.schemaRegistry.getRegistryIdBySchema(
      `${topic}-value`,
      { schema, type: SchemaType.AVRO },
    );

    return this.schemaRegistry.encode(+id, payload);
  }

  async decode(
    message: Buffer | string | Record<string, unknown>,
  ): Promise<any> {
    if (Buffer.isBuffer(message)) {
      return this.schemaRegistry.decode(message);
    }

    if (typeof message === 'object' && message.value) {
      const messageObject = Buffer.isBuffer(message.value)
        ? await this.schemaRegistry.decode(message.value)
        : message.value;

      this.plogger.debug(
        messageObject,
        `${message.topic}, offset: ${message.offset}`,
      );

      return messageObject;
    }
    return message;
  }
}
