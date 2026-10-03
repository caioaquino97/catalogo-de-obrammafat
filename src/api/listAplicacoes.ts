import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lista valores distintos de Aplicação já cadastrados',
  inputSchema: z.object({}),
  outputSchema: z.object({
    aplicacoes: z.array(z.string()),
  }),
  execute: async () => {
    const result = await zite.sql({
      query: `SELECT DISTINCT "aplicaO" FROM "Obras" WHERE "aplicaO" IS NOT NULL AND "aplicaO" != '' ORDER BY "aplicaO" ASC`,
    });
    const aplicacoes = result.rows.map(r => String(r.aplicaO));
    return { aplicacoes };
  },
});
