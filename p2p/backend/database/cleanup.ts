import { Pool } from "pg";
import { DBCallback } from ".";

export const deleteSupersededDerivedEntitiesFactory =
  (pool: Pool) =>
  () =>
    new Promise((resolve: DBCallback<any>, reject) => {
      try {
        pool.query(
          `
        delete from organisation_verifications where statement_hash in (select hash_b64 from statement_with_superseding
            where superseding_statement is not null);
        delete from person_verifications where statement_hash in (select hash_b64 from statement_with_superseding
            where superseding_statement is not null);
        delete from votes where statement_hash in (select hash_b64 from statement_with_superseding
            where superseding_statement is not null);
        delete from ratings where statement_hash in (select hash_b64 from statement_with_superseding
            where superseding_statement is not null);
                  `,
          (error, results) => {
            if (error) {
              console.log(error);
              console.trace();
              return reject(error);
            } else {
              return resolve(results);
            }
          }
        );
      } catch (error) {
        console.log(error);
        console.trace();
        return reject(error);
      }
    });
