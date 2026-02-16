import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';
import { DatabaseService } from './database.service';

export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export const MONGO_CLIENT = 'MONGO_CLIENT';

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      useFactory: async (configService: ConfigService): Promise<MongoClient> => {
        const uri = configService.get<string>('mongodb.uri');
        const client = new MongoClient(uri);
        await client.connect();
        return client;
      },
      inject: [ConfigService],
    },
    {
      provide: DATABASE_CONNECTION,
      useFactory: (client: MongoClient): Db => {
        return client.db();
      },
      inject: [MONGO_CLIENT],
    },
    DatabaseService,
  ],
  exports: [DATABASE_CONNECTION, DatabaseService],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onModuleDestroy() {
    await this.client.close();
  }
}
