import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Bot, 
  Settings2, 
  MessageSquare, 
  Clock, 
  Calendar, 
  ShieldCheck,
  Zap,
  Save,
  Activity,
  History,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
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
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/sdr")({
  component: SDRPage,
});

type RobotConfig = {
  id: string;
  is_active: boolean;
  assistant_name: string;
  objective: string;
  business_context: string;
  specific_instructions: string;
  delay_minutes: number;
  working_hours_enabled: boolean;
  work_start_time: string;
  work_end_time: string;
  work_days: number[];
};

type RobotLog = {
  id: string;
  lead_id: string;
  lead_name?: string;
  received_message: string;
  sent_response: string;
  status: 'automatic' | 'transferred' | 'error';
  created_at: string;
};

const WEEK_DAYS = [
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
  { id: 7, label: "Dom" },
];

function SDRPage() {
  const [config, setConfig] = useState<RobotConfig | null>(null);
  const [logs, setLogs] = useState<RobotLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfig();
    fetchLogs();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('robot_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setConfig(data);
      } else {
        // Default initial config
        setConfig({
          id: '',
          is_active: false,
          assistant_name: 'Ana',
          objective: 'Qualificar lead',
          business_context: '',
          specific_instructions: '',
          delay_minutes: 2,
          working_hours_enabled: true,
          work_start_time: '09:00',
          work_end_time: '18:00',
          work_days: [1, 2, 3, 4, 5]
        });
      }
    } catch (err: any) {
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
        const { data, error } = await supabase
            .from('robot_logs')
            .select('*, leads(name)')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        setLogs(data.map((l: any) => ({
            ...l,
            lead_name: l.leads?.name || 'Lead desconhecido'
        })));
    } catch (err) {
        console.error(err);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('robot_config')
        .upsert({
          ...config,
          user_id: user.id,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Configurações do Robô salvas!");
      fetchConfig();
    } catch (err: any) {
      toast.error("Erro ao salvar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    if (!config) return;
    const current = config.work_days || [];
    const updated = current.includes(day)
      ? current.filter(d => d !== day)
      : [...current, day].sort();
    setConfig({ ...config, work_days: updated });
  };

  if (loading || !config) {
    return <div className="flex h-screen items-center justify-center bg-zinc-900"><Activity className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <Bot className="text-primary h-10 w-10" /> SDR ROBÔ
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
            Automação inteligente de pré-vendas
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] animate-pulse">IA ATIVA</Badge>
          </p>
        </div>

        <div className="flex items-center gap-6 bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/50">
            <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Status do Sistema</p>
                <p className={`text-xs font-black ${config.is_active ? 'text-primary' : 'text-zinc-500'}`}>
                    {config.is_active ? 'OPERACIONAL' : 'DESATIVADO'}
                </p>
            </div>
            <Switch 
                checked={config.is_active} 
                onCheckedChange={(v) => setConfig({...config, is_active: v})}
                className="data-[state=checked]:bg-primary"
            />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Main Settings */}
        <Card className="lg:col-span-2 bg-zinc-800 border-zinc-700 shadow-none overflow-hidden">
          <div className="bg-zinc-800/50 border-b border-zinc-700 p-6 flex items-center gap-3">
            <Settings2 className="text-primary h-5 w-5" />
            <h3 className="text-xs font-black uppercase tracking-widest">Cérebro da IA</h3>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">Nome do Assistente</Label>
                    <Input 
                        value={config.assistant_name} 
                        onChange={(e) => setConfig({...config, assistant_name: e.target.value})}
                        className="bg-zinc-900 border-zinc-700 h-11"
                        placeholder="Ex: Ana, Consultora Digital"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase text-zinc-500">Objetivo Principal</Label>
                    <Select 
                        value={config.objective} 
                        onValueChange={(v) => setConfig({...config, objective: v})}
                    >
                        <SelectTrigger className="bg-zinc-900 border-zinc-700 h-11">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="Qualificar lead">Qualificar lead</SelectItem>
                            <SelectItem value="Agendar reunião">Agendar reunião</SelectItem>
                            <SelectItem value="Vender produto">Vender produto</SelectItem>
                            <SelectItem value="Suporte inicial">Suporte inicial</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-zinc-500">Contexto do Negócio</Label>
                <Textarea 
                    value={config.business_context} 
                    onChange={(e) => setConfig({...config, business_context: e.target.value})}
                    className="bg-zinc-900 border-zinc-700 min-h-[120px] resize-none"
                    placeholder="O que você vende? Quem é seu público alvo? Quais seus diferenciais?"
                />
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-zinc-500">Instruções Específicas</Label>
                <Textarea 
                    value={config.specific_instructions} 
                    onChange={(e) => setConfig({...config, specific_instructions: e.target.value})}
                    className="bg-zinc-900 border-zinc-700 min-h-[120px] resize-none"
                    placeholder="Tom de voz, gírias a evitar, como lidar com preço, etc."
                />
            </div>

            <div className="pt-4 border-t border-zinc-700/50 flex justify-end">
                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="bg-primary text-black font-black uppercase text-[10px] tracking-widest px-10 h-11 shadow-[0_0_20px_rgba(170,255,0,0.2)]"
                >
                    {saving ? 'SALVANDO...' : 'SALVAR CONFIGURAÇÕES'}
                    <Save className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        </Card>

        {/* Behavior & Scheduling */}
        <div className="space-y-8">
            <Card className="bg-zinc-800 border-zinc-700 shadow-none">
                <div className="bg-zinc-800/50 border-b border-zinc-700 p-6 flex items-center gap-3">
                    <Zap className="text-primary h-5 w-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Comportamento</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <Label className="text-[10px] font-bold uppercase text-zinc-500">Espera para Resposta</Label>
                            <Badge variant="outline" className="text-primary border-primary/20">{config.delay_minutes} MIN</Badge>
                        </div>
                        <Slider 
                            value={[config.delay_minutes]} 
                            onValueChange={([v]) => setConfig({...config, delay_minutes: v})}
                            min={1} 
                            max={10} 
                            step={1}
                            className="[&_[role=slider]]:bg-primary"
                        />
                        <p className="text-[9px] text-zinc-500 leading-tight">Tempo que o robô aguarda após receber uma mensagem para parecer uma resposta humana natural.</p>
                    </div>

                    <div className="pt-4 border-t border-zinc-700/50 flex items-center justify-between">
                        <div>
                            <Label className="text-[10px] font-bold uppercase text-zinc-500">Modo Humano</Label>
                            <p className="text-[9px] text-zinc-500">Pausar ao detectar interesse real</p>
                        </div>
                        <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-800 border-zinc-700 shadow-none">
                <div className="bg-zinc-800/50 border-b border-zinc-700 p-6 flex items-center gap-3">
                    <Clock className="text-primary h-5 w-5" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Horário de Atendimento</h3>
                </div>
                <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase text-zinc-500">Ativo 24h</Label>
                        <Switch 
                            checked={!config.working_hours_enabled} 
                            onCheckedChange={(v) => setConfig({...config, working_hours_enabled: !v})}
                            className="data-[state=checked]:bg-primary"
                        />
                    </div>

                    {config.working_hours_enabled && (
                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-zinc-500">Início</Label>
                                    <Input 
                                        type="time" 
                                        value={config.work_start_time || '09:00'} 
                                        onChange={(e) => setConfig({...config, work_start_time: e.target.value})}
                                        className="bg-zinc-900 border-zinc-700 h-9 text-xs" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-bold uppercase text-zinc-500">Fim</Label>
                                    <Input 
                                        type="time" 
                                        value={config.work_end_time || '18:00'} 
                                        onChange={(e) => setConfig({...config, work_end_time: e.target.value})}
                                        className="bg-zinc-900 border-zinc-700 h-9 text-xs" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-[9px] font-bold uppercase text-zinc-500">Dias da Semana</Label>
                                <div className="flex flex-wrap gap-2">
                                    {WEEK_DAYS.map(day => (
                                        <button
                                            key={day.id}
                                            onClick={() => toggleDay(day.id)}
                                            className={`h-8 px-2.5 rounded-md border text-[9px] font-black uppercase transition-all ${
                                                config.work_days?.includes(day.id)
                                                ? 'bg-primary/10 border-primary/40 text-primary'
                                                : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                                            }`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Robot Logs */}
      <Card className="bg-zinc-800 border-zinc-700 shadow-none overflow-hidden">
        <div className="p-6 border-b border-zinc-700 flex items-center justify-between bg-zinc-800/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <History className="h-3.5 w-3.5 text-primary" /> Histórico de Interações Recentes
            </h3>
            <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[10px]">ULTIMAS 20</Badge>
        </div>
        <Table>
            <TableHeader className="bg-zinc-900/50">
                <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Lead</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Mensagem Recebida</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Resposta IA</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Horário</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Status</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {logs.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-zinc-500">Nenhuma interação registrada ainda.</TableCell>
                    </TableRow>
                ) : (
                    logs.map((log) => (
                        <TableRow key={log.id} className="border-zinc-700/50 hover:bg-zinc-700/30 transition-colors">
                            <TableCell className="font-bold text-zinc-100 text-xs uppercase tracking-tight">{log.lead_name}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-zinc-400 text-xs">{log.received_message}</TableCell>
                            <TableCell className="max-w-[200px] truncate text-zinc-300 text-xs italic">"{log.sent_response}"</TableCell>
                            <TableCell className="text-zinc-500 text-[10px] font-medium">
                                {format(new Date(log.created_at), "dd/MM 'às' HH:mm")}
                            </TableCell>
                            <TableCell className="text-right">
                                {log.status === 'automatic' ? (
                                    <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase">AUTO</Badge>
                                ) : (
                                    <Badge className="bg-blue-500/10 text-blue-400 border-none text-[8px] font-black uppercase">HUMANO</Badge>
                                )}
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
