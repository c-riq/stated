import { PoolClient, Pool } from "pg"

export const transaction = async (cb: (client: PoolClient) => void, pool: Pool) => {
  const client = await pool.connect();
  client.on("error", (error) => {
    console.log("pg client error: ", error);
    console.trace();
  });
  try {
    await client.query("BEGIN");
    try {
      await cb(client);
      await client.query("COMMIT");
    } catch (error) {
      console.log(error);
      console.trace();
      await client.query("ROLLBACK");
    }
  } finally {
    client.release();
  }
};
