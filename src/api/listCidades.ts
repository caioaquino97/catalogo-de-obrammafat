import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lista valores distintos de Cidade já cadastrados',
  inputSchema: z.object({}),
  outputSchema: z.object({
    cidades: z.array(z.string()),
  }),
  execute: async () => {
    const result = await zite.sql({
      query: `SELECT DISTINCT "cidade" FROM "Obras" WHERE "cidade" IS NOT NULL AND "cidade" != '' ORDER BY "cidade" ASC`,
    });
    const cidades = result.rows.map(r => String(r.cidade));
    return { cidades };
  },
});
