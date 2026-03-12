/**
 * Snowflake client for latency measurement.
 *
 * Connects to the Snowflake DB that receives DealCloud sync data and polls
 * for recently-pushed records so we can measure sync latency.
 *
 * Required env vars:
 *   SNOWFLAKE_ACCOUNT      e.g. xy12345.us-east-1
 *   SNOWFLAKE_USERNAME
 *   SNOWFLAKE_PASSWORD
 *   SNOWFLAKE_DATABASE
 *   SNOWFLAKE_SCHEMA       (defaults to PUBLIC)
 *   SNOWFLAKE_WAREHOUSE
 *
 * Optional env vars:
 *   SNOWFLAKE_TABLE        default table to query (e.g. COMPANY)
 */

// snowflake-sdk is server-only (Node.js runtime)
import snowflake from 'snowflake-sdk';

export interface SnowflakeConfig {
  account: string;
  username: string;
  password: string;
  database: string;
  schema: string;
  warehouse: string;
}

function getConfig(): SnowflakeConfig {
  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USERNAME;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const database = process.env.SNOWFLAKE_DATABASE;
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;

  if (!account || !username || !password || !database || !warehouse) {
    throw new Error(
      'Missing required Snowflake env vars: SNOWFLAKE_ACCOUNT, SNOWFLAKE_USERNAME, SNOWFLAKE_PASSWORD, SNOWFLAKE_DATABASE, SNOWFLAKE_WAREHOUSE',
    );
  }

  return {
    account,
    username,
    password,
    database,
    schema: process.env.SNOWFLAKE_SCHEMA ?? 'PUBLIC',
    warehouse,
  };
}

function createConnection(config: SnowflakeConfig): snowflake.Connection {
  return snowflake.createConnection({
    account: config.account,
    username: config.username,
    password: config.password,
    database: config.database,
    schema: config.schema,
    warehouse: config.warehouse,
  });
}

function connectAsync(connection: snowflake.Connection): Promise<void> {
  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function executeAsync(
  connection: snowflake.Connection,
  sql: string,
  binds: snowflake.Binds = [],
): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: sql,
      binds,
      complete: (err, _stmt, rows) => {
        if (err) reject(err);
        else resolve((rows ?? []) as Record<string, unknown>[]);
      },
    });
  });
}

function destroyAsync(connection: snowflake.Connection): Promise<void> {
  return new Promise((resolve) => {
    connection.destroy(() => resolve());
  });
}

/** Run a single query and return all rows. Opens/closes the connection. */
export async function runQuery(
  sql: string,
  binds: snowflake.Binds = [],
): Promise<Record<string, unknown>[]> {
  const config = getConfig();
  const connection = createConnection(config);
  await connectAsync(connection);
  try {
    return await executeAsync(connection, sql, binds);
  } finally {
    await destroyAsync(connection);
  }
}

/** Test that credentials and connectivity are valid. */
export async function testSnowflakeConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const rows = await runQuery('SELECT CURRENT_VERSION() AS VERSION');
    const version = rows[0]?.VERSION ?? 'unknown';
    return { success: true, message: `Connected. Snowflake version: ${version}` };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export interface PollResult {
  found: boolean;
  row?: Record<string, unknown>;
  elapsedMs?: number;
  searchedAt: string;
}

/**
 * Poll a Snowflake table for a record matching an identifier value.
 *
 * @param table     Fully-qualified or bare table name (e.g. COMPANY or DB.SCHEMA.COMPANY)
 * @param column    Column to search in (e.g. NAME or COMPANY_NAME)
 * @param value     Exact value to match (ILIKE used for case-insensitive match)
 * @param pushTime  ISO timestamp of when the record was pushed to DealCloud
 */
export async function pollForRecord(
  table: string,
  column: string,
  value: string,
  pushTime: string,
): Promise<PollResult> {
  const searchedAt = new Date().toISOString();

  // Sanitize table/column names — only allow alphanumeric, underscores, dots
  if (!/^[\w.]+$/.test(table)) throw new Error('Invalid table name');
  if (!/^\w+$/.test(column)) throw new Error('Invalid column name');

  const sql = `SELECT * FROM ${table} WHERE ${column} ILIKE ? LIMIT 1`;
  const rows = await runQuery(sql, [value]);

  if (rows.length === 0) {
    return { found: false, searchedAt };
  }

  const pushMs = new Date(pushTime).getTime();
  const foundMs = Date.now();
  return {
    found: true,
    row: rows[0],
    elapsedMs: foundMs - pushMs,
    searchedAt,
  };
}
