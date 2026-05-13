import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  PieChart as PieChartIcon, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Clock, 
  MapPin, 
  Target,
  Calendar,
  Filter,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/relatorios")({
  component: RelatoriosPage,
});

function MetricCard({ title, value, subvalue, icon: Icon, trend }: any) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 shadow-none hover:border-primary/20 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {trend && (
            <Badge className={`${trend === 'up' ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'} border-none text-[10px] font-bold`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              12%
            </Badge>
          )}
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">{title}</p>
          <p className="text-3xl font-black text-white tracking-tighter">{value}</p>
          {subvalue && <p className="text-[10px] font-medium text-zinc-400 mt-1 uppercase tracking-tight">{subvalue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function RelatoriosPage() {
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalLeads: 0,
    responseRate: 0,
    bestTime: "10:00",
    topNiche: "N/A",
    topCity: "N/A",
    leadsHistory: [],
    campaignPerformance: [],
    funnelDistribution: [],
    topSegments: [],
    campaigns: []
  });

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startDate = subDays(new Date(), parseInt(period)).toISOString();

      // 1. Leads counts
      const { count: leadsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true });

      // 2. Cities and segments stats from all companies
      const { data: companies } = await supabase
        .from('companies')
        .select('segment, city_state, created_at, pipeline_stage');

      const cityCounts: Record<string, number> = {};
      const segmentCounts: Record<string, number> = {};
      const funnelCounts: Record<string, number> = {};
      
      companies?.forEach(c => {
        if (c.city_state) {
            const city = c.city_state.split(',')[0].trim();
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
        if (c.segment) segmentCounts[c.segment] = (segmentCounts[c.segment] || 0) + 1;
        if (c.pipeline_stage) funnelCounts[c.pipeline_stage] = (funnelCounts[c.pipeline_stage] || 0) + 1;
      });

      const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
      const topNiche = Object.entries(segmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

      // 3. Campaigns and messages for rates
      const { data: campaigns } = await supabase
        .from('campaigns')
        .select('*')
        .gte('created_at', startDate);

      const totalSent = campaigns?.reduce((acc, c) => acc + (c.sent_count || 0), 0) || 0;
      const totalReplied = campaigns?.reduce((acc, c) => acc + (c.replied_count || 0), 0) || 0;
      const responseRate = totalSent > 0 ? ((totalReplied / totalSent) * 100).toFixed(1) : 0;

      // History Data (Last X days)
      const lastDays = eachDayOfInterval({ start: subDays(new Date(), parseInt(period)), end: new Date() });
      const historyData = lastDays.map(day => {
        const dateStr = format(day, 'dd/MM');
        const count = companies?.filter(c => format(new Date(c.created_at), 'dd/MM') === dateStr).length || 0;
        return { date: dateStr, leads: count };
      });

      setData({
        totalLeads: leadsCount || 0,
        responseRate: `${responseRate}%`,
        bestTime: "11:30", // Placeholder until we have detailed logs
        topNiche,
        topCity,
        leadsHistory: historyData,
        campaignPerformance: campaigns?.slice(0, 5).map(c => ({
            name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name,
            sent: c.sent_count,
            replied: c.replied_count
        })) || [],
        funnelDistribution: Object.entries(funnelCounts).map(([name, value]) => ({ name, value })),
        topSegments: Object.entries(segmentCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, value]) => ({ name, value })),
        campaigns: campaigns || []
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#AAFF00', '#00D1FF', '#FF00E5', '#FF8A00', '#9E00FF'];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">RELATÓRIOS</h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
            Análise de performance e prospecção
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">BUSINESS INTELLIGENCE</Badge>
          </p>
        </div>

        <div className="flex items-center gap-3">
            <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-1 flex">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 text-[10px] font-black uppercase px-4 ${period === '7' ? 'bg-zinc-700 text-primary' : 'text-zinc-500'}`}
                    onClick={() => setPeriod('7')}
                >
                    7 DIAS
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 text-[10px] font-black uppercase px-4 ${period === '30' ? 'bg-zinc-700 text-primary' : 'text-zinc-500'}`}
                    onClick={() => setPeriod('30')}
                >
                    30 DIAS
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={`h-8 text-[10px] font-black uppercase px-4 ${period === '90' ? 'bg-zinc-700 text-primary' : 'text-zinc-500'}`}
                    onClick={() => setPeriod('90')}
                >
                    90 DIAS
                </Button>
            </div>
            <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest gap-2 h-10 px-4">
                <Calendar className="h-3 w-3 text-primary" /> CUSTOM
            </Button>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <MetricCard title="Total de Leads" value={data.totalLeads} subvalue="Acumulado total" icon={Users} trend="up" />
        <MetricCard title="Taxa de Resposta" value={data.responseRate} subvalue="Média de campanhas" icon={MessageSquare} trend="up" />
        <MetricCard title="Melhor Horário" value={data.bestTime} subvalue="Pico de engajamento" icon={Clock} />
        <MetricCard title="Nicho Top" value={data.topNiche} subvalue="Maior volume" icon={Target} />
        <MetricCard title="Cidade Foco" value={data.topCity} subvalue="Localidade líder" icon={MapPin} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart */}
        <Card className="lg:col-span-2 bg-zinc-800 border-zinc-700 shadow-none">
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary" /> Leads Prospectados por Dia
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.leadsHistory}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="date" fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46' }}
                                itemStyle={{ color: '#AAFF00' }}
                            />
                            <Line type="monotone" dataKey="leads" stroke="#AAFF00" strokeWidth={3} dot={{ fill: '#AAFF00', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Funnel Pie */}
        <Card className="bg-zinc-800 border-zinc-700 shadow-none">
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                    <PieChartIcon className="h-3.5 w-3.5 text-primary" /> Etapas do Funil
                </h3>
                <div className="h-72 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data.funnelDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.funnelDistribution.map((entry: any, index: number) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Campaign Performance Bar */}
        <Card className="lg:col-span-2 bg-zinc-800 border-zinc-700 shadow-none">
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Performance de Campanhas
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.campaignPerformance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46' }}
                                cursor={{ fill: '#27272a' }}
                            />
                            <Bar dataKey="sent" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Enviados" />
                            <Bar dataKey="replied" fill="#AAFF00" radius={[4, 4, 0, 0]} name="Respondidos" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

        {/* Top Segments Bar */}
        <Card className="bg-zinc-800 border-zinc-700 shadow-none">
            <CardContent className="p-6">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-8 flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-primary" /> Top 5 Segmentos
                </h3>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.topSegments} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={100} fontSize={9} axisLine={false} tickLine={false} stroke="#71717a" />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="value" fill="#AAFF00" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card className="bg-zinc-800 border-zinc-700 shadow-none overflow-hidden">
        <div className="p-6 border-b border-zinc-700">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <List className="h-3.5 w-3.5 text-primary" /> Detalhamento de Campanhas
            </h3>
        </div>
        <Table>
            <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Campanha</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Início</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Enviados</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Responderam</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Taxa</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.campaigns.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-zinc-500 text-sm">Nenhum dado encontrado para o período</TableCell>
                    </TableRow>
                ) : (
                    data.campaigns.map((c: any) => (
                        <TableRow key={c.id} className="border-zinc-700/50 hover:bg-zinc-700/30 transition-colors">
                            <TableCell className="font-bold text-zinc-100 text-xs uppercase tracking-tight">{c.name}</TableCell>
                            <TableCell className="text-zinc-400 text-xs font-medium">{format(new Date(c.created_at), 'dd/MM/yyyy')}</TableCell>
                            <TableCell className="font-black text-zinc-300 text-sm">{c.sent_count}</TableCell>
                            <TableCell className="font-black text-primary text-sm">{c.replied_count}</TableCell>
                            <TableCell>
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black">
                                    {c.sent_count > 0 ? ((c.replied_count / c.sent_count) * 100).toFixed(1) : 0}%
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-widest ${c.status === 'completed' ? 'border-primary/50 text-primary' : 'border-zinc-700 text-zinc-500'}`}>
                                    {c.status === 'completed' ? 'Finalizada' : 'Em curso'}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function List({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
    )
}
