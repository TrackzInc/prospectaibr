import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { 
  DndContext, 
  DragOverlay, 
  closestCorners, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Phone, 
  Star, 
  Calendar, 
  ChevronRight,
  GripVertical,
  Building2,
  Filter,
  RefreshCw,
  Tag as TagIcon
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/funil")({
  component: FunilPage,
});

const STAGES = [
  "Novo Lead",
  "Contato Iniciado",
  "Respondeu",
  "Em Negociação",
  "Fechado"
];

type Lead = {
  id: string;
  name: string;
  phone: string | null;
  rating: number | null;
  segment: string | null;
  created_at: string;
  pipeline_stage: string;
  tags?: Tag[];
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

function FunilPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('companies')
        .select('*')
        .not('pipeline_stage', 'is', null);

      if (leadsError) throw leadsError;

      // 2. Fetch all lead tags junction and tag details
      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('lead_id, tags(*)');

      if (leadTagsError) throw leadTagsError;

      // Group tags by lead_id
      const tagsByLead: Record<string, any[]> = {};
      leadTagsData.forEach((lt: any) => {
        if (!tagsByLead[lt.lead_id]) tagsByLead[lt.lead_id] = [];
        if (lt.tags) tagsByLead[lt.lead_id].push(lt.tags);
      });

      setLeads(leadsData.map(l => ({
        ...l,
        tags: tagsByLead[l.id] || []
      })));
    } catch (err: any) {
      toast.error("Erro ao carregar leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const updateLeadStage = async (leadId: string, newStage: string) => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ pipeline_stage: newStage })
        .eq('id', leadId);

      if (error) throw error;
      
      setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, pipeline_stage: newStage } : l
      ));
    } catch (err: any) {
      toast.error("Erro ao atualizar estágio: " + err.message);
      fetchLeads(); // Revert on error
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead) return;

    // Check if dropping over a column or another card
    const overStage = STAGES.includes(overId) 
      ? overId 
      : leads.find(l => l.id === overId)?.pipeline_stage;

    if (overStage && activeLead.pipeline_stage !== overStage) {
      setLeads(prev => prev.map(l => 
        l.id === activeId ? { ...l, pipeline_stage: overStage } : l
      ));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const activeLead = leads.find(l => l.id === leadId);
    if (!activeLead) return;

    // Persist the change
    await updateLeadStage(leadId, activeLead.pipeline_stage);
  };

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    STAGES.forEach(stage => grouped[stage] = []);
    leads.forEach(lead => {
      if (grouped[lead.pipeline_stage]) {
        grouped[lead.pipeline_stage].push(lead);
      }
    });
    return grouped;
  }, [leads]);

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-50">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-zinc-50">Funil de Vendas</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">Gerencie seus leads e acompanhe as negociações.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchLeads} className="gap-2 border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-zinc-50 font-bold">
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            ATUALIZAR
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden p-8">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex h-full gap-6 overflow-x-auto pb-4">
            {STAGES.map(stage => (
              <KanbanColumn 
                key={stage} 
                id={stage} 
                title={stage} 
                leads={leadsByStage[stage] || []} 
                onMoveLead={updateLeadStage}
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeLead ? (
              <LeadCard lead={activeLead} isOverlay onRefresh={fetchLeads} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function KanbanColumn({ id, title, leads, onMoveLead }: { 
  id: string; 
  title: string; 
  leads: Lead[];
  onMoveLead: (id: string, nextStage: string) => void;
}) {
  const nextStage = STAGES[STAGES.indexOf(title) + 1];

  return (
    <div className="flex flex-col w-80 shrink-0 bg-zinc-800/30 rounded-lg border border-zinc-800 overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-zinc-800/50 border-b border-zinc-800 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{title}</h3>
          <Badge variant="secondary" className="bg-zinc-700 text-primary border-none font-bold text-[10px] h-5 px-1.5">
            {leads.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-400">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-3">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[200px]">
            {leads.map(lead => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onNext={() => nextStage && onMoveLead(lead.id, nextStage)} 
                showNext={!!nextStage}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

function LeadCard({ lead, onNext, showNext, isOverlay }: { 
  lead: Lead; 
  onNext?: () => void;
  showNext?: boolean;
  isOverlay?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging && !isOverlay) {
    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="h-32 bg-slate-200/50 rounded-lg border-2 border-dashed border-slate-300" 
      />
    );
  }

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`group border-zinc-700 shadow-none hover:border-zinc-500 transition-all duration-200 bg-zinc-800 ${isOverlay ? 'shadow-2xl border-primary/50 ring-1 ring-primary/20 z-50' : ''}`}
    >
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex flex-wrap gap-1 mb-2">
              {lead.tags?.map(tag => (
                <Badge 
                  key={tag.id}
                  style={{ backgroundColor: tag.color, color: tag.color === '#AAFF00' ? 'black' : 'white' }}
                  className="px-1.5 py-0 text-[8px] font-black uppercase tracking-widest border-none"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
            <h4 className="font-bold text-zinc-50 truncate text-sm leading-tight mb-2">
              {lead.name}
            </h4>
            {lead.segment && (
              <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-bold uppercase tracking-widest text-primary border-primary/20 bg-primary/5">
                {lead.segment}
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing p-1 -mt-1 -mr-1 text-zinc-600 group-hover:text-zinc-400 transition-colors"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600 hover:text-primary">
                  <TagIcon className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-800 border-zinc-700 text-zinc-200 w-48">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">Etiquetas</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-700" />
                {availableTags.length === 0 ? (
                  <div className="p-2 text-[10px] text-zinc-500 italic">Nenhuma etiqueta criada</div>
                ) : (
                  availableTags.map(tag => {
                    const isSelected = lead.tags?.some(t => t.id === tag.id);
                    return (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        checked={isSelected}
                        onCheckedChange={() => toggleTag(tag, !!isSelected)}
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
          </div>
        </div>

        <div className="space-y-2">
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <Phone className="h-3 w-3 shrink-0 text-primary/70" />
              <span className="truncate">{lead.phone}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${
                    i <= Math.round(lead.rating || 0)
                      ? "fill-primary text-primary"
                      : "text-zinc-700"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        </div>

        {showNext && (
          <div className="pt-3 border-t border-zinc-700 mt-2 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] font-bold uppercase tracking-widest gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
            >
              Avançar
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}