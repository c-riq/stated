import { PoolClient, Pool } from "pg"

export const transaction = async (cb: (client: PoolClient) => void, pool: Pool) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    try {
      await cb(client);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
    }
  } finally {
    client.release();
  }
};
