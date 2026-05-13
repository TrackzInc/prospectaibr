import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Copy, 
  Edit2, 
  Trash2, 
  FileText,
  Search,
  Check,
  Tag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scripts")({
  component: ScriptsPage,
});

type Script = {
  id: string;
  title: string;
  niche: string;
  content: string;
  color: string;
  created_at: string;
};

const PRESET_COLORS = [
  { name: 'Verde Neon', value: '#AAFF00' },
  { name: 'Azul', value: '#00D1FF' },
  { name: 'Rosa', value: '#FF00E5' },
  { name: 'Laranja', value: '#FF8A00' },
  { name: 'Vermelho', value: '#FF2E00' },
  { name: 'Roxo', value: '#9E00FF' },
  { name: 'Zinc', value: '#71717a' },
];

function ScriptsPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [niche, setNiche] = useState("");
  const [content, setContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);

  const fetchScripts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar scripts: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts();
  }, []);

  const handleSaveScript = async () => {
    if (!title || !niche || !content) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingScript) {
        const { error } = await supabase
          .from('scripts')
          .update({
            title,
            niche,
            content,
            color: selectedColor
          })
          .eq('id', editingScript.id);
        
        if (error) throw error;
        toast.success("Script atualizado!");
      } else {
        const { error } = await supabase
          .from('scripts')
          .insert({
            user_id: user.id,
            title,
            niche,
            content,
            color: selectedColor
          });
        
        if (error) throw error;
        toast.success("Script criado!");
      }

      setIsModalOpen(false);
      resetForm();
      fetchScripts();
    } catch (err: any) {
      toast.error("Erro ao salvar script: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setNiche("");
    setContent("");
    setSelectedColor(PRESET_COLORS[0].value);
    setEditingScript(null);
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setTitle(script.title);
    setNiche(script.niche);
    setContent(script.content);
    setSelectedColor(script.color);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('scripts').delete().eq('id', id);
      if (error) throw error;
      setScripts(prev => prev.filter(s => s.id !== id));
      toast.success("Script excluído");
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Script copiado para a área de transferência!");
  };

  const filteredScripts = scripts.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.niche.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedScripts = useMemo(() => {
    const groups: Record<string, Script[]> = {};
    filteredScripts.forEach(s => {
      if (!groups[s.niche]) groups[s.niche] = [];
      groups[s.niche].push(s);
    });
    return groups;
  }, [filteredScripts]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">SCRIPTS DE ABORDAGEM</h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
            Modelos de mensagens de alta conversão
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">CONVERSÃO</Badge>
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-black font-black px-8 h-12 text-xs tracking-widest shadow-[0_0_20px_rgba(170,255,0,0.2)]">
              <Plus className="h-4 w-4 mr-2" />
              NOVO SCRIPT
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl bg-zinc-900 border-zinc-800 text-zinc-50">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter">
                {editingScript ? 'Editar Script' : 'Novo Script de Abordagem'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Título do Script</Label>
                  <Input 
                    placeholder="Ex: Primeira Abordagem Fria" 
                    className="bg-zinc-800 border-zinc-700 h-12"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nicho / Categoria</Label>
                  <Input 
                    placeholder="Ex: Clínicas, Advocacia..." 
                    className="bg-zinc-800 border-zinc-700 h-12"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cor do Destaque</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color.value ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.3)]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Conteúdo do Script</Label>
                <Textarea 
                  placeholder="Olá {{nome_empresa}}, vi seu perfil no Instagram..." 
                  className="bg-zinc-800 border-zinc-700 min-h-[200px] text-sm leading-relaxed"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter className="mt-8">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">CANCELAR</Button>
              <Button 
                onClick={handleSaveScript} 
                disabled={submitting}
                className="bg-primary text-black font-black uppercase text-[10px] tracking-widest px-8 h-12"
              >
                {editingScript ? 'SALVAR ALTERAÇÕES' : 'CRIAR SCRIPT AGORA'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="relative mb-12">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
        <Input 
          placeholder="Buscar por título ou nicho..." 
          className="bg-zinc-800/50 border-zinc-800 h-14 pl-12 text-zinc-200 focus:bg-zinc-800 transition-all text-lg"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Scripts List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-800/50 rounded-2xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : Object.keys(groupedScripts).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
            <FileText className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-3xl font-black text-zinc-800 italic tracking-tighter uppercase mb-2">SEM SCRIPTS</h3>
          <p className="text-zinc-600 text-sm max-w-xs font-medium uppercase tracking-widest">
            Sua prospecção começa com a mensagem certa. <br/>Crie seu primeiro script acima.
          </p>
        </div>
      ) : (
        <div className="space-y-16">
          {Object.entries(groupedScripts).map(([niche, nicheScripts]) => (
            <div key={niche} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-100">{niche}</h2>
                <div className="h-px flex-1 bg-gradient-to-r from-zinc-800 to-transparent" />
                <Badge variant="outline" className="text-zinc-500 border-zinc-800">{nicheScripts.length} SCRIPTS</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {nicheScripts.map((script) => (
                  <Card key={script.id} className="bg-zinc-800 border-zinc-700 overflow-hidden group hover:border-primary/30 transition-all duration-500 shadow-2xl relative">
                    <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: script.color }} />
                    <CardContent className="p-8">
                      <div className="flex justify-between items-start mb-6">
                        <Badge 
                          style={{ backgroundColor: `${script.color}15`, color: script.color, borderColor: `${script.color}30` }}
                          className="px-3 py-1 font-black uppercase tracking-widest text-[10px] border"
                        >
                          {script.niche}
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(script)}
                            className="h-8 w-8 text-zinc-500 hover:text-white hover:bg-zinc-700"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(script.id)}
                            className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <h3 className="text-xl font-black text-white mb-4 line-clamp-1 group-hover:text-primary transition-colors uppercase tracking-tight">
                        {script.title}
                      </h3>
                      
                      <div className="bg-zinc-900/50 rounded-xl p-4 mb-8 border border-zinc-700/50 relative group/preview min-h-[120px]">
                        <p className="text-xs text-zinc-400 leading-relaxed italic line-clamp-4">
                          "{script.content}"
                        </p>
                      </div>

                      <Button 
                        onClick={() => copyToClipboard(script.content)}
                        className="w-full bg-primary hover:bg-primary/90 text-black font-black h-14 tracking-widest text-xs shadow-[0_0_20px_rgba(170,255,0,0.1)] group/btn"
                      >
                        <Copy className="h-4 w-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                        COPIAR SCRIPT
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}