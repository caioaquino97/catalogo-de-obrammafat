import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dashboardStats, DashboardStatsOutputType } from 'zitejs/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Button } from '@project/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@project/components/ui/card';
import { Skeleton } from '@project/components/ui/skeleton';
import { ArrowLeft, BookOpen, Package, MapPin, Calendar } from 'lucide-react';

const COLORS = [
  'hsl(220, 65%, 38%)', 'hsl(32, 90%, 50%)', 'hsl(160, 60%, 40%)',
  'hsl(280, 50%, 50%)', 'hsl(350, 65%, 55%)', 'hsl(45, 80%, 50%)',
  'hsl(190, 60%, 45%)', 'hsl(0, 70%, 55%)', 'hsl(120, 40%, 45%)',
  'hsl(260, 55%, 60%)', 'hsl(15, 75%, 50%)', 'hsl(200, 70%, 50%)',
];

type Stats = DashboardStatsOutputType;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardStats({}).then(res => { setStats(res); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto max-w-6xl">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-80 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Dashboard — Organização de Prateleira</h1>
            <p className="text-xs text-muted-foreground">{stats.total} obras no catálogo</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <PieCard title="Por Tipo" icon={<BookOpen className="w-4 h-4" />} data={stats.porTipo} />
        <PieCard title="Por Caixa" icon={<Package className="w-4 h-4" />} data={stats.porCaixa} />
        <PieCard title="Por Cidade (Top 15)" icon={<MapPin className="w-4 h-4" />} data={stats.porCidade} />
        <PieCard title="Por Década" icon={<Calendar className="w-4 h-4" />} data={stats.porDecada} />

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="w-4 h-4" /> Obras por Caixa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.porCaixa.sort((a, b) => {
                const na = parseInt(a.name), nb = parseInt(b.name);
                if (isNaN(na) && isNaN(nb)) return a.name.localeCompare(b.name);
                if (isNaN(na)) return 1;
                if (isNaN(nb)) return -1;
                return na - nb;
              })}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
                  labelStyle={{ fontWeight: 600 }}
                />
                <Bar dataKey="value" name="Obras" fill="hsl(220, 65%, 38%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {stats.caixasSemTipo.length > 0 && (
          <Card className="md:col-span-2 border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="text-base text-amber-800">⚠️ Obras sem tipo definido</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {stats.caixasSemTipo.map(c => (
                  <div key={c.caixa} className="bg-white border border-amber-200 rounded-lg px-3 py-2 text-center">
                    <p className="text-xs text-amber-600">Caixa {c.caixa}</p>
                    <p className="text-lg font-bold text-amber-800">{c.total}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

function PieCard({ title, icon, data }: { title: string; icon: React.ReactNode; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={40}
              dataKey="value"
              nameKey="name"
              paddingAngle={2}
              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              labelLine={true}
              style={{ fontSize: 11 }}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 13 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
