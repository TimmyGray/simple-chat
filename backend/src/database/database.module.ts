import { Global, Inject, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';
import { DatabaseService } from './database.service';
import { DATABASE_CONNECTION, MONGO_CLIENT } from './database.constants';

@Global()
@Module({
  providers: [
    {
      provide: MONGO_CLIENT,
      useFactory: async (
        configService: ConfigService,
      ): Promise<MongoClient> => {
        const uri = configService.get<string>('mongodb.uri');
        if (!uri) throw new Error('MongoDB URI not configured');
        const client = new MongoClient(uri, {
          minPoolSize: configService.get<number>('mongodb.poolSizeMin', 2),
          maxPoolSize: configService.get<number>('mongodb.poolSizeMax', 10),
        });
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
  exports: [DATABASE_CONNECTION, MONGO_CLIENT, DatabaseService],
})
export class DatabaseModule implements OnModuleDestroy {
  constructor(@Inject(MONGO_CLIENT) private readonly client: MongoClient) {}

  async onModuleDestroy() {
    await this.client.close();
  }
}
