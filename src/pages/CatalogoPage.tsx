import { useState, useCallback, useEffect } from 'react';
import { listObras, ListObrasOutputType, exportCsv, importCsv, deleteToday } from 'zitejs/api';
import { Input } from '@project/components/ui/input';
import { Button } from '@project/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { Toaster } from '@project/components/ui/sonner';
import { Search, Plus, ChevronLeft, ChevronRight, BookOpen, Filter, X, Download, Upload, BarChart3, Trash2, FileSpreadsheet, Copy } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ObraFormDialog from '../components/ObraFormDialog';
import ObraCard from '../components/ObraCard';
import { Skeleton } from '@project/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@project/components/ui/alert-dialog';

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

const TIPOS = [
  'Livro', 'Revista', 'Livreto', 'Coleção', 'Ilustrações',
  'Álbum Ilustrado', 'Revistas Encadernadas', 'Livro Ilustrado', 'Manuais',
];
const CAIXAS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','SC'];
const PAGE_SIZE = 30;

export default function CatalogoPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState('');
  const [caixa, setCaixa] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObra, setEditingObra] = useState<Obra | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();
  const [deletingToday, setDeletingToday] = useState(false);

  const handleDeleteToday = async () => {
    setDeletingToday(true);
    try {
      const res = await deleteToday({});
      toast.success(`${res.deleted} obra(s) de hoje removida(s)`);
      reload();
    } catch {
      toast.error('Erro ao remover obras de hoje');
    } finally {
      setDeletingToday(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await exportCsv({});
      const blob = new Blob(['\uFEFF' + res.csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogo-obras.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const res = await importCsv({ csvContent: text });
        toast.success(`${res.imported} obra(s) importada(s)${res.skipped ? `, ${res.skipped} linha(s) ignorada(s)` : ''}`);
        reload();
      } catch {
        toast.error('Erro ao importar CSV');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleImportOds = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ods,.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const XLSX = await import('xlsx');
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const csvContent = XLSX.utils.sheet_to_csv(ws, { FS: ';' });
        const res = await importCsv({ csvContent });
        toast.success(`${res.imported} obra(s) importada(s)${res.skipped ? `, ${res.skipped} linha(s) ignorada(s)` : ''}`);
        reload();
      } catch {
        toast.error('Erro ao importar arquivo');
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const fetchObras = useCallback(async (s: string, t: string, c: string, p: number) => {
    setLoading(true);
    try {
      const res = await listObras({
        search: s || undefined,
        tipo: t || undefined,
        caixa: c || undefined,
        offset: p * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setObras(res.obras as Obra[]);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchObras(search, tipo, caixa, page);
  }, [page]);

  const debouncedSearch = useDebouncedCallback((val: string) => {
    setPage(0);
    fetchObras(val, tipo, caixa, 0);
  }, 400);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    debouncedSearch(val);
  };

  const handleFilterChange = (newTipo: string, newCaixa: string) => {
    setTipo(newTipo);
    setCaixa(newCaixa);
    setPage(0);
    fetchObras(search, newTipo, newCaixa, 0);
  };

  const reload = () => fetchObras(search, tipo, caixa, page);

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = tipo || caixa;

  return (
    <div className="min-h-screen bg-background">
      <Toaster />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Plataforma de Gestão de Acervo Aeronáutico</h1>
                <p className="text-xs text-muted-foreground">{total} obra{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard')} className="gap-2">
              <BarChart3 className="w-4 h-4" /> Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/repetidas')} className="gap-2">
              <Copy className="w-4 h-4" /> Repetidas
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" /> Remover Hoje
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remover obras de hoje?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Todas as obras cadastradas hoje serão removidas. Essa ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteToday} disabled={deletingToday}>
                    {deletingToday ? 'Removendo...' : 'Confirmar'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" onClick={handleImport} disabled={importing} className="gap-2">
              <Upload className="w-4 h-4" /> Importar CSV
            </Button>
            <Button variant="outline" onClick={handleImportOds} disabled={importing} className="gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Importar ODS
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={exporting} className="gap-2">
              <Download className="w-4 h-4" /> {exporting ? 'Exportando...' : 'CSV'}
            </Button>
            <Button onClick={() => { setEditingObra(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="w-4 h-4" /> Nova Obra
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, autor, editora, ISBN..."
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={hasActiveFilters ? 'default' : 'outline'}
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Select value={tipo} onValueChange={v => handleFilterChange(v, caixa)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={caixa} onValueChange={v => handleFilterChange(tipo, v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Caixa" />
                </SelectTrigger>
                <SelectContent>
                  {CAIXAS.map(c => <SelectItem key={c} value={c}>Caixa {c}</SelectItem>)}
                </SelectContent>
              </Select>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={() => handleFilterChange('', '')} className="gap-1 text-muted-foreground">
                  <X className="w-3 h-3" /> Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Banner */}
      <div className="relative w-full h-36 sm:h-44 overflow-hidden">
        <img src="https://images.fillout.com/orgid-832898/flowpublicid-x7fxa1rbtu/widgetid-default/9UzEkDh4Umt3MQwqp1TyGE/pasted-image-1788049144740-0pbwjvra.jpg" className="absolute inset-0 w-full h-full object-cover" alt="Acervo Aeronáutico" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : obras.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Nenhuma obra encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Tente ajustar os filtros ou cadastre uma nova obra.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2">
              {obras.map(obra => (
                <ObraCard
                  key={obra.id}
                  obra={obra}
                  onEdit={() => { setEditingObra(obra); setDialogOpen(true); }}
                  onDeleted={reload}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline" size="sm" disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-3">
                  {page + 1} de {totalPages}
                </span>
                <Button
                  variant="outline" size="sm" disabled={page >= totalPages - 1}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <ObraFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        obra={editingObra}
        onSaved={reload}
      />
    </div>
  );
}
