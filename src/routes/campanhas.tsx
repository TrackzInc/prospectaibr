import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  Send, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Layout, 
  Filter, 
  MessageSquare, 
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/campanhas")({
  component: CampanhasPage,
});

type Campaign = {
  id: string;
  name: string;
  status: 'Active' | 'Paused' | 'Completed' | 'Draft';
  message_template: string;
  delay_seconds: number;
  total_leads: number;
  sent_leads: number;
  failed_leads: number;
  pending_leads: number;
  created_at: string;
};

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  segment: string | null;
  city_state: string | null;
  pipeline_stage: string | null;
};

function CampanhasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  
  // Create Campaign State
  const [newName, setNewName] = useState("");
  const [delay, setDelay] = useState(60);
  const [message, setMessage] = useState("");
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [segmentFilter, setSegmentFilter] = useState<string>("all");
  const [maxLeadsToSelect, setMaxLeadsToSelect] = useState<string>("");

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data as any[]) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar campanhas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    const { data, error } = await supabase.from('companies').select('*');
    if (!error) setLeads(data || []);
  };

  useEffect(() => {
    fetchCampaigns();
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const stageMatch = stageFilter === "all" || lead.pipeline_stage === stageFilter;
      const segmentMatch = segmentFilter === "all" || lead.segment === segmentFilter;
      return stageMatch && segmentMatch && lead.phone;
    });
  }, [leads, stageFilter, segmentFilter]);

  const segments = useMemo(() => {
    const s = new Set(leads.map(l => l.segment).filter(Boolean));
    return Array.from(s);
  }, [leads]);

  const stages = ["Novo Lead", "Contato Iniciado", "Respondeu", "Em Negociação", "Fechado"];

  const replaceVariables = (text: string, lead: Lead) => {
    return text
      .replace(/{{nome_empresa}}/g, lead.name)
      .replace(/{{segmento}}/g, lead.segment || "")
      .replace(/{{cidade}}/g, lead.city_state || "");
  };

  const createCampaign = async () => {
    if (!newName || !message || selectedLeads.length === 0) {
      toast.error("Preencha todos os campos e selecione pelo menos um lead");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaign, error } = await supabase
        .from('campaigns')
        .insert({
          user_id: user.id,
          name: newName,
          message_template: message,
          delay_seconds: delay,
          total_leads: selectedLeads.length,
          pending_leads: selectedLeads.length,
          status: 'Draft'
        })
        .select()
        .single();

      if (error) throw error;

      // Create logs for each lead
      const logs = selectedLeads.map(leadId => ({
        campaign_id: campaign.id,
        lead_id: leadId,
        status: 'Pending'
      }));

      await supabase.from('campaign_logs').insert(logs);

      toast.success("Campanha criada com sucesso!");
      setIsCreateModalOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (err: any) {
      toast.error("Erro ao criar campanha: " + err.message);
    }
  };

  const resetForm = () => {
    setNewName("");
    setMessage("");
    setDelay(60);
    setSelectedLeads([]);
    setMaxLeadsToSelect("");
  };

  const deleteCampaign = async (id: string) => {
    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id);
      if (error) throw error;
      setCampaigns(prev => prev.filter(c => c.id !== id));
      toast.success("Campanha excluída");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const toggleCampaignStatus = async (campaign: Campaign) => {
    const newStatus = campaign.status === 'Active' ? 'Paused' : 'Active';
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ status: newStatus })
        .eq('id', campaign.id);
      
      if (error) throw error;
      
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id ? { ...c, status: newStatus as any } : c
      ));

      if (newStatus === 'Active') {
        startDispatchEngine(campaign.id);
      }
    } catch (err: any) {
      toast.error("Erro ao atualizar status: " + err.message);
    }
  };

  const startDispatchEngine = async (campaignId: string) => {
    // Basic implementation of dispatch logic
    // In a real app, this should probably be a more robust loop or Edge Function
    toast.info("Iniciando disparos...");
    
    // Trigger first immediate run, then the actual engine should handle it
    // For this prototype, we'll simulate the update
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">CAMPANHAS</h1>
          <p className="text-zinc-400 text-sm mt-2">Gerencie e acompanhe seus disparos em massa via WhatsApp.</p>
        </div>

        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-black font-black px-8 h-12 text-xs tracking-widest shadow-[0_0_20px_rgba(170,255,0,0.2)]">
              <Plus className="h-4 w-4 mr-2" />
              NOVA CAMPANHA
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl bg-zinc-900 border-zinc-800 text-zinc-50 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Configurar Nova Campanha</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Nome da Campanha</label>
                  <Input 
                    placeholder="Ex: Promoção de Verão" 
                    className="bg-zinc-800 border-zinc-700 h-12"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Delay entre mensagens</label>
                    <Badge variant="outline" className="text-primary border-primary/20">{delay}s</Badge>
                  </div>
                  <Slider 
                    value={[delay]} 
                    min={30} 
                    max={300} 
                    step={10} 
                    onValueChange={(v) => setDelay(v[0])}
                    className="py-4"
                  />
                  <p className="text-[10px] text-zinc-500 italic">Recomendado: 60s+ para evitar bloqueios.</p>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Filtrar Leads do Funil</label>
                  <div className="grid grid-cols-2 gap-3">
                    <Select value={stageFilter} onValueChange={setStageFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 h-10 text-xs">
                        <SelectValue placeholder="Etapa" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectItem value="all">Todas Etapas</SelectItem>
                        {stages.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                      <SelectTrigger className="bg-zinc-800 border-zinc-700 h-10 text-xs">
                        <SelectValue placeholder="Segmento" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-200">
                        <SelectItem value="all">Todos Segmentos</SelectItem>
                        {segments.map(s => <SelectItem key={s || 'unknown'} value={s || 'unknown'}>{s || 'Desconhecido'}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-zinc-950/50 rounded-lg p-4 border border-zinc-800 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase">{filteredLeads.length} Leads Encontrados</span>
                        <span className="text-[10px] font-bold text-primary uppercase">{selectedLeads.length} Selecionados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-zinc-900 border border-zinc-700 rounded h-7 overflow-hidden">
                          <Input 
                            type="number" 
                            placeholder="Qtd" 
                            className="w-12 h-full border-none bg-transparent text-[10px] focus-visible:ring-0 px-2"
                            value={maxLeadsToSelect}
                            onChange={(e) => setMaxLeadsToSelect(e.target.value)}
                          />
                          <button 
                            onClick={handleApplyLimit}
                            className="bg-zinc-800 px-2 h-full text-[10px] font-bold text-zinc-300 hover:bg-zinc-700 transition-colors"
                          >
                            OK
                          </button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] font-bold text-primary p-0"
                          onClick={() => setSelectedLeads(filteredLeads.map(l => l.id))}
                        >
                          TUDO
                        </Button>
                      </div>
                    </div>
                    {filteredLeads.map(lead => (
                      <div key={lead.id} className="flex items-center gap-3 py-1.5">
                        <Checkbox 
                          id={lead.id} 
                          checked={selectedLeads.includes(lead.id)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedLeads([...selectedLeads, lead.id]);
                            else setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                          }}
                          className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                        />
                        <label htmlFor={lead.id} className="text-xs text-zinc-300 truncate cursor-pointer">{lead.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Mensagem</label>
                    <div className="flex gap-2">
                      {['nome_empresa', 'cidade', 'segmento'].map(v => (
                        <button
                          key={v}
                          onClick={() => setMessage(message + ` {{${v}}}`)}
                          className="text-[9px] bg-zinc-800 hover:bg-zinc-700 text-zinc-400 px-2 py-1 rounded border border-zinc-700 transition-colors"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea 
                    placeholder="Olá {{nome_empresa}}..." 
                    className="bg-zinc-800 border-zinc-700 min-h-[160px] text-sm leading-relaxed"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Preview</label>
                  <div className="bg-zinc-950 rounded-xl p-4 border border-zinc-800 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                    <p className="text-xs text-zinc-400 leading-relaxed italic">
                      {filteredLeads[0] 
                        ? replaceVariables(message || "Digite sua mensagem para ver o preview...", filteredLeads[0])
                        : "Selecione leads para ver o preview..."}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageSquare className="h-2.5 w-2.5 text-primary" />
                      </div>
                      <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">WhatsApp Preview</span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={createCampaign}
                  className="w-full bg-primary hover:bg-primary/90 text-black font-black h-12 tracking-widest mt-4"
                >
                  CRIAR E INICIAR CAMPANHA
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-800/50 rounded-xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700/50">
            <Layout className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-2xl font-black text-zinc-700 italic tracking-tighter uppercase mb-2">SEM CAMPANHAS</h3>
          <p className="text-zinc-500 text-sm max-w-xs">Inicie sua primeira campanha de disparos agora mesmo.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((camp) => (
            <Card key={camp.id} className="bg-zinc-800 border-zinc-700 overflow-hidden group hover:border-zinc-500 transition-all duration-300 shadow-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1 uppercase tracking-tight">{camp.name}</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        camp.status === 'Active' ? 'bg-primary animate-pulse' : 
                        camp.status === 'Completed' ? 'bg-blue-500' : 'bg-zinc-500'
                      }`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {camp.status === 'Active' ? 'Em progresso' : 
                         camp.status === 'Paused' ? 'Pausada' : 
                         camp.status === 'Completed' ? 'Concluída' : 'Rascunho'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteCampaign(camp.id)}
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    <span>Progresso</span>
                    <span>{Math.round((camp.sent_leads / camp.total_leads) * 100 || 0)}%</span>
                  </div>
                  <Progress value={(camp.sent_leads / camp.total_leads) * 100} className="h-1.5 bg-zinc-900" />
                  
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-700/30 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">Total</p>
                      <p className="text-sm font-black text-white">{camp.total_leads}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-700/30 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">Enviados</p>
                      <p className="text-sm font-black text-primary">{camp.sent_leads}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-700/30 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">Pendentes</p>
                      <p className="text-sm font-black text-zinc-400">{camp.pending_leads}</p>
                    </div>
                    <div className="bg-zinc-900/50 p-2 rounded border border-zinc-700/30 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase">Falhas</p>
                      <p className="text-sm font-black text-red-500">{camp.failed_leads}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  {camp.status === 'Completed' ? (
                    <Button 
                      className="flex-1 bg-zinc-700 text-zinc-400 cursor-default font-bold text-[10px] tracking-widest uppercase"
                      disabled
                    >
                      CAMPANHA CONCLUÍDA
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => toggleCampaignStatus(camp)}
                      className={`flex-1 font-bold text-[10px] tracking-widest uppercase transition-all duration-300 ${
                        camp.status === 'Active' 
                          ? 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white' 
                          : 'bg-primary text-black hover:bg-primary/90'
                      }`}
                    >
                      {camp.status === 'Active' ? (
                        <><Pause className="h-3 w-3 mr-2" /> PAUSAR CAMPANHA</>
                      ) : (
                        <><Play className="h-3 w-3 mr-2" /> {camp.status === 'Draft' ? 'INICIAR CAMPANHA' : 'RETOMAR CAMPANHA'}</>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}