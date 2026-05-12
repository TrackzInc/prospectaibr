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
  RefreshCw
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .not('pipeline_stage', 'is', null);

      if (error) throw error;
      setLeads(data || []);
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
    <div className="flex flex-col h-screen bg-muted/30">
      <header className="flex items-center justify-between px-8 py-6 border-b border-border/60 bg-white shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Funil de Vendas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie seus leads e acompanhe as negociações.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={fetchLeads} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
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
              <LeadCard lead={activeLead} isOverlay />
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
    <div className="flex flex-col w-80 shrink-0 bg-slate-100/50 rounded-xl border border-border/40 overflow-hidden">
      <div className="p-4 flex items-center justify-between bg-white/80 border-b border-border/40 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-700">{title}</h3>
          <Badge variant="secondary" className="bg-slate-200 text-slate-600 border-none font-medium px-2">
            {leads.length}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
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
      className={`group border-border/40 shadow-sm hover:shadow-md transition-all duration-200 bg-white ${isOverlay ? 'shadow-lg border-primary/20 ring-2 ring-primary/10' : ''}`}
    >
      <CardContent className="p-3.5 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 pr-6">
            <h4 className="font-semibold text-slate-800 truncate text-sm leading-tight mb-0.5">
              {lead.name}
            </h4>
            {lead.segment && (
              <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-medium uppercase tracking-wider text-primary border-primary/20 bg-primary/5">
                {lead.segment}
              </Badge>
            )}
          </div>
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-1 -mt-1 -mr-1 text-slate-300 group-hover:text-slate-400 transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-1.5">
          {lead.phone && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3 shrink-0" />
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
                      ? "fill-accent text-accent"
                      : "text-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5" />
              {new Date(lead.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            </div>
          </div>
        </div>

        {showNext && (
          <div className="pt-2 border-t border-border/40 mt-2 flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10 px-2"
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