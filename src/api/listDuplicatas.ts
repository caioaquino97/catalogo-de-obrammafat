import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Lista obras duplicadas (mesmo título e autor1)',
  inputSchema: z.object({}),
  outputSchema: z.object({
    groups: z.array(z.object({
      tTulo: z.string(),
      autor1: z.string(),
      obras: z.array(z.object({
        id: z.string(),
        tTulo: z.string().optional(),
        subtTulo: z.string().optional(),
        autor1: z.string().optional(),
        autor2: z.string().optional(),
        autor3: z.string().optional(),
        ediO: z.string().optional(),
        cidade: z.string().optional(),
        editora: z.string().optional(),
        ano: z.number().optional(),
        volume: z.string().optional(),
        isbn: z.string().optional(),
        tipo: z.string().optional(),
        observaEs: z.string().optional(),
        aplicaO: z.string().optional(),
        caixa: z.string().optional(),
        idioma: z.string().optional(),
        item: z.number().optional(),
        createdAt: z.string().nullable(),
      })),
    })),
  }),
  execute: async () => {
    // Find works that appear more than once (same título + subtítulo + autor1 + volume + edição + ano)
    const dupes = await zite.sql({
      query: `
        SELECT COALESCE("tTulo", '') AS "tTulo", COALESCE("subtTulo", '') AS "subtTulo",
               COALESCE("autor1", '') AS "autor1",
               COALESCE("volume", '') AS "volume", COALESCE("ediO", '') AS "ediO",
               COALESCE(CAST("ano" AS TEXT), '') AS "ano"
        FROM "Obras"
        WHERE "tTulo" IS NOT NULL AND "tTulo" <> ''
        GROUP BY COALESCE("tTulo", ''), COALESCE("subtTulo", ''), COALESCE("autor1", ''), COALESCE("volume", ''), COALESCE("ediO", ''), COALESCE(CAST("ano" AS TEXT), '')
        HAVING COUNT(*) > 1
        ORDER BY COALESCE("tTulo", '') ASC
        LIMIT 200
      `,
    });

    if (dupes.rows.length === 0) return { groups: [] };

    // Fetch all records for those duplicate groups
    const conditions = dupes.rows.map((_, i) => {
      const b = i * 6;
      return `(COALESCE("tTulo", '') = $${b+1} AND COALESCE("subtTulo", '') = $${b+2} AND COALESCE("autor1", '') = $${b+3} AND COALESCE("volume", '') = $${b+4} AND COALESCE("ediO", '') = $${b+5} AND COALESCE(CAST("ano" AS TEXT), '') = $${b+6})`;
    }).join(' OR ');
    const params = dupes.rows.flatMap(r => [String(r.tTulo), String(r.subtTulo), String(r.autor1), String(r.volume), String(r.ediO), String(r.ano)]);

    const records = await zite.sql({
      query: `
        SELECT id, "tTulo", "subtTulo", "autor1", "autor2", "autor3",
               "ediO", "cidade", "editora", "ano", "volume", "isbn",
               "tipo", "observaEs", "aplicaO", "caixa", "idioma", "item",
               created_at AS "createdAt"
        FROM "Obras"
        WHERE ${conditions}
        ORDER BY COALESCE("tTulo", ''), created_at ASC
      `,
      params,
    });

    // Group by título + autor1 + volume + edição + ano
    const groupMap = new Map<string, { tTulo: string; autor1: string; obras: any[] }>();
    for (const r of records.rows) {
      const key = `${r.tTulo ?? ''}|||${r.subtTulo ?? ''}|||${r.autor1 ?? ''}|||${r.volume ?? ''}|||${r.ediO ?? ''}|||${r.ano ?? ''}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { tTulo: String(r.tTulo ?? ''), autor1: String(r.autor1 ?? ''), obras: [] });
      }
      groupMap.get(key)!.obras.push({
        id: String(r.id),
        tTulo: r.tTulo ? String(r.tTulo) : undefined,
        subtTulo: r.subtTulo ? String(r.subtTulo) : undefined,
        autor1: r.autor1 ? String(r.autor1) : undefined,
        autor2: r.autor2 ? String(r.autor2) : undefined,
        autor3: r.autor3 ? String(r.autor3) : undefined,
        ediO: r.ediO ? String(r.ediO) : undefined,
        cidade: r.cidade ? String(r.cidade) : undefined,
        editora: r.editora ? String(r.editora) : undefined,
        ano: r.ano != null ? Number(r.ano) : undefined,
        volume: r.volume ? String(r.volume) : undefined,
        isbn: r.isbn ? String(r.isbn) : undefined,
        tipo: r.tipo ? String(r.tipo) : undefined,
        observaEs: r.observaEs ? String(r.observaEs) : undefined,
        aplicaO: r.aplicaO ? String(r.aplicaO) : undefined,
        caixa: r.caixa ? String(r.caixa) : undefined,
        idioma: r.idioma ? String(r.idioma) : undefined,
        item: r.item != null ? Number(r.item) : undefined,
        createdAt: r.createdAt ? String(r.createdAt) : null,
      });
    }

    return { groups: Array.from(groupMap.values()) };
  },
});
