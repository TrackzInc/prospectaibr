import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  Clock, 
  Repeat, 
  CheckCircle2, 
  XCircle,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  CalendarDays
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addDays, startOfWeek, endOfWeek, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/agendamentos")({
  component: AgendamentosPage,
});

type Schedule = {
  id: string;
  name: string;
  campaign_id: string | null;
  campaign_name?: string;
  scheduled_for: string;
  recurrence: 'once' | 'daily' | 'weekly' | 'monthly';
  recurrence_days: number[] | null;
  is_active: boolean;
  next_run_at: string | null;
};

type Campaign = {
  id: string;
  name: string;
};

function AgendamentosPage() {
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Form State
  const [name, setName] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekly' | 'monthly'>('once');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchedules();
    fetchCampaigns();
  }, []);

  const fetchSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          campaigns (
            name
          )
        `)
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      
      const formatted = (data as any[]).map(item => ({
        ...item,
        campaign_name: item.campaigns?.name
      }));
      
      setSchedules(formatted);
    } catch (err: any) {
      toast.error("Erro ao carregar agendamentos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    const { data } = await supabase.from('campaigns').select('id, name');
    if (data) setCampaigns(data);
  };

  const handleCreateSchedule = async () => {
    if (!name || !selectedCampaign || !date || !time) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const scheduledFor = new Date(`${date}T${time}`).toISOString();

      const { error } = await supabase
        .from('schedules')
        .insert({
          user_id: user.id,
          name,
          campaign_id: selectedCampaign,
          scheduled_for: scheduledFor,
          recurrence,
          is_active: true,
          next_run_at: scheduledFor
        });

      if (error) throw error;

      toast.success("Agendamento criado com sucesso!");
      setIsModalOpen(false);
      resetForm();
      fetchSchedules();
    } catch (err: any) {
      toast.error("Erro ao criar agendamento");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSelectedCampaign("");
    setDate("");
    setTime("");
    setRecurrence('once');
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('schedules')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
      toast.success(`Agendamento ${!currentStatus ? 'ativado' : 'desativado'}`);
    }
  };

  // Calendar logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">AGENDAMENTOS</h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
            Controle de disparos automáticos
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">AUTOMAÇÃO</Badge>
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-zinc-800 p-1 rounded-lg flex border border-zinc-700">
            <Button 
              variant={view === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('list')}
              className={`h-8 gap-2 px-3 text-[10px] font-black uppercase tracking-widest ${view === 'list' ? 'bg-zinc-700 text-primary' : 'text-zinc-500'}`}
            >
              <List className="h-3 w-3" /> LISTA
            </Button>
            <Button 
              variant={view === 'calendar' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setView('calendar')}
              className={`h-8 gap-2 px-3 text-[10px] font-black uppercase tracking-widest ${view === 'calendar' ? 'bg-zinc-700 text-primary' : 'text-zinc-500'}`}
            >
              <CalendarIcon className="h-3 w-3" /> CALENDÁRIO
            </Button>
          </div>

          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-black font-black px-6 h-10 text-xs tracking-widest shadow-[0_0_20px_rgba(170,255,0,0.2)]">
                <Plus className="h-4 w-4 mr-2" /> NOVO AGENDAMENTO
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-tighter">CRIAR AGENDAMENTO</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome do Agendamento</Label>
                  <Input 
                    placeholder="Ex: Disparo Semanal Vendas" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vincular Campanha</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 h-11">
                      <SelectValue placeholder="Selecione uma campanha" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {campaigns.map(c => (
                        <SelectItem key={c.id} value={c.id} className="text-zinc-200 focus:bg-primary focus:text-black">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Data do Disparo</Label>
                    <Input 
                      type="date" 
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Horário</Label>
                    <Input 
                      type="time" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="bg-zinc-800 border-zinc-700 h-11"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Recorrência</Label>
                  <Select value={recurrence} onValueChange={(v: any) => setRecurrence(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="once" className="text-zinc-200">Único</SelectItem>
                      <SelectItem value="daily" className="text-zinc-200">Diário</SelectItem>
                      <SelectItem value="weekly" className="text-zinc-200">Semanal</SelectItem>
                      <SelectItem value="monthly" className="text-zinc-200">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">CANCELAR</Button>
                <Button onClick={handleCreateSchedule} disabled={submitting} className="bg-primary text-black font-black uppercase text-[10px] tracking-widest px-8">
                  {submitting ? "CRIANDO..." : "CONFIRMAR AGENDAMENTO"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-48 bg-zinc-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
            <CalendarIcon className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-3xl font-black text-zinc-800 italic tracking-tighter uppercase mb-2">NADA AGENDADO</h3>
          <p className="text-zinc-600 text-sm max-w-xs font-medium uppercase tracking-widest">
            Sua agenda de disparos está vazia. <br/>Crie seu primeiro agendamento acima.
          </p>
        </div>
      ) : view === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className="bg-zinc-800 border-zinc-700 overflow-hidden group hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-black text-lg text-white mb-1 uppercase tracking-tight leading-tight">{schedule.name}</h4>
                    <p className="text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                      {schedule.campaign_name || 'Campanha não vinculada'}
                    </p>
                  </div>
                  <Switch 
                    checked={schedule.is_active}
                    onCheckedChange={() => toggleActive(schedule.id, schedule.is_active)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/30">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Próximo Disparo
                    </p>
                    <p className="text-xs font-black text-zinc-200">
                      {schedule.next_run_at ? format(new Date(schedule.next_run_at), "dd/MM 'às' HH:mm", { locale: ptBR }) : 'Pendente'}
                    </p>
                  </div>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/30">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Repeat className="h-2.5 w-2.5" /> Recorrência
                    </p>
                    <p className="text-xs font-black text-zinc-200 uppercase">
                      {schedule.recurrence === 'once' ? 'Único' : 
                       schedule.recurrence === 'daily' ? 'Diário' :
                       schedule.recurrence === 'weekly' ? 'Semanal' : 'Mensal'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                   <div className="flex items-center gap-2">
                     <div className={`w-2 h-2 rounded-full ${schedule.is_active ? 'bg-primary animate-pulse' : 'bg-zinc-700'}`} />
                     <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                       {schedule.is_active ? 'Operacional' : 'Em pausa'}
                     </span>
                   </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-white">
                     <MoreVertical className="h-4 w-4" />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-700 flex items-center justify-between bg-zinc-800/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} className="border-zinc-700 bg-zinc-900 text-zinc-400">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-black uppercase tracking-tighter text-white min-w-[150px] text-center">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="border-zinc-700 bg-zinc-900 text-zinc-400">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-primary" />
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Agendamentos Ativos</span>
            </div>
          </div>
          
          <div className="grid grid-cols-7 border-b border-zinc-700">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900/20">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 h-[600px]">
            {calendarDays.map((day, idx) => {
              const daySchedules = schedules.filter(s => s.next_run_at && isSameDay(new Date(s.next_run_at), day));
              const isCurrentMonth = isSameMonth(day, monthStart);
              
              return (
                <div 
                  key={idx} 
                  className={`border-r border-b border-zinc-700 p-2 group transition-colors flex flex-col ${
                    !isCurrentMonth ? 'bg-zinc-950/20' : 'bg-transparent hover:bg-zinc-700/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full ${
                      isToday(day) ? 'bg-primary text-black' : 
                      isCurrentMonth ? 'text-zinc-400' : 'text-zinc-700'
                    }`}>
                      {format(day, 'd')}
                    </span>
                  </div>
                  
                  <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
                    {daySchedules.map(s => (
                      <div 
                        key={s.id} 
                        className={`text-[9px] font-bold uppercase tracking-tighter p-1.5 rounded-md truncate border ${
                          s.is_active ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-zinc-900/50 border-zinc-800 text-zinc-600'
                        }`}
                        title={s.name}
                      >
                        {format(new Date(s.next_run_at!), 'HH:mm')} - {s.name}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
