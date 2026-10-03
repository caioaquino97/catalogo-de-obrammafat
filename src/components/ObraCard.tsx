import { useState } from 'react';
import { ListObrasOutputType } from 'zitejs/api';
import { deleteObra } from 'zitejs/api';
import { Pencil, Trash2, BookText } from 'lucide-react';
import { Button } from '@project/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import { Badge } from '@project/components/ui/badge';
import { toast } from 'sonner';

type Obra = {
  id: string;
  tTulo?: string;
  subtTulo?: string;
  autor1?: string;
  autor2?: string;
  autor3?: string;
  ediO?: string;
  cidade?: string;
  editora?: string;
  ano?: number;
  volume?: string;
  isbn?: string;
  tipo?: string;
  observaEs?: string;
  aplicaO?: string;
  caixa?: string;
  idioma?: string;
  item?: number;
};

const tipoColors: Record<string, string> = {
  Livro: 'bg-blue-100 text-blue-700',
  Revista: 'bg-orange-100 text-orange-700',
  Livreto: 'bg-green-100 text-green-700',
  'Coleção': 'bg-purple-100 text-purple-700',
  'Ilustrações': 'bg-pink-100 text-pink-700',
  'Álbum Ilustrado': 'bg-yellow-100 text-yellow-700',
  'Revistas Encadernadas': 'bg-amber-100 text-amber-700',
  'Livro Ilustrado': 'bg-cyan-100 text-cyan-700',
  'Manuais': 'bg-red-100 text-red-700',
};

export default function ObraCard({ obra, onEdit, onDeleted }: { obra: Obra; onEdit: () => void; onDeleted: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteObra({ id: obra.id });
      toast.success('Obra removida com sucesso');
      onDeleted();
    } catch {
      toast.error('Erro ao remover obra');
    } finally {
      setDeleting(false);
    }
  };

  const autores = [obra.autor1, obra.autor2, obra.autor3].filter(Boolean).join('; ');

  return (
    <div className="group flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:shadow-md transition-shadow">
      <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center shrink-0 mt-0.5">
        <BookText className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">{obra.tTulo || 'Sem título'}</p>
            {obra.subtTulo && <p className="text-xs text-muted-foreground truncate">{obra.subtTulo}</p>}
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover obra?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover &ldquo;{obra.tTulo}&rdquo;? Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                    {deleting ? 'Removendo...' : 'Remover'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {autores && <span className="text-xs text-muted-foreground">{autores}</span>}
          {autores && (obra.ano || obra.editora) && <span className="text-xs text-muted-foreground">·</span>}
          {obra.editora && <span className="text-xs text-muted-foreground">{obra.editora}</span>}
          {obra.ano && <span className="text-xs text-muted-foreground">({obra.ano})</span>}
        </div>

        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          {obra.tipo && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tipoColors[obra.tipo] || 'bg-muted text-muted-foreground'}`}>
              {obra.tipo}
            </span>
          )}
          {obra.caixa && (
            <Badge variant="outline" className="text-[10px] py-0">Cx {obra.caixa}</Badge>
          )}
          {obra.isbn && (
            <span className="text-[10px] text-muted-foreground font-mono">ISBN: {obra.isbn}</span>
          )}
          {obra.idioma && (
            <span className="text-[10px] text-muted-foreground">🌐 {obra.idioma}</span>
          )}
        </div>
      </div>
    </div>
  );
}
