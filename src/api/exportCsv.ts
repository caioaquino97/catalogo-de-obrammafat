import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Exporta todas as obras do catálogo em formato CSV',
  inputSchema: z.object({}),
  outputSchema: z.object({
    csv: z.string(),
    total: z.number(),
  }),
  execute: async () => {
    const result = await zite.sql({
      query: `SELECT "item", "tTulo", "subtTulo", "autor1", "autor2", "autor3", "ediO", "cidade", "editora", "ano", "volume", "isbn", "tipo", "observaEs", "aplicaO", "caixa", "idioma" FROM "Obras" ORDER BY "item" ASC`,
    });

    const headers = ['Item','Título','Subtítulo','Autor 1','Autor 2','Autor 3','Edição','Cidade','Editora','Ano','Volume','ISBN','Tipo','Observações','Aplicação','Caixa','Idioma'];
    const fields = ['item','tTulo','subtTulo','autor1','autor2','autor3','ediO','cidade','editora','ano','volume','isbn','tipo','observaEs','aplicaO','caixa','idioma'];

    const escape = (v: unknown) => {
      if (v == null || v === '') return '';
      const s = String(v);
      if (s.includes(';') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const lines = [headers.join(';')];
    for (const row of result.rows) {
      lines.push(fields.map(f => escape(row[f])).join(';'));
    }

    return { csv: lines.join('\n'), total: result.rows.length };
  },
});
