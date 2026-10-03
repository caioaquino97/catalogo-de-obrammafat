import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lista obras com busca, filtros e paginação',
  inputSchema: z.object({
    search: z.string().optional(),
    tipo: z.string().optional(),
    caixa: z.string().optional(),
    offset: z.number().optional(),
    limit: z.number().optional(),
  }),
  outputSchema: z.object({
    obras: z.array(z.any()),
    total: z.number(),
    hasMore: z.boolean(),
  }),
  execute: async ({ input }) => {
    const limit = input.limit || 50;
    const offset = input.offset || 0;
    const search = input.search?.trim();

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(`(
        "tTulo" ILIKE $${paramIdx} OR 
        "subtTulo" ILIKE $${paramIdx} OR 
        "autor1" ILIKE $${paramIdx} OR 
        "autor2" ILIKE $${paramIdx} OR 
        "editora" ILIKE $${paramIdx} OR
        "isbn" ILIKE $${paramIdx}
      )`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (input.tipo) {
      conditions.push(`"tipo" = $${paramIdx}`);
      params.push(input.tipo);
      paramIdx++;
    }

    if (input.caixa) {
      conditions.push(`"caixa" = $${paramIdx}`);
      params.push(input.caixa);
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await zite.sql({
      query: `SELECT COUNT(*) as total FROM "Obras" ${where}`,
      params,
    });
    const total = Number(countResult.rows[0]?.total || 0);

    const dataResult = await zite.sql({
      query: `SELECT * FROM "Obras" ${where} ORDER BY "item" ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      params: [...params, limit, offset],
    });

    return {
      obras: dataResult.rows,
      total,
      hasMore: offset + limit < total,
    };
  },
});
