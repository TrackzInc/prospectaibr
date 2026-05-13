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
  CheckCheck,
  Columns,
  Tag as TagIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/atendimento")({
  component: AtendimentoPage,
});

type Lead = {
  id: string;
  name: string;
  company_name: string | null;
  phone: string;
  segment: string | null;
  status: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number | null;
  tags?: Tag[];
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Message = {
  id: string;
  content: string;
  type: 'sent' | 'received';
  created_at: string | null;
};

function AtendimentoPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchLeads();
    fetchTags();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new as any;
          if (selectedLead && newMsg.lead_id === selectedLead.id) {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              content: newMsg.content,
              type: newMsg.type as 'sent' | 'received',
              created_at: newMsg.created_at
            }]);
          }
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedLead]);

  useEffect(() => {
    if (selectedLead) {
      fetchMessages(selectedLead.id);
      markAsRead(selectedLead.id);
    }
  }, [selectedLead?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchLeads = async () => {
    try {
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .order('last_message_at', { ascending: false });

      if (leadsError) throw leadsError;

      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('lead_id, tags(*)');

      if (leadTagsError) throw leadTagsError;

      const tagsByLead: Record<string, any[]> = {};
      (leadTagsData || []).forEach((lt: any) => {
        if (!tagsByLead[lt.lead_id]) tagsByLead[lt.lead_id] = [];
        if (lt.tags) tagsByLead[lt.lead_id].push(lt.tags);
      });

      const formattedLeads = leadsData.map(l => ({
        ...l,
        tags: tagsByLead[l.id] || []
      }));

      setLeads(formattedLeads);
      
      if (selectedLead) {
        const updatedSelected = formattedLeads.find(l => l.id === selectedLead.id);
        if (updatedSelected) setSelectedLead(updatedSelected);
      }
    } catch (err: any) {
      toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setAvailableTags(data);
  };

  const toggleTag = async (leadId: string, tag: Tag, isSelected: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isSelected) {
      await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tag.id);
    } else {
      await supabase
        .from('lead_tags')
        .insert({
          user_id: user.id,
          lead_id: leadId,
          tag_id: tag.id
        });
    }
    fetchLeads();
  };

  const fetchMessages = async (leadId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data as any[]).map(m => ({
        id: m.id,
        content: m.content,
        type: m.type as 'sent' | 'received',
        created_at: m.created_at
      })));
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

      const { data: config } = await supabase
        .from('evolution_config')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (config) {
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

      await supabase
        .from('leads')
        .update({
          last_message: newMessage,
          last_message_at: new Date().toISOString()
        })
        .eq('id', selectedLead.id);

      const formattedMsg: Message = {
        id: msgData.id,
        content: msgData.content,
        type: msgData.type as 'sent' | 'received',
        created_at: msgData.created_at
      };

      setMessages(prev => [...prev, formattedMsg]);
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
                      {(lead.company_name || lead.name).charAt(0).toUpperCase()}
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
                        {(lead.unread_count || 0) > 0 && (
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

      <div className="flex-1 flex flex-col bg-zinc-950/30">
        {selectedLead ? (
          <>
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-zinc-400" onClick={() => setSelectedLead(null)}>
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                   <div className="flex gap-1 mb-1">
                    {selectedLead.tags?.map(tag => (
                      <Badge 
                        key={tag.id}
                        style={{ backgroundColor: tag.color, color: tag.color === '#AAFF00' ? 'black' : 'white' }}
                        className="px-1.5 py-0 text-[8px] font-black uppercase tracking-widest border-none"
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 gap-2">
                      <TagIcon className="h-3 w-3" /> ETIQUETAS
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-zinc-200 w-48">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">Etiquetas</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-zinc-700" />
                    {availableTags.length === 0 ? (
                      <div className="p-2 text-[10px] text-zinc-500 italic">Nenhuma etiqueta criada</div>
                    ) : (
                      availableTags.map(tag => {
                        const isSelected = selectedLead.tags?.some(t => t.id === tag.id);
                        return (
                          <DropdownMenuCheckboxItem
                            key={tag.id}
                            checked={isSelected}
                            onCheckedChange={() => toggleTag(selectedLead.id, tag, !!isSelected)}
                            className="text-xs focus:bg-primary focus:text-black"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                              {tag.name}
                            </div>
                          </DropdownMenuCheckboxItem>
                        );
                      })
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  variant="outline" 
                  className="border-zinc-700 bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                  onClick={() => {
                    window.location.href = `/funil?leadId=${selectedLead.id}`;
                  }}
                >
                  MOVER FUNIL <Columns className="h-3 w-3 ml-2" />
                </Button>
                <Button variant="ghost" size="icon" className="text-zinc-500">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

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
                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm') : ''}
                      </span>
                      {msg.type === 'sent' && <CheckCheck className="h-3 w-3" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>

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
