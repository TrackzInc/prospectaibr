import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Palette,
  Users,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";

export const Route = createFileRoute("/etiquetas")({
  component: EtiquetasPage,
});

type TagItem = {
  id: string;
  name: string;
  color: string;
  count?: number;
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

function EtiquetasPage() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data: tagsData, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .order('name');

      if (tagsError) throw tagsError;

      const { data: leadTags, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('tag_id');

      if (leadTagsError) throw leadTagsError;

      const counts: Record<string, number> = {};
      leadTags.forEach(lt => {
        counts[lt.tag_id] = (counts[lt.tag_id] || 0) + 1;
      });

      setTags(tagsData.map(t => ({
        ...t,
        count: counts[t.id] || 0
      })));
    } catch (err: any) {
      toast.error("Erro ao carregar etiquetas");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagName) {
      toast.error("Informe o nome da etiqueta");
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tags')
        .insert({
          user_id: user.id,
          name: tagName,
          color: selectedColor
        });

      if (error) throw error;

      toast.success("Etiqueta criada!");
      setIsModalOpen(false);
      setTagName("");
      fetchTags();
    } catch (err: any) {
      toast.error("Erro ao criar etiqueta");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteTag = async (id: string) => {
    const { error } = await supabase.from('tags').delete().eq('id', id);
    if (!error) {
      setTags(prev => prev.filter(t => t.id !== id));
      toast.success("Etiqueta excluída");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">ETIQUETAS</h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium uppercase tracking-widest flex items-center gap-2">
            Organize seus leads com marcadores
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">ORGANIZAÇÃO</Badge>
          </p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-black font-black px-6 h-10 text-xs tracking-widest shadow-[0_0_20px_rgba(170,255,0,0.2)]">
              <Plus className="h-4 w-4 mr-2" /> NOVA ETIQUETA
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-50 max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter">CRIAR ETIQUETA</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome da Etiqueta</Label>
                <Input 
                  placeholder="Ex: Lead Quente, Follow-up..." 
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 h-11"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cor</Label>
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

              <div className="space-y-2 pt-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Preview</Label>
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 flex items-center justify-center">
                  <Badge 
                    style={{ backgroundColor: selectedColor, color: selectedColor === '#AAFF00' ? 'black' : 'white' }}
                    className="px-3 py-1 font-black uppercase tracking-widest text-[10px]"
                  >
                    {tagName || "PREVIEW"}
                  </Badge>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)} className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">CANCELAR</Button>
              <Button onClick={handleCreateTag} disabled={submitting} className="bg-primary text-black font-black uppercase text-[10px] tracking-widest px-8">
                CRIAR AGORA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-800/50 rounded-xl animate-pulse" />)}
        </div>
      ) : tags.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800">
            <Tag className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-3xl font-black text-zinc-800 italic tracking-tighter uppercase mb-2">SEM ETIQUETAS</h3>
          <p className="text-zinc-600 text-sm max-w-xs font-medium uppercase tracking-widest">
            Sua organização começa aqui. <br/>Crie sua primeira etiqueta acima.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {tags.map((tag) => (
            <Card 
              key={tag.id} 
              className="bg-zinc-800 border-zinc-700 overflow-hidden group hover:border-zinc-500 transition-all duration-300 cursor-pointer"
              onClick={() => {
                 // In a real scenario, this would navigate to funil/search with a tag filter
                 toast.info(`Filtrando por: ${tag.name}`);
              }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <Badge 
                    style={{ backgroundColor: tag.color, color: tag.color === '#AAFF00' ? 'black' : 'white' }}
                    className="px-3 py-1 font-black uppercase tracking-widest text-[10px]"
                  >
                    {tag.name}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTag(tag.id);
                    }}
                    className="h-8 w-8 text-zinc-600 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex items-center gap-2 mt-auto">
                   <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700">
                      <Users className="h-4 w-4 text-zinc-500" />
                   </div>
                   <div>
                      <p className="text-xl font-black text-zinc-100">{tag.count || 0}</p>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Leads Vinculados</p>
                   </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
