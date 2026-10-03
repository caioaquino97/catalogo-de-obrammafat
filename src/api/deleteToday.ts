import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Remove todas as obras cadastradas no dia de hoje',
  inputSchema: z.object({}),
  outputSchema: z.object({
    deleted: z.number(),
  }),
  execute: async () => {
    const result = await zite.sql({
      query: `SELECT id FROM "Obras" WHERE created_at >= CURRENT_DATE AND created_at < CURRENT_DATE + INTERVAL '1 day'`,
    });

    let deleted = 0;
    for (const row of result.rows) {
      await zite.obras.delete({ id: String(row.id) });
      deleted++;
    }

    return { deleted };
  },
});
