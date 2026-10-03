import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

export default createEndpoint({
  description: 'Cadastra uma nova obra no catálogo',
  inputSchema: z.object({
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
  outputSchema: z.object({
    obra: z.any(),
  }),
  execute: async ({ input }) => {
    const obra = await zite.obras.create({
      record: {
        tTulo: input.tTulo,
        subtTulo: input.subtTulo || null,
        autor1: input.autor1 || null,
        autor2: input.autor2 || null,
        autor3: input.autor3 || null,
        ediO: input.ediO || null,
        cidade: input.cidade || null,
        editora: input.editora || null,
        ano: input.ano || null,
        volume: input.volume || null,
        isbn: input.isbn || null,
        tipo: input.tipo || null,
        observaEs: input.observaEs || null,
        aplicaO: input.aplicaO || null,
        caixa: input.caixa || null,
        idioma: input.idioma || null,
      },
    });
    return { obra };
  },
});
