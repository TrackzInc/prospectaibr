import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  Search, 
  Send, 
  MoreVertical, 
  Phone, 
  User, 
  ArrowRight,
  ChevronLeft,
  Check,
  CheckCheck
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/atendimento")({
  component: AtendimentoPage,
});

type Lead = {
  id: string;
  name: string;
  company_name: string;
  phone: string;
  segment: string;
  status: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
};

type Message = {
  id: string;
  content: string;
  type: 'sent' | 'received';
  created_at: string;
};

function AtendimentoPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeads();
    
    // Subscribe to new messages
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as Message;
          // If message is for currently selected lead, update messages
          // Note: In a real app, you'd verify the lead_id
          setMessages(prev => [...prev, newMsg]);
          fetchLeads(); // Refresh list to update previews
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      markAsRead(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar mensagens");
    }
  };

  const markAsRead = async (leadId: string) => {
    await supabase
      .from('leads')
      .update({ unread_count: 0 })
      .eq('id', leadId);
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, unread_count: 0 } : l));
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || sending) return;

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Send to Evolution API (Simplified integration)
      // In a real scenario, you'd fetch the evolution config here
      const { data: config } = await supabase
        .from('evolution_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (config) {
        // Find an active instance
        const { data: instances } = await supabase
          .from('whatsapp_instances')
          .select('*')
          .eq('status', 'connected')
          .limit(1);

        if (instances && instances.length > 0) {
          const instance = instances[0];
          await fetch(`${config.api_url}/message/sendText/${instance.instance_name}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.api_key
            },
            body: JSON.stringify({
              number: selectedLead.phone,
              text: newMessage
            })
          });
        }
      }

      // 2. Save to Supabase
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .insert({
          user_id: user.id,
          lead_id: selectedLead.id,
          content: newMessage,
          type: 'sent'
        })
        .select()
        .single();

      if (msgError) throw msgError;

      // 3. Update Lead preview
      await supabase
        .from('leads')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      setMessages(prev => [...prev, msgData]);
      setNewMessage("");
      fetchLeads();
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(search.toLowerCase()) || 
    l.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-zinc-900 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-[400px] border-r border-zinc-800 flex flex-col bg-zinc-900">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter mb-6">ATENDIMENTO</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Buscar conversas..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-zinc-800 border-zinc-700 pl-10 h-10 text-zinc-200"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-zinc-800/20 animate-pulse rounded-lg mx-2" />
              ))
            ) : filteredLeads.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm">Nenhuma conversa encontrada</div>
            ) : (
              filteredLeads.map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                    selectedLead?.id === lead.id 
                      ? 'bg-zinc-800 border border-zinc-700' 
                      : 'hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <Avatar className="h-12 w-12 border-2 border-zinc-800">
                    <AvatarFallback className="bg-primary text-black font-bold">
                      {lead.company_name?.charAt(0).toUpperCase() || lead.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-zinc-100 truncate text-sm uppercase tracking-tight">
                        {lead.company_name || lead.name}
                      </h3>
                      <span className="text-[10px] text-zinc-500 font-medium">
                        {lead.last_message_at ? format(new Date(lead.last_message_at), 'HH:mm', { locale: ptBR }) : ''}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-zinc-500 truncate pr-4">
                        {lead.last_message || 'Inicie uma conversa'}
                      </p>
                      <div className="flex items-center gap-2">
                        {lead.unread_count > 0 && (
                          <Badge className="bg-primary hover:bg-primary text-black font-black text-[10px] h-5 min-w-[20px] px-1 justify-center rounded-full">
                            {lead.unread_count}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-zinc-700 text-zinc-400 bg-zinc-900/50">
                          {lead.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col bg-zinc-950/30">
        {selectedLead ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400" onClick={() => setSelectedLead(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h2 className="font-black text-white uppercase tracking-tight text-lg leading-tight">{selectedLead.name}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-zinc-500 flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {selectedLead.phone}
                    </span>
                    <span className="text-xs text-zinc-500 border-l border-zinc-800 pl-3">
                      {selectedLead.segment || 'Sem segmento'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700">
                  MOVER FUNIL <ArrowRight className="h-3 w-3 ml-2" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-500">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-[url('https://w0.peakpx.com/wallpaper/508/606/wallpaper-whatsapp-dark-mode-background-patterns.jpg')] bg-repeat bg-center opacity-90"
            >
              <div className="bg-zinc-900/80 backdrop-blur-sm p-2 rounded-lg text-[10px] text-zinc-500 text-center max-w-xs mx-auto border border-zinc-800/50 uppercase tracking-widest font-bold">
                Início da conversa com {selectedLead.company_name || selectedLead.name}
              </div>

              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'sent' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl relative shadow-xl ${
                    msg.type === 'sent' 
                      ? 'bg-primary text-black rounded-tr-none' 
                      : 'bg-zinc-800 text-zinc-100 rounded-tl-none border border-zinc-700/50'
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center justify-end gap-1 mt-1 ${msg.type === 'sent' ? 'text-black/60' : 'text-zinc-500'}`}>
                      <span className="text-[9px] font-bold">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </span>
                      {msg.type === 'sent' && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
              <div className="flex gap-4 max-w-5xl mx-auto">
                <Input 
                  placeholder="Digite sua mensagem..." 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  className="bg-zinc-800 border-zinc-700 h-12 text-zinc-100"
                />
                <Button 
                  onClick={sendMessage}
                  disabled={sending}
                  className="bg-primary hover:bg-primary/90 text-black font-black w-12 h-12 rounded-xl shadow-[0_0_20px_rgba(170,255,0,0.2)] p-0"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-2xl">
              <User className="h-12 w-12 text-zinc-800" />
            </div>
            <h3 className="text-3xl font-black text-zinc-800 italic tracking-tighter uppercase">SELECIONE UMA CONVERSA</h3>
            <p className="text-zinc-600 text-sm max-w-xs mt-2 font-medium">Escolha um lead na lista lateral para iniciar o atendimento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
