import { useState, useEffect } from 'react';
import { listDuplicatas, ListDuplicatasOutputType } from 'zitejs/api';
import { deleteObra } from 'zitejs/api';
import { Button } from '@project/components/ui/button';
import { Skeleton } from '@project/components/ui/skeleton';
import { Toaster } from '@project/components/ui/sonner';
import { toast } from 'sonner';
import { ArrowLeft, Trash2, Copy, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';
import ObraFormDialog from '../components/ObraFormDialog';

type Group = ListDuplicatasOutputType['groups'][0];
type Obra = Group['obras'][0];

function ObraRow({ obra, onDelete, onEdit }: { obra: Obra; onDelete: (id: string) => void; onEdit: () => void }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteObra({ id: obra.id });
      toast.success('Obra removida');
      onDelete(obra.id);
    } catch {
      toast.error('Erro ao remover');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2 px-3 rounded-md bg-muted/40 text-sm">
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="font-medium truncate">{obra.tTulo}</p>
        <p className="text-muted-foreground text-xs">
          {[obra.autor1, obra.editora, obra.ano, obra.caixa ? `Cx ${obra.caixa}` : null, obra.tipo]
            .filter(Boolean).join(' · ')}
        </p>
        <p className="text-muted-foreground text-xs">Item: {obra.item ?? '—'}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Pencil className="w-4 h-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive" disabled={deleting}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover esta obra?</AlertDialogTitle>
              <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

function DuplicateGroup({ group, onUpdate, onEdit }: { group: Group; onUpdate: () => void; onEdit: (obra: Obra) => void }) {
  const [obras, setObras] = useState(group.obras);

  const handleDelete = (id: string) => {
    const updated = obras.filter(o => o.id !== id);
    setObras(updated);
    if (updated.length <= 1) onUpdate();
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Copy className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">{group.tTulo}</h3>
        <span className="text-xs text-muted-foreground">({obras.length} cópias)</span>
      </div>
      {group.autor1 && <p className="text-xs text-muted-foreground -mt-1 ml-6">Autor: {group.autor1}</p>}
      <div className="space-y-1.5">
        {obras.map(obra => (
          <ObraRow key={obra.id} obra={obra} onDelete={handleDelete} onEdit={() => onEdit(obra)} />
        ))}
      </div>
    </div>
  );
}

export default function RepetidasPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const res = await listDuplicatas({});
      setGroups(res.groups);
    } catch {
      toast.error('Erro ao carregar duplicatas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleEdit = (obra: Obra) => {
    setEditingObra(obra);
    setDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Obras Repetidas</h1>
            <p className="text-xs text-muted-foreground">
              {groups.length} grupo{groups.length !== 1 ? 's' : ''} de duplicatas
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-4 max-w-3xl">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : groups.length === 0 ? (
          <div className="text-center py-20">
            <Copy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma obra repetida encontrada</p>
          </div>
        ) : (
          groups.map((g, i) => <DuplicateGroup key={i} group={g} onUpdate={load} onEdit={handleEdit} />)
        )}
      </main>

      <ObraFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        obra={editingObra}
        onSaved={load}
      />
    </div>
  );
}
