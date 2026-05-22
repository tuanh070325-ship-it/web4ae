import type { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import mysql from 'mysql2/promise';
import { initializeSchema, seedSchema } from './schema.js';

export interface DatabaseExecutor {
  execute<T extends ResultSetHeader = ResultSetHeader>(sql: string, params?: any[]): Promise<T>;
  query<T extends RowDataPacket = RowDataPacket>(sql: string, params?: any[]): Promise<T[]>;
  one<T extends RowDataPacket = RowDataPacket>(sql: string, params?: any[]): Promise<T | null>;
}

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy, DatabaseExecutor {
  private readonly logger = new Logger(DbService.name);
  private pool!: Pool;

  async onModuleInit() {
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'shopanime',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
      namedPlaceholders: false,
      timezone: 'Z',
    });

    await this.pool.query('SELECT 1');

    const syncSchema = isEnabled(process.env.DB_SYNC_SCHEMA) || isEnabled(process.env.DB_SYNCHRONIZE);
    const rebuildSchema = isEnabled(process.env.DB_REBUILD_SCHEMA);
    const seedEnabled = isEnabled(process.env.MOCK_DATA) || isEnabled(process.env.DB_SEED_ON_START);

    if (syncSchema || rebuildSchema) {
      await initializeSchema(this, { rebuild: rebuildSchema });
    }

    if (seedEnabled) {
      await seedSchema(this);
    }

    this.logger.log(`Connected to MySQL database "${process.env.DB_NAME || 'shopanime'}"`);
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async execute<T extends ResultSetHeader = ResultSetHeader>(sql: string, params: any[] = []) {
    const [result] = await this.pool.execute<T>(sql, params);
    return result;
  }

  async query<T extends RowDataPacket = RowDataPacket>(sql: string, params: any[] = []) {
    const [rows] = await this.pool.query<T[]>(sql, params);
    return rows;
  }

  async one<T extends RowDataPacket = RowDataPacket>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }

  async transaction<T>(callback: (db: DatabaseExecutor) => Promise<T>) {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(new ConnectionExecutor(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

class ConnectionExecutor implements DatabaseExecutor {
  constructor(private readonly connection: PoolConnection) {}

  async execute<T extends ResultSetHeader = ResultSetHeader>(sql: string, params: any[] = []) {
    const [result] = await this.connection.execute<T>(sql, params);
    return result;
  }

  async query<T extends RowDataPacket = RowDataPacket>(sql: string, params: any[] = []) {
    const [rows] = await this.connection.query<T[]>(sql, params);
    return rows;
  }

  async one<T extends RowDataPacket = RowDataPacket>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] ?? null;
  }
}

function isEnabled(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value || '').toLowerCase());
}
