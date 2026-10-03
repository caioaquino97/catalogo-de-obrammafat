import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@project/components/ui/dialog';
import { Input } from '@project/components/ui/input';
import { Label } from '@project/components/ui/label';
import { Button } from '@project/components/ui/button';
import { Textarea } from '@project/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@project/components/ui/select';
import { createObra, updateObra, listAplicacoes, listCidades } from 'zitejs/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

type ObraData = Record<string, any> | null;

const TIPOS = [
  'Livro', 'Revista', 'Livreto', 'Coleção', 'Ilustrações',
  'Álbum Ilustrado', 'Revistas Encadernadas', 'Livro Ilustrado', 'Manuais',
];

const CAIXAS = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','SC'];

const emptyForm = {
  tTulo: '', subtTulo: '', autor1: '', autor2: '', autor3: '',
  ediO: '', cidade: '', editora: '', ano: '', volume: '',
  isbn: '', tipo: '', observaEs: '', aplicaO: '', caixa: '', idioma: '',
};

export default function ObraFormDialog({ open, onOpenChange, obra, onSaved }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  obra: ObraData;
  onSaved: () => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aplicacoes, setAplicacoes] = useState<string[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const isEdit = !!obra;

  useEffect(() => {
    if (open) {
      listAplicacoes({}).then(res => setAplicacoes(res.aplicacoes)).catch(() => {});
      listCidades({}).then(res => setCidades(res.cidades)).catch(() => {});
    }
  }, [open]);

  useEffect(() => {
    if (obra) {
      setForm({
        tTulo: obra.tTulo || '',
        subtTulo: obra.subtTulo || '',
        autor1: obra.autor1 || '',
        autor2: obra.autor2 || '',
        autor3: obra.autor3 || '',
        ediO: obra.ediO || '',
        cidade: obra.cidade || '',
        editora: obra.editora || '',
        ano: obra.ano ? String(obra.ano) : '',
        volume: obra.volume || '',
        isbn: obra.isbn || '',
        tipo: obra.tipo || '',
        observaEs: obra.observaEs || '',
        aplicaO: obra.aplicaO || '',
        caixa: obra.caixa || '',
        idioma: obra.idioma || '',
      });
    } else {
      setForm(emptyForm);
    }
  }, [obra, open]);

  const set = (field: string, val: string) => setForm(f => ({ ...f, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tTulo.trim()) { toast.error('Título é obrigatório'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        ano: form.ano ? parseInt(form.ano) : undefined,
        tipo: form.tipo || undefined,
        caixa: form.caixa || undefined,
        idioma: form.idioma || undefined,
      };

      if (isEdit) {
        await updateObra({ id: obra!.id, ...payload });
        toast.success('Obra atualizada');
      } else {
        await createObra(payload);
        toast.success('Obra cadastrada');
      }
      onOpenChange(false);
      onSaved();
    } catch {
      toast.error('Erro ao salvar obra');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Obra' : 'Nova Obra'}</DialogTitle>
          <p className="text-sm text-muted-foreground">Preencha os dados bibliográficos da obra.</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 mt-2">
          <Field label="Título *" value={form.tTulo} onChange={v => set('tTulo', v)} />
          <Field label="Subtítulo" value={form.subtTulo} onChange={v => set('subtTulo', v)} />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Autor 1" value={form.autor1} onChange={v => set('autor1', v)} placeholder="SOBRENOME, Nome" />
            <Field label="Autor 2" value={form.autor2} onChange={v => set('autor2', v)} placeholder="SOBRENOME, Nome" />
            <Field label="Autor 3" value={form.autor3} onChange={v => set('autor3', v)} placeholder="SOBRENOME, Nome" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Edição" value={form.ediO} onChange={v => set('ediO', v)} />
            <Field label="Ano" value={form.ano} onChange={v => set('ano', v)} type="number" />
            <Field label="Volume" value={form.volume} onChange={v => set('volume', v)} />
            <Field label="ISBN" value={form.isbn} onChange={v => set('isbn', v)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ComboboxField label="Cidade" value={form.cidade} onChange={v => set('cidade', v)} options={cidades} />
            <Field label="Editora" value={form.editora} onChange={v => set('editora', v)} />
          </div>

          <Field label="Idioma" value={form.idioma} onChange={v => set('idioma', v)} placeholder="Ex: Português, Inglês..." />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo</Label>
              <Select value={form.tipo} onValueChange={v => set('tipo', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {TIPOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Caixa</Label>
              <Select value={form.caixa} onValueChange={v => set('caixa', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {CAIXAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <ComboboxField
            label="Aplicação"
            value={form.aplicaO}
            onChange={v => set('aplicaO', v)}
            options={aplicacoes}
          />

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações</Label>
            <Textarea value={form.observaEs} onChange={e => set('observaEs', e.target.value)} rows={3} />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Input type={type || 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ComboboxField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o =>
    o.toLowerCase().includes((filter || value).toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      <Input
        value={value}
        onChange={e => { onChange(e.target.value); setFilter(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Digite ou selecione..."
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-muted truncate"
              onClick={() => { onChange(opt); setOpen(false); setFilter(''); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
