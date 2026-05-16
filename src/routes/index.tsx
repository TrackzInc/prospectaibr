import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useMemo, KeyboardEvent } from "react";
import {
  Search as SearchIcon,
  Download,
  Phone,
  Globe,
  MapPin,
  Star,
  Building2,
  TrendingUp,
  PhoneCall,
  Save,
  Inbox,
  Filter,
  Mail,
  ExternalLink,
  History,
  Calendar,
  BarChart3,
  Users,
  Target,
  LayoutDashboard,
  Plus,
  Columns,
  X,
  ChevronDown,
  Brain
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart } from "@/components/ui/area-chart";
import AreaChartXS from "@/components/ui/area-chart-xs";
import IncidentReportCard from "@/components/ui/incident-bar-chart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ProspectAI — Prospecção inteligente de empresas" },
      {
        name: "description",
        content:
          "Encontre, qualifique e exporte empresas por segmento e localização com o ProspectAI.",
      },
    ],
  }),
  component: Index,
});

type Company = {
  id: string;
  name: string;
  phone: string | null;
  website: string | null;
  address: string;
  rating: number;
  reviews: number;
  open: boolean;
  thumbnail?: string | null;
  pipeline_stage?: string | null;
  tags?: Tag[];
  city?: string;
  isAlreadyInFunnel?: boolean;
  score?: number;
};

type Tag = {
  id: string;
  name: string;
  color: string;
};

type SearchHistory = {
  id: string;
  segment: string;
  location: string;
  leads_count: number;
  created_at: string;
};

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i <= Math.round(rating)
                ? "fill-primary text-primary"
                : "text-zinc-700"
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-zinc-300">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <Card className="bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition-colors shadow-none">
      <CardContent className="flex flex-col items-start gap-4 p-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-zinc-700 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            {label}
          </p>
          <p className="mt-2 text-3xl font-bold text-zinc-50 tracking-tight">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Index() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/" }) as any;
  const currentTab = searchParams.tab || "dashboard";

  const [apiKey, setApiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem("serp_api_key") : "") || "");
  const [segment, setSegment] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchProgress, setSearchProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<Company[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<SearchHistory | null>(null);
  const [historyLeads, setHistoryLeads] = useState<Company[]>([]);
  const [loadingHistoryLeads, setLoadingHistoryLeads] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>("all");
  const [funnelPhones, setFunnelPhones] = useState<Set<string>>(new Set());
  const [hideExistingInFunnel, setHideExistingInFunnel] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [onlyHighScores, setOnlyHighScores] = useState(false);
  const [onlyNoWebsite, setOnlyNoWebsite] = useState(false);

  useEffect(() => {
    fetchHistory();
    fetchAllCompanies();
    fetchTags();
    fetchFunnelPhones();
  }, []);

  const fetchFunnelPhones = async () => {
    const { data } = await supabase.from('contacts' as any).select('phone');
    if (data) {
      const phones = new Set(data.map((c: any) => c.phone).filter(Boolean));
      setFunnelPhones(phones);
    }
  };

  const fetchTags = async () => {
    const { data } = await supabase.from('tags').select('*').order('name');
    if (data) setAvailableTags(data);
  };

  const fetchAllCompanies = async () => {
    try {
      setLoadingStats(true);
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*');
      
      if (companiesError) throw companiesError;

      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from('lead_tags')
        .select('lead_id, tags(*)');

      if (leadTagsError) throw leadTagsError;

      const tagsByLead: Record<string, any[]> = {};
      (leadTagsData || []).forEach((lt: any) => {
        if (!tagsByLead[lt.lead_id]) tagsByLead[lt.lead_id] = [];
        if (lt.tags) tagsByLead[lt.lead_id].push(lt.tags);
      });

      setAllCompanies(companiesData.map(c => ({
        ...c,
        tags: tagsByLead[c.id] || []
      })));
    } catch (err) {
      console.error("Erro ao carregar empresas para dashboard:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchHistoryLeads = async (historyItem: SearchHistory) => {
    try {
      setLoadingHistoryLeads(true);
      setSelectedHistory(historyItem);
      
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('segment', historyItem.segment)
        .eq('city_state', historyItem.location);

      if (error) throw error;
      
      const mappedLeads: Company[] = (data || []).map(res => ({
        id: res.id,
        name: res.name,
        phone: res.phone,
        website: res.website,
        address: res.address || "",
        rating: Number(res.rating) || 0,
        reviews: res.reviews || 0,
        open: res.is_open ?? false,
      }));
      
      setHistoryLeads(mappedLeads);
    } catch (err) {
      console.error("Erro ao carregar leads do histórico:", err);
      toast.error("Erro ao carregar leads deste histórico");
    } finally {
      setLoadingHistoryLeads(false);
    }
  };


  // Filters
  const [minRating, setMinRating] = useState("0");
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [onlyWithWebsite, setOnlyWithWebsite] = useState(false);

  const calculateScore = (company: Partial<Company>) => {
    let score = 0;
    if (company.phone) score += 25;
    if (company.website) score += 20;
    if ((company.rating || 0) >= 4.5) score += 20;
    if ((company.reviews || 0) >= 50) score += 15;
    if (company.open) score += 10;
    if (company.thumbnail) score += 10;
    return score;
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: "EXCELENTE", color: "bg-[#aaff00]/15 text-[#aaff00] border-[#aaff00]/30" };
    if (score >= 70) return { label: "MUITO BOM", color: "bg-success/15 text-success border-success/30" };
    if (score >= 50) return { label: "BOM", color: "bg-warning/15 text-warning border-warning/30" };
    return { label: "MÉDIO", color: "bg-zinc-500/15 text-zinc-500 border-zinc-700" };
  };

  const filteredResults = useMemo(() => {
    if (!results) return null;
    let filtered = results.filter((r) => {
      const isExisting = r.phone ? funnelPhones.has(r.phone) : false;
      if (hideExistingInFunnel && isExisting) return false;

      const ratingMatch = r.rating >= parseFloat(minRating);
      const phoneMatch = onlyWithPhone ? !!r.phone : true;
      const websiteMatch = onlyWithWebsite ? !!r.website : true;
      const noWebsiteMatch = onlyNoWebsite ? !r.website : true;
      const scoreMatch = (r.score || 0) >= minScore;
      const highAndVeryHighMatch = onlyHighScores ? (r.score || 0) >= 70 : true;
      
      const companyFromAll = allCompanies.find(c => c.name === r.name && c.address === r.address);
      const tagMatch = selectedTagFilter === "all" || (companyFromAll?.tags?.some((t: any) => t.id === selectedTagFilter));

      return ratingMatch && phoneMatch && websiteMatch && noWebsiteMatch && tagMatch && scoreMatch && highAndVeryHighMatch;
    });

    return [...filtered].sort((a, b) => (b.score || 0) - (a.score || 0));
  }, [results, minRating, onlyWithPhone, onlyWithWebsite, onlyNoWebsite, allCompanies, selectedTagFilter, funnelPhones, hideExistingInFunnel, minScore, onlyHighScores]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segment.trim() || locations.length === 0) {
      toast.error("Informe segmento e pelo menos uma cidade");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Configure sua SerpApi Key no topo");
      return;
    }

    setLoading(true);
    setResults(null);
    setSearchProgress({ current: 0, total: locations.length });

    try {
      const searchPromises = locations.map(async (locationItem) => {
        try {
          const { data, error } = await supabase.functions.invoke('google-places-proxy', {
            body: { 
              action: 'search', 
              apiKey, 
              params: { q: segment, location: locationItem } 
            }
          });

          if (error) throw error;
          if (data.error) throw new Error(data.error);

          const localResults = data.local_results || [];
          const detailedResults: Company[] = localResults.map((res: any) => ({
            id: res.place_id || Math.random().toString(36).substr(2, 9),
            name: res.title,
            phone: res.phone || null,
            website: res.website || null,
            address: res.address,
            rating: res.rating || 0,
            reviews: res.reviews || 0,
            open: res.operating_hours?.status === "Open" || res.operating_hours?.status === "Aberto",
            thumbnail: res.thumbnail || null,
            city: locationItem
          }));

          setSearchProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return detailedResults;
        } catch (err) {
          console.error(`Erro ao buscar em ${locationItem}:`, err);
          setSearchProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return [];
        }
      });

      const allResultsArrays = await Promise.all(searchPromises);
      const combinedResults = allResultsArrays.flat();
      
      // Deduplicate by phone
      const uniqueResults = combinedResults.reduce((acc: Company[], current) => {
        if (!current.phone) {
          acc.push(current);
          return acc;
        }
        const x = acc.find(item => item.phone === current.phone);
        if (!x) {
          acc.push(current);
        }
        return acc;
      }, []);

      const finalResults = uniqueResults.map(r => {
        const score = calculateScore(r);
        return {
          ...r,
          score,
          isAlreadyInFunnel: r.phone ? funnelPhones.has(r.phone) : false
        };
      });

      setResults(finalResults);
      if (finalResults.length === 0) {
        toast.info("Nenhum resultado encontrado.");
      } else {
        toast.success(`${finalResults.length} empresas encontradas!`);
        saveSearchToHistory(finalResults.length, locations[0]);
        saveResultsToDatabaseAuto(finalResults);
        fetchAllCompanies();
        fetchFunnelPhones();
      }
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado na busca.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveResultsToDatabase = async () => {
    if (!results || results.length === 0) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para salvar resultados.");
      return;
    }

    setSaving(true);
    try {
      const companiesToSave = results.map(r => ({
        user_id: user.id,
        name: r.name,
        phone: r.phone,
        website: r.website,
        address: r.address,
        rating: r.rating,
        reviews: r.reviews,
        is_open: r.open,
        segment: segment,
        city_state: r.city || locations[0]
      }));

      const { error } = await supabase.from('companies').upsert(companiesToSave, {
        onConflict: 'user_id,name,address'
      });

      if (error) throw error;
      toast.success("Resultados salvos no banco de dados!");
      fetchAllCompanies();
    } catch (err: any) {
      toast.error("Erro ao salvar resultados: " + err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveResultsToDatabaseAuto = async (companies: Company[]) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const companiesToSave = companies.map(r => ({
        user_id: user.id,
        name: r.name,
        phone: r.phone,
        website: r.website,
        address: r.address,
        rating: r.rating,
        reviews: r.reviews,
        is_open: r.open,
        segment: segment,
        city_state: r.city || locations[0]
      }));

      await supabase.from('companies').upsert(companiesToSave, {
        onConflict: 'user_id,name,address'
      });
    } catch (err) {
      console.error("Erro ao salvar automaticamente:", err);
    }
  };

  const saveSearchToHistory = async (count: number, locationName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('search_history').insert({
        user_id: user.id,
        segment: segment,
        location: locationName || locations[0],
        leads_count: count
      });

      if (error) throw error;
      fetchHistory();
    } catch (err) {
      console.error("Erro ao salvar busca no histórico:", err);
    }
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Cole sua API Key antes de salvar");
      return;
    }
    localStorage.setItem("serp_api_key", apiKey);
    toast.success("API Key salva no navegador");
  };

  const sendToPipeline = async (company: Company) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado.");
        return;
      }

      const { error: companyError } = await supabase.from('companies').upsert({
        user_id: user.id,
        name: company.name,
        phone: company.phone,
        website: company.website,
        address: company.address,
        rating: company.rating,
        reviews: company.reviews,
        is_open: company.open,
        segment: segment,
        city_state: company.city || locations[0],
        pipeline_stage: 'Novo Lead'
      }, {
        onConflict: 'user_id,name,address'
      });

      if (companyError) throw companyError;

      // Inserir também na tabela "contacts" do CRM
      const { error: contactError } = await supabase.from('contacts' as any).insert({
        user_id: user.id,
        name: company.name,
        phone: company.phone,
        email: '',
        origin: 'ProspectAI',
        status: 'novo',
        stage: 'novo_lead',
        is_lead: true,
        tag: segment,
        interest: segment,
        notes: `Lead gerado via ProspectAI - ${company.city || locations[0]}`,
        potential_value: 0,
        optin_email: false,
        optin_whatsapp: false,
        tags: [segment],
      });

      if (contactError) throw contactError;

      toast.success(`${company.name} enviado ao funil e CRM!`);
      fetchFunnelPhones();
      fetchAllCompanies(); // Refresh dashboard
    } catch (err: any) {
      toast.error("Erro ao enviar ao funil: " + err.message);
    }
  };

  const sendMultipleToPipeline = async (companies: Company[]) => {
    if (companies.length === 0) return;
    setSaving(true);
    let successCount = 0;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado.");
        return;
      }

      for (const company of companies) {
        try {
          // Check if already in funnel to avoid duplicates
          if (company.phone && funnelPhones.has(company.phone)) continue;

          await supabase.from('companies').upsert({
            user_id: user.id,
            name: company.name,
            phone: company.phone,
            website: company.website,
            address: company.address,
            rating: company.rating,
            reviews: company.reviews,
            is_open: company.open,
            segment: segment,
            city_state: company.city || locations[0],
            pipeline_stage: 'Novo Lead'
          }, {
            onConflict: 'user_id,name,address'
          });

          await supabase.from('contacts' as any).insert({
            user_id: user.id,
            name: company.name,
            phone: company.phone,
            email: '',
            origin: 'ProspectAI',
            status: 'novo',
            stage: 'novo_lead',
            is_lead: true,
            tag: segment,
            interest: segment,
            notes: `Lead gerado via ProspectAI - Lote sem site - ${company.city || locations[0]}`,
            potential_value: 0,
            optin_email: false,
            optin_whatsapp: false,
            tags: [segment],
          });
          successCount++;
        } catch (e) {
          console.error(`Erro ao enviar ${company.name}:`, e);
        }
      }

      toast.success(`${successCount} leads sem site enviados ao funil!`);
      fetchFunnelPhones();
      fetchAllCompanies();
    } catch (err: any) {
      toast.error("Erro ao enviar leads: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = (rows: Company[]) => {
    const header = ["Nome", "Telefone", "Site", "Endereço", "Avaliação", "Avaliações", "Status"];
    const body = rows.map((r) => [
      r.name,
      r.phone ?? "",
      r.website ?? "",
      r.address,
      r.rating.toString(),
      r.reviews.toString(),
      r.open ? "Aberto" : "Fechado",
    ]);
    const csv = [header, ...body]
      .map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospectai-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exportado ${rows.length} ${rows.length === 1 ? "registro" : "registros"}`);
  };

  const handleSearchEmail = (website: string | null) => {
    if (!website) return;
    const domain = website.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
    window.open(`https://hunter.io/search/${domain}`, '_blank');
  };

  const metrics = useMemo(() => {
    if (!filteredResults) return {
      total: 0,
      withPhone: 0,
      withSite: 0,
      avgRating: 0,
      newLeads: 0,
      alreadyInFunnel: 0,
      avgScore: 0,
      noWebsite: 0
    };
    
    return {
      total: filteredResults.length,
      withPhone: filteredResults.filter((r) => r.phone).length,
      withSite: filteredResults.filter((r) => r.website).length,
      noWebsite: filteredResults.filter((r) => !r.website).length,
      avgRating: filteredResults.length > 0 
        ? filteredResults.reduce((s, r) => s + r.rating, 0) / filteredResults.length
        : 0,
      newLeads: filteredResults.filter(r => !funnelPhones.has(r.phone || "")).length,
      alreadyInFunnel: filteredResults.filter(r => r.phone && funnelPhones.has(r.phone)).length,
      avgScore: filteredResults.length > 0
        ? filteredResults.reduce((s, r) => s + (r.score || 0), 0) / filteredResults.length
        : 0
    };
  }, [filteredResults, funnelPhones]);

  const dashboardData = useMemo(() => {
    if (allCompanies.length === 0) return null;

    // Leads by Niche
    const nicheCounts: Record<string, number> = {};
    allCompanies.forEach(c => {
      const niche = c.segment || "Outros";
      nicheCounts[niche] = (nicheCounts[niche] || 0) + 1;
    });
    const nicheData = Object.entries(nicheCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // No Website Opportunities (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentNoWebsite = allCompanies.filter(c => !c.website && new Date(c.created_at) >= sevenDaysAgo).length;

    // Funnel Stages
    const funnelStages = ["Novo Lead", "Contato Iniciado", "Respondeu", "Em Negociação", "Fechado"];
    const funnelCounts: Record<string, number> = {};
    funnelStages.forEach(s => funnelCounts[s] = 0);
    
    allCompanies.forEach(c => {
      if (c.pipeline_stage && funnelCounts[c.pipeline_stage] !== undefined) {
        funnelCounts[c.pipeline_stage]++;
      }
    });
    
    const funnelData = funnelStages.map(name => ({ name, value: funnelCounts[name] }));
    const totalFunnel = allCompanies.filter(c => c.pipeline_stage).length;
    const movedFromStart = totalFunnel - funnelCounts["Novo Lead"];
    const advanceRate = totalFunnel > 0 ? ((movedFromStart / totalFunnel) * 100).toFixed(1) : "0";

    // Contact Rate (Phone)
    const withPhone = allCompanies.filter(c => c.phone).length;
    const phoneData = [
      { name: "Com Telefone", value: withPhone, color: "#aaff00" },
      { name: "Sem Telefone", value: allCompanies.length - withPhone, color: "#3f3f46" }
    ];

    // Leads by City
    const cityCounts: Record<string, number> = {};
    allCompanies.forEach(c => {
      const city = (c.city_state || "Não informado").split(',')[0].trim();
      cityCounts[city] = (cityCounts[city] || 0) + 1;
    });
    const cityData = Object.entries(cityCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Leads over time (from companies created_at for line chart)
    const historyByDate: Record<string, number> = {};
    allCompanies.forEach(c => {
      const date = new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      historyByDate[date] = (historyByDate[date] || 0) + 1;
    });
    
    // Create last 7 days even if no data
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      last7Days.push({
        date: dateStr,
        "Leads": historyByDate[dateStr] || 0
      });
    }

    return {
      total: allCompanies.length,
      contactRate: ((withPhone / allCompanies.length) * 100).toFixed(1),
      nicheData,
      phoneData,
      cityData,
      historyData: last7Days,
      funnelData,
      advanceRate,
      recentNoWebsite
    };
  }, [allCompanies]);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Removed local Toaster as it is now in __root.tsx */}

      <div className="sticky top-0 z-30 flex flex-col">
        {/* Header - Simplified as we have Sidebar now */}
        <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
            <div className="flex items-center gap-2.5 ml-12">
              <h1 className="text-lg font-bold leading-none text-zinc-50">
                ProspectAI
              </h1>
            </div>
          </div>
        </header>

        {/* API Key Banner for all screens */}
        <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-3 md:flex-row md:items-center md:justify-end md:px-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor="api-key" className="sr-only">
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Sua SerpApi Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="sm:w-64 h-8 text-sm bg-zinc-900/50 border-zinc-700"
              />
              <Button onClick={handleSaveKey} size="sm" className="gap-2 h-8">
                <Save className="h-3.5 w-3.5" />
                Salvar Key
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <Tabs value={currentTab} onValueChange={(val) => navigate({ to: '/', search: { tab: val } as any })} className="space-y-6">
          <TabsList className="bg-zinc-900/90 border border-zinc-700 p-1 sticky top-[57px] z-10 backdrop-blur-sm shadow-xl">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-widest px-4">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-widest px-4">
              <SearchIcon className="h-4 w-4" />
              Busca
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary text-[10px] font-bold uppercase tracking-widest px-4">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 mt-0">
            {loadingStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
              </div>
            ) : dashboardData ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <MetricCard icon={Users} label="Total de Leads" value={dashboardData.total.toString()} />
                  <MetricCard icon={Target} label="No Funil" value={allCompanies.filter(c => c.pipeline_stage).length.toString()} />
                  <MetricCard icon={TrendingUp} label="Taxa de Avanço" value={`${dashboardData.advanceRate}%`} />
                  <MetricCard icon={MapPin} label="Cidades" value={dashboardData.cityData.length.toString()} />
                  <MetricCard icon={Globe} label="Oportunidades" value={dashboardData.recentNoWebsite.toString()} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-zinc-800 border-zinc-700 shadow-none">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
                        <Columns className="h-3.5 w-3.5 text-primary" />
                        Distribuição por Etapa do Funil
                      </h3>
                      <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dashboardData.funnelData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                            <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                            <Tooltip 
                              cursor={{ fill: '#18181b' }}
                              contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fafafa' }}
                              labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                            />
                            <Bar dataKey="value" fill="#aaff00" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-800 border-zinc-700 shadow-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                          Leads Adicionados (Últimos 7 dias)
                        </h3>
                      </div>
                      <div className="h-72 w-full">
                        <AreaChart 
                          data={dashboardData.historyData} 
                          index="date" 
                          categories={["Leads"]} 
                          className="h-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <IncidentReportCard 
                    title="Leads por Nicho"
                    data={dashboardData.nicheData.map(item => ({ key: item.name, data: item.value }))}
                    metrics={[
                      { 
                        label: "Nicho Principal", 
                        value: dashboardData.nicheData[0]?.name || "N/A", 
                        trend: "up", 
                        iconColor: "#aaff00" 
                      },
                      { 
                        label: "Média por Nicho", 
                        value: (dashboardData.total / dashboardData.nicheData.length).toFixed(0), 
                        trend: "up", 
                        iconColor: "#4C86FF" 
                      },
                      { 
                        label: "Taxa de Conversão", 
                        value: "12%", 
                        trend: "down", 
                        iconColor: "#E84045" 
                      }
                    ]}
                  />

                  <Card className="bg-zinc-800 border-zinc-700 shadow-none">
                    <CardContent className="p-6">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-8 flex items-center gap-2">
                        <PhoneCall className="h-3.5 w-3.5 text-primary" />
                        Qualificação de Contato
                      </h3>
                      <div className="h-64 w-full flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={dashboardData.phoneData}
                              cx="50%"
                              cy="50%"
                              innerRadius={65}
                              outerRadius={85}
                              paddingAngle={8}
                              dataKey="value"
                              stroke="none"
                            >
                              {dashboardData.phoneData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                              itemStyle={{ color: '#fafafa' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-zinc-50">{dashboardData.contactRate}%</span>
                          <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Sucesso</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-zinc-800 border-zinc-700 shadow-none lg:col-span-2">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary" />
                          Leads por Localidade
                        </h3>
                        <Badge variant="outline" className="text-[10px] font-bold border-zinc-700 text-zinc-400">
                          {dashboardData.cityData.length} CIDADES
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.cityData} layout="vertical">
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#27272a" />
                              <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} stroke="#71717a" />
                              <YAxis dataKey="name" type="category" fontSize={10} axisLine={false} tickLine={false} width={100} stroke="#71717a" />
                              <Tooltip 
                                cursor={{ fill: '#18181b' }}
                                contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                itemStyle={{ color: '#fafafa' }}
                                labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', marginBottom: '4px' }}
                              />
                              <Bar dataKey="value" fill="#aaff00" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="h-64 w-full flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Volume Histórico</p>
                          <AreaChartXS 
                            id="cityHistoryChart"
                            data={dashboardData.historyData.map(d => ({
                              key: new Date(new Date().getFullYear(), parseInt(d.date.split('/')[1]) - 1, parseInt(d.date.split('/')[0])),
                              data: d.Leads
                            }))}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <Card className="bg-zinc-800 border-zinc-700 border-dashed shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <Inbox className="h-12 w-12 text-zinc-700 mb-6" />
                  <h3 className="text-lg font-bold text-zinc-50 uppercase tracking-tight">Sem dados para exibir</h3>
                  <p className="text-sm text-zinc-400 max-w-xs mx-auto mt-2">
                    Realize uma busca e salve os resultados no banco de dados para começar a ver estatísticas.
                  </p>
                  <Button variant="outline" className="mt-8 border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-50 font-bold uppercase tracking-widest text-xs" onClick={() => navigate({ to: '/', search: { tab: 'search' } as any })}>
                    Ir para Busca
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-6 mt-0">
            {/* Search & Filters */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="bg-zinc-800 border-zinc-700 lg:col-span-2 shadow-none">
            <CardContent className="p-6">
              <div className="mb-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">
                  Buscar empresas
                </h2>
                <p className="text-sm text-zinc-400">
                  Encontre leads qualificados via SerpApi Google Maps.
                </p>
              </div>
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="space-y-2">
                  <Label htmlFor="segment" className="text-xs font-semibold text-zinc-400">Tipo de negócio</Label>
                  <Input
                    id="segment"
                    placeholder="ex: clínica, academia, restaurante"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="bg-zinc-900 border-zinc-700 focus-visible:ring-primary h-10"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="location" className="text-xs font-semibold text-zinc-400">Cidades ({locations.length}/10)</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold uppercase tracking-widest text-primary gap-1">
                          Cidades frequentes
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-zinc-900 border-zinc-700 w-48">
                        {["São Paulo", "Rio de Janeiro", "Recife", "Fortaleza", "Salvador", "Belo Horizonte", "Curitiba", "Manaus", "Belém", "Goiânia"].map(city => (
                          <DropdownMenuItem 
                            key={city} 
                            className="text-xs text-zinc-300 focus:text-primary focus:bg-zinc-800 cursor-pointer"
                            onClick={() => {
                              if (locations.length < 10 && !locations.includes(city)) {
                                setLocations([...locations, city]);
                              }
                            }}
                          >
                            {city}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="flex flex-wrap gap-2 p-2 min-h-[40px] bg-zinc-900 border border-zinc-700 rounded-md">
                    {locations.map(loc => (
                      <Badge key={loc} variant="secondary" className="gap-1 bg-zinc-800 text-zinc-300 border-zinc-700">
                        {loc}
                        <button type="button" onClick={() => setLocations(locations.filter(l => l !== loc))}>
                          <X className="h-3 w-3 hover:text-red-400" />
                        </button>
                      </Badge>
                    ))}
                    {locations.length < 10 && (
                      <input
                        placeholder={locations.length === 0 ? "Digite e Enter" : ""}
                        value={locationInput}
                        onChange={(e) => setLocationInput(e.target.value)}
                        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = locationInput.trim();
                            if (val && locations.length < 10 && !locations.includes(val)) {
                              setLocations([...locations, val]);
                              setLocationInput("");
                            }
                          }
                        }}
                        className="bg-transparent border-none outline-none text-sm text-zinc-300 placeholder:text-zinc-600 flex-1 min-w-[100px]"
                      />
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full gap-2 md:w-auto h-10 font-bold px-8 shadow-[0_0_15px_rgba(170,255,0,0.2)]" disabled={loading}>
                    <SearchIcon className="h-4 w-4" />
                    {loading ? `BUSCANDO ${searchProgress.current}/${searchProgress.total}...` : "BUSCAR"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700 shadow-none">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Filtros
                </h2>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-400">Avaliação mínima</Label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-700 h-10">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-50">
                      <SelectItem value="0">Todas</SelectItem>
                      <SelectItem value="3">3.0+ Estrelas</SelectItem>
                      <SelectItem value="4">4.0+ Estrelas</SelectItem>
                      <SelectItem value="4.5">4.5+ Estrelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="phone-filter" 
                      checked={onlyWithPhone}
                      onCheckedChange={(checked) => setOnlyWithPhone(checked as boolean)}
                      className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor="phone-filter" className="text-sm text-zinc-400 cursor-pointer">Apenas com telefone</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="website-filter" 
                      checked={onlyWithWebsite}
                      onCheckedChange={(checked) => setOnlyWithWebsite(checked as boolean)}
                      className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor="website-filter" className="text-sm text-zinc-400 cursor-pointer">Apenas com site</Label>
                  </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Checkbox 
                      id="funnel-filter" 
                      checked={hideExistingInFunnel}
                      onCheckedChange={(checked) => setHideExistingInFunnel(checked as boolean)}
                      className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor="funnel-filter" className="text-sm text-zinc-400 cursor-pointer">Ocultar leads já no funil</Label>
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-zinc-400">Score mínimo: {minScore}</Label>
                    </div>
                    <Slider 
                      value={[minScore]} 
                      onValueChange={(vals) => setMinScore(vals[0])} 
                      max={100} 
                      step={5}
                      className="[&_[role=slider]]:bg-primary [&_[role=slider]]:border-primary"
                    />
                  </div>
                  <div className="flex items-center space-x-3 pt-1">
                    <Checkbox 
                      id="high-score-filter" 
                      checked={onlyHighScores}
                      onCheckedChange={(checked) => setOnlyHighScores(checked as boolean)}
                      className="border-zinc-700 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor="high-score-filter" className="text-sm text-zinc-400 cursor-pointer">Apenas Excelente e Muito Bom</Label>
                  </div>
                  <div className="flex items-center space-x-3 pt-2 p-2 bg-primary/5 rounded-lg border border-primary/10">
                    <Checkbox 
                      id="no-website-filter" 
                      checked={onlyNoWebsite}
                      onCheckedChange={(checked) => setOnlyNoWebsite(checked as boolean)}
                      className="border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:text-black"
                    />
                    <Label htmlFor="no-website-filter" className="text-sm text-primary font-bold cursor-pointer flex items-center gap-2">
                      🎯 Apenas sem site
                      <Badge variant="outline" className="bg-primary/10 border-primary/20 text-[10px] h-4 px-1">
                        {metrics.noWebsite}
                      </Badge>
                    </Label>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {loading && !results
            ? Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="border-zinc-700">
                  <CardContent className="p-5">
                    <Skeleton className="h-11 w-11 rounded-lg" />
                    <Skeleton className="mt-3 h-3 w-20" />
                    <Skeleton className="mt-2 h-6 w-12" />
                  </CardContent>
                </Card>
              ))
            : (
                <>
                  <MetricCard
                    icon={Building2}
                    label="Empresas encontradas"
                    value={metrics.total.toString()}
                  />
                  <MetricCard
                    icon={PhoneCall}
                    label="Com telefone"
                    value={metrics.withPhone.toString()}
                  />
                  <MetricCard
                    icon={Globe}
                    label="Sem Site / Com Site"
                    value={`${metrics.noWebsite} / ${metrics.withSite}`}
                  />
                  <MetricCard
                    icon={Star}
                    label="Avaliação média"
                    value={metrics.avgRating.toFixed(1)}
                  />
                  <MetricCard
                    icon={Brain}
                    label="Score médio"
                    value={metrics.avgScore.toFixed(0)}
                  />
                </>
              )}
        </div>

        {/* Results */}
        <Card className="bg-zinc-800 border-zinc-700 shadow-none overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-zinc-700 p-6">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">
                Resultados
              </h2>
              <p className="text-sm text-zinc-400">
                {filteredResults
                  ? `${filteredResults.length} empresas encontradas`
                  : loading
                    ? "Buscando na API..."
                    : "Configure a API Key e faça uma busca"}
              </p>
              {filteredResults && filteredResults.length > 0 && (
                <div className="mt-2 flex items-center gap-3">
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold">
                    {metrics.newLeads} NOVOS
                  </Badge>
                  <Badge variant="outline" className="bg-zinc-500/10 text-zinc-500 border-zinc-700 text-[10px] font-bold">
                    {metrics.alreadyInFunnel} JÁ PROSPECTADOS
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {onlyNoWebsite && filteredResults && filteredResults.length > 0 && (
                <Button
                  className="gap-2 bg-primary text-black hover:bg-primary/90 font-bold text-xs"
                  onClick={() => sendMultipleToPipeline(filteredResults)}
                  disabled={saving}
                >
                  <Target className="h-4 w-4" />
                  {saving ? "ENVIANDO..." : "ENVIAR TODOS SEM SITE AO FUNIL"}
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 font-bold text-xs"
                disabled={!filteredResults || filteredResults.length === 0 || saving}
                onClick={saveResultsToDatabase}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{saving ? "SALVANDO..." : "SALVAR NO BANCO"}</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2 border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-50 font-bold text-xs"
                disabled={!filteredResults || filteredResults.length === 0}
                onClick={() => filteredResults && exportCSV(filteredResults)}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">EXPORTAR CSV</span>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : !filteredResults ? (
            <EmptyState />
          ) : filteredResults.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-700 hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cidade</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Contato & Links</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Endereço</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Avaliação</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Score</TableHead>
                    <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((r) => (
                    <TableRow key={r.id} className="border-zinc-700/50 hover:bg-zinc-700/30 transition-colors group">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          {r.name}
                          {r.phone && funnelPhones.has(r.phone) && (
                            <Badge variant="outline" className="w-fit bg-zinc-500/10 text-zinc-500 border-zinc-700 text-[9px] font-bold px-1.5 py-0 h-4">
                              Já no funil
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400 capitalize">{r.city}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {r.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <Phone className="h-3.5 w-3.5 text-zinc-400" />
                              {r.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 italic">Sem telefone</span>
                          )}
                          {r.website ? (
                            <a
                              href={r.website.startsWith('http') ? r.website : `https://${r.website}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                            >
                              <Globe className="h-3.5 w-3.5" />
                              Website
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <Badge variant="outline" className="w-fit bg-primary/15 text-primary border-primary/30 text-[9px] font-black tracking-tighter h-4">
                              SEM SITE
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-start gap-1.5 text-sm text-zinc-400">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[240px] truncate">
                            {r.address}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Stars rating={r.rating} />
                        <p className="mt-0.5 text-xs text-zinc-400">
                          {r.reviews} avaliações
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.open ? "default" : "secondary"}
                          className={
                            r.open
                              ? "bg-success/15 text-success hover:bg-success/15"
                              : "bg-muted text-zinc-400"
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                              r.open ? "bg-success" : "bg-muted-foreground"
                            }`}
                          />
                          {r.open ? "Aberto" : "Fechado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-lg font-bold text-zinc-50 leading-none">{(r.score || 0)}</span>
                          <Badge 
                            variant="outline" 
                            className={`text-[8px] font-black px-1 py-0 h-3.5 w-fit border-none ${getScoreBadge(r.score || 0).color}`}
                          >
                            {getScoreBadge(r.score || 0).label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.phone && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                              onClick={() => {
                                const cleaned = r.phone!.replace(/\D/g, '');
                                window.open(`https://wa.me/${cleaned}`, '_blank');
                              }}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              WhatsApp
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 text-accent hover:text-accent hover:bg-accent/10"
                            disabled={!r.website}
                            onClick={() => handleSearchEmail(r.website)}
                          >
                            <Mail className="h-3.5 w-3.5" />
                            Buscar e-mail
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                             className="gap-1.5 text-primary hover:text-primary hover:bg-primary/10 disabled:opacity-30"
                             disabled={!!r.website || (!!r.phone && funnelPhones.has(r.phone))}
                             onClick={() => sendToPipeline(r)}
                             title={r.website ? "Somente leads sem site podem ser enviados" : (r.phone && funnelPhones.has(r.phone) ? "Este lead já está no funil" : "")}
                           >
                            <Plus className="h-3.5 w-3.5" />
                            Funil
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5"
                            onClick={() => exportCSV([r])}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Exportar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <Card className="bg-zinc-800 border-zinc-700 shadow-none overflow-hidden">
              <div className="border-b border-zinc-700 p-6">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-1">
                  Histórico de buscas
                </h2>
                <p className="text-sm text-zinc-400">
                  Suas últimas pesquisas realizadas.
                </p>
              </div>
              <div className="p-0">
                {loadingHistory ? (
                  <div className="p-10 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                    ))}
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <History className="h-12 w-12 text-zinc-400/30 mb-4" />
                    <h3 className="text-base font-semibold text-zinc-50">
                      Nenhuma busca registrada
                    </h3>
                    <p className="mt-1 text-sm text-zinc-400">
                      As buscas que você realizar aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-zinc-700 hover:bg-transparent">
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Data</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Segmento</TableHead>
                          <TableHead className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cidade/Estado</TableHead>
                          <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest text-zinc-500">Leads</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow 
                            key={item.id} 
                            className="cursor-pointer border-zinc-700/50 hover:bg-zinc-700/30 transition-colors group"
                            onClick={() => fetchHistoryLeads(item)}
                          >
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2 text-zinc-400">
                                <Calendar className="h-3.5 w-3.5" />
                                {new Date(item.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium capitalize">{item.segment}</TableCell>
                            <TableCell className="text-zinc-400 capitalize">{item.location}</TableCell>
                            <TableCell className="text-right font-semibold">
                              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15 border-none">
                                {item.leads_count} {item.leads_count === 1 ? 'lead' : 'leads'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {selectedHistory && (
                  <div className="mt-8 border-t border-zinc-700 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Leads de: <span className="text-primary capitalize">{selectedHistory.segment}</span> em <span className="text-primary capitalize">{selectedHistory.location}</span>
                        </h3>
                        <p className="text-sm text-zinc-400">
                          {historyLeads.length} leads encontrados no banco de dados para esta busca.
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedHistory(null)}>
                        Fechar
                      </Button>
                    </div>

                    {loadingHistoryLeads ? (
                      <div className="space-y-3 p-5">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full rounded-md" />
                        ))}
                      </div>
                    ) : historyLeads.length === 0 ? (
                      <div className="bg-muted/20 rounded-xl p-8 text-center">
                        <p className="text-sm text-zinc-400 italic">Nenhum lead salvo foi encontrado para estes critérios.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-900/50">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Contato</TableHead>
                              <TableHead>Avaliação</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {historyLeads.map((lead) => (
                              <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.name}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-0.5 text-xs">
                                    {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>}
                                    {lead.website && <span className="flex items-center gap-1 text-primary"><Globe className="h-3 w-3" /> Website</span>}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Stars rating={lead.rating} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {lead.phone && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 gap-1.5 text-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const cleaned = lead.phone!.replace(/\D/g, '');
                                          window.open(`https://wa.me/${cleaned}`, '_blank');
                                        }}
                                      >
                                        <Phone className="h-3 w-3" />
                                        WhatsApp
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 disabled:opacity-30"
                                      disabled={!!lead.website}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        sendToPipeline(lead);
                                      }}
                                      title={lead.website ? "Somente leads sem site podem ser enviados" : ""}
                                    >
                                      <Plus className="h-3 w-3" />
                                      Funil
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 rounded-full bg-primary/10 blur-2xl" />
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-zinc-700 bg-zinc-900 shadow-sm">
          <Inbox className="h-9 w-9 text-zinc-400" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-zinc-50">
        Nenhum resultado encontrado
      </h3>
      <p className="mt-1 max-w-sm text-sm text-zinc-400">
        Use os filtros ou faça uma nova busca por segmento e localização.
      </p>
    </div>
  );
}
