import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Estatísticas do catálogo para organização de prateleira',
  inputSchema: z.object({}),
  outputSchema: z.object({
    total: z.number(),
    porTipo: z.array(z.object({ name: z.string(), value: z.number() })),
    porCaixa: z.array(z.object({ name: z.string(), value: z.number() })),
    porCidade: z.array(z.object({ name: z.string(), value: z.number() })),
    porDecada: z.array(z.object({ name: z.string(), value: z.number() })),
    caixasSemTipo: z.array(z.object({ caixa: z.string(), total: z.number() })),
  }),
  execute: async () => {
    const [totalRes, tipoRes, caixaRes, cidadeRes, decadaRes, caixaSemTipoRes] = await Promise.all([
      zite.sql({ query: `SELECT COUNT(*) AS total FROM "Obras"` }),

      zite.sql({
        query: `SELECT COALESCE("tipo", 'Sem tipo') AS name, COUNT(*) AS value FROM "Obras" GROUP BY "tipo" ORDER BY value DESC`,
      }),

      zite.sql({
        query: `SELECT COALESCE("caixa", 'Sem caixa') AS name, COUNT(*) AS value FROM "Obras" GROUP BY "caixa" ORDER BY value DESC`,
      }),

      zite.sql({
        query: `SELECT COALESCE("cidade", 'Sem cidade') AS name, COUNT(*) AS value FROM "Obras" GROUP BY "cidade" ORDER BY value DESC LIMIT 15`,
      }),

      zite.sql({
        query: `SELECT
          CASE
            WHEN "ano" IS NULL THEN 'Sem ano'
            ELSE (FLOOR("ano" / 10) * 10)::text || 's'
          END AS name,
          COUNT(*) AS value
        FROM "Obras"
        GROUP BY 1
        ORDER BY 1 ASC`,
      }),

      zite.sql({
        query: `SELECT COALESCE("caixa", 'SC') AS caixa, COUNT(*) AS total FROM "Obras" WHERE "tipo" IS NULL OR "tipo" = '' GROUP BY "caixa" ORDER BY total DESC`,
      }),
    ]);

    return {
      total: Number(totalRes.rows[0]?.total ?? 0),
      porTipo: tipoRes.rows.map(r => ({ name: String(r.name), value: Number(r.value) })),
      porCaixa: caixaRes.rows.map(r => ({ name: String(r.name), value: Number(r.value) })),
      porCidade: cidadeRes.rows.map(r => ({ name: String(r.name), value: Number(r.value) })),
      porDecada: decadaRes.rows.map(r => ({ name: String(r.name), value: Number(r.value) })),
      caixasSemTipo: caixaSemTipoRes.rows.map(r => ({ caixa: String(r.caixa), total: Number(r.total) })),
    };
  },
});
