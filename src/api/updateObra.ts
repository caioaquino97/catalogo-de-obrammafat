import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Atualiza uma obra existente',
  inputSchema: z.object({
    id: z.string(),
    tTulo: z.string().min(1),
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
  }),
  outputSchema: z.object({ success: z.boolean() }),
  execute: async ({ input }) => {
    const { id, ...fields } = input;
    await zite.obras.update({
      id,
      record: {
        tTulo: fields.tTulo,
        subtTulo: fields.subtTulo || null,
        autor1: fields.autor1 || null,
        autor2: fields.autor2 || null,
        autor3: fields.autor3 || null,
        ediO: fields.ediO || null,
        cidade: fields.cidade || null,
        editora: fields.editora || null,
        ano: fields.ano || null,
        volume: fields.volume || null,
        isbn: fields.isbn || null,
        tipo: fields.tipo || null,
        observaEs: fields.observaEs || null,
        aplicaO: fields.aplicaO || null,
        caixa: fields.caixa || null,
        idioma: fields.idioma || null,
      },
    });
    return { success: true };
  },
});
