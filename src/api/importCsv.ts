import { z } from 'zod';
import { createEndpoint } from 'zitejs/backend';
import { zite } from 'zitejs/db';

const tipoMap: Record<string, string> = {
  'REVISTA': 'Revista',
  'LIVRETO': 'Livreto',
  'COLEÇÃO': 'Coleção',
  'ILUSTRAÇÕES': 'Ilustrações',
  'ÁLBUM ILUSTRADO': 'Álbum Ilustrado',
  'REVISTAS ENCADERNADAS': 'Revistas Encadernadas',
  'LIVRO ILUSTRADO': 'Livro Ilustrado',
  'MANUAIS': 'Manuais',
};

export default createEndpoint({
  description: 'Importa obras a partir do conteúdo de um CSV',
  inputSchema: z.object({
    csvContent: z.string(),
  }),
  outputSchema: z.object({
    imported: z.number(),
    skipped: z.number(),
  }),
  execute: async ({ input }) => {
    const lines = input.csvContent.split('\n').filter(l => l.trim());
    if (lines.length < 2) return { imported: 0, skipped: 0 };

    // Detect separator
    const header = lines[0];
    const sep = header.includes(';') ? ';' : ',';

    const rows = lines.slice(1);
    const records: any[] = [];
    let skipped = 0;

    for (const line of rows) {
      const cols = line.replace(/\r/g, '').split(sep);

      // Try to find title - check column index 4 first (original format), then 0
      let titulo = '';
      let subtitulo = '';
      let autor1 = '';
      let autor2 = '';
      let autor3 = '';
      let edicao = '';
      let cidade = '';
      let editora = '';
      let ano = '';
      let volume = '';
      let isbn = '';
      let tipo = '';
      let obs = '';
      let aplicacao = '';
      let caixa = '';

      if (cols.length >= 14) {
        // Original format: ITEM;AUTOR1;AUTOR2;AUTOR3;TITULO;SUBTITULO;ED;CIDADE;EDITORA;ANO;VOLUME;ISBN;TIPO;OBS;APLICACAO;CAIXA
        autor1 = cols[1]?.trim() || '';
        autor2 = cols[2]?.trim() || '';
        autor3 = cols[3]?.trim() || '';
        titulo = cols[4]?.trim() || '';
        subtitulo = cols[5]?.trim() || '';
        edicao = cols[6]?.trim() || '';
        cidade = cols[7]?.trim() || '';
        editora = cols[8]?.trim() || '';
        ano = cols[9]?.trim() || '';
        volume = cols[10]?.trim() || '';
        isbn = cols[11]?.trim() || '';
        tipo = cols[12]?.trim() || '';
        obs = cols[13]?.trim() || '';
        aplicacao = cols[14]?.trim() || '';
        caixa = cols[15]?.trim() || '';
      } else {
        // Exported format: Item;Título;Subtítulo;Autor1;Autor2;Autor3;Edição;Cidade;Editora;Ano;Volume;ISBN;Tipo;Obs;Aplicação;Caixa
        titulo = cols[1]?.trim() || cols[0]?.trim() || '';
        subtitulo = cols[2]?.trim() || '';
        autor1 = cols[3]?.trim() || '';
        autor2 = cols[4]?.trim() || '';
        autor3 = cols[5]?.trim() || '';
        edicao = cols[6]?.trim() || '';
        cidade = cols[7]?.trim() || '';
        editora = cols[8]?.trim() || '';
        ano = cols[9]?.trim() || '';
        volume = cols[10]?.trim() || '';
        isbn = cols[11]?.trim() || '';
        tipo = cols[12]?.trim() || '';
        obs = cols[13]?.trim() || '';
        aplicacao = cols[14]?.trim() || '';
        caixa = cols[15]?.trim() || '';
      }

      if (!titulo) { skipped++; continue; }

      const tipoNorm = tipo ? (tipoMap[tipo.toUpperCase()] || tipo) : null;

      records.push({
        tTulo: titulo || null,
        subtTulo: subtitulo || null,
        autor1: autor1 || null,
        autor2: autor2 || null,
        autor3: autor3 || null,
        ediO: edicao || null,
        cidade: cidade || null,
        editora: editora || null,
        ano: ano ? parseInt(ano) : null,
        volume: volume || null,
        isbn: isbn || null,
        tipo: tipoNorm,
        observaEs: obs || null,
        aplicaO: aplicacao || null,
        caixa: caixa || null,
      });
    }

    // Insert in batches of 100
    for (let i = 0; i < records.length; i += 100) {
      await zite.obras.bulkCreate({ records: records.slice(i, i + 100) });
    }

    return { imported: records.length, skipped };
  },
});
