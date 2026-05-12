import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import {
  Search,
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
} from "lucide-react";
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
import { Toaster } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3.5 w-3.5 ${
              i <= Math.round(rating)
                ? "fill-accent text-accent"
                : "text-muted-foreground/30"
            }`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-foreground">
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
    <Card className="border-border/60">
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-0.5 text-2xl font-semibold text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function Index() {
  const [apiKey, setApiKey] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem("serp_api_key") : "") || "");
  const [segment, setSegment] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

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

  const saveSearchToHistory = async (count: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('search_history').insert({
        user_id: user.id,
        segment: segment,
        location: location,
        leads_count: count
      });

      if (error) throw error;
      fetchHistory(); // Refresh history
    } catch (err) {
      console.error("Erro ao salvar busca no histórico:", err);
    }
  };

  // Filters
  const [minRating, setMinRating] = useState("0");
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);
  const [onlyWithWebsite, setOnlyWithWebsite] = useState(false);

  const filteredResults = useMemo(() => {
    if (!results) return null;
    return results.filter((r) => {
      const ratingMatch = r.rating >= parseFloat(minRating);
      const phoneMatch = onlyWithPhone ? !!r.phone : true;
      const websiteMatch = onlyWithWebsite ? !!r.website : true;
      return ratingMatch && phoneMatch && websiteMatch;
    });
  }, [results, minRating, onlyWithPhone, onlyWithWebsite]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!segment.trim() || !location.trim()) {
      toast.error("Informe segmento e cidade/estado");
      return;
    }
    if (!apiKey.trim()) {
      toast.error("Configure sua SerpApi Key no topo");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const { data, error } = await supabase.functions.invoke('google-places-proxy', {
        body: { 
          action: 'search', 
          apiKey, 
          params: { q: segment, location: location } 
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
      }));

      setResults(detailedResults);
      if (detailedResults.length === 0) {
        toast.info("Nenhum resultado encontrado.");
      } else {
        toast.success(`${detailedResults.length} empresas encontradas!`);
        saveSearchToHistory(detailedResults.length);
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
        city_state: location
      }));

      const { error } = await supabase.from('companies').upsert(companiesToSave, {
        onConflict: 'user_id,name,address'
      });

      if (error) throw error;
      toast.success("Resultados salvos no banco de dados!");
    } catch (err: any) {
      toast.error("Erro ao salvar resultados: " + err.message);
      console.error(err);
    } finally {
      setSaving(false);
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
    };
    
    return {
      total: filteredResults.length,
      withPhone: filteredResults.filter((r) => r.phone).length,
      withSite: filteredResults.filter((r) => r.website).length,
      avgRating: filteredResults.length > 0 
        ? filteredResults.reduce((s, r) => s + r.rating, 0) / filteredResults.length
        : 0,
    };
  }, [filteredResults]);

  return (
    <div className="min-h-screen bg-muted/30">
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none text-foreground">
                ProspectAI
              </h1>
              <p className="mt-1 text-xs text-muted-foreground">
                Prospecção inteligente
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="api-key" className="sr-only">
              API Key
            </Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Cole sua API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="sm:w-72"
            />
            <Button onClick={handleSaveKey} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-8">
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList className="bg-background border border-border/60">
            <TabsTrigger value="search" className="gap-2">
              <Search className="h-4 w-4" />
              Busca
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6 mt-0">
            {/* Search & Filters */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="border-border/60 lg:col-span-2">
            <CardContent className="p-5 md:p-6">
              <div className="mb-4">
                <h2 className="text-base font-semibold text-foreground">
                  Buscar empresas
                </h2>
                <p className="text-sm text-muted-foreground">
                  Encontre leads qualificados via SerpApi Google Maps.
                </p>
              </div>
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
              >
                <div className="space-y-1.5">
                  <Label htmlFor="segment">Tipo de negócio</Label>
                  <Input
                    id="segment"
                    placeholder="ex: clínica, academia, restaurante"
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="location">Cidade / Estado</Label>
                  <Input
                    id="location"
                    placeholder="ex: São Paulo, SP"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button type="submit" className="w-full gap-2 md:w-auto" disabled={loading}>
                    <Search className="h-4 w-4" />
                    {loading ? "Buscando..." : "Buscar"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-5 md:p-6">
              <div className="mb-4 flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" />
                <h2 className="text-base font-semibold text-foreground">
                  Filtros
                </h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Avaliação mínima</Label>
                  <Select value={minRating} onValueChange={setMinRating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Todas</SelectItem>
                      <SelectItem value="3">3.0+ Estrelas</SelectItem>
                      <SelectItem value="4">4.0+ Estrelas</SelectItem>
                      <SelectItem value="4.5">4.5+ Estrelas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="phone-filter" 
                      checked={onlyWithPhone}
                      onCheckedChange={(checked) => setOnlyWithPhone(checked as boolean)}
                    />
                    <Label htmlFor="phone-filter" className="cursor-pointer">Apenas com telefone</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="website-filter" 
                      checked={onlyWithWebsite}
                      onCheckedChange={(checked) => setOnlyWithWebsite(checked as boolean)}
                    />
                    <Label htmlFor="website-filter" className="cursor-pointer">Apenas com site</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {loading && !results
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/60">
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
                    label="Com site"
                    value={metrics.withSite.toString()}
                  />
                  <MetricCard
                    icon={Star}
                    label="Avaliação média"
                    value={metrics.avgRating.toFixed(1)}
                  />
                </>
              )}
        </div>

        {/* Results */}
        <Card className="border-border/60">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 p-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Resultados
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredResults
                  ? `${filteredResults.length} empresas encontradas`
                  : loading
                    ? "Buscando na API..."
                    : "Configure a API Key e faça uma busca"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                disabled={!filteredResults || filteredResults.length === 0 || saving}
                onClick={saveResultsToDatabase}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">{saving ? "Salvando..." : "Salvar no Banco"}</span>
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!filteredResults || filteredResults.length === 0}
                onClick={() => filteredResults && exportCSV(filteredResults)}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportar CSV</span>
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
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contato & Links</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResults.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          {r.phone ? (
                            <span className="inline-flex items-center gap-1.5 text-sm">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {r.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Sem telefone</span>
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
                            <span className="text-xs text-muted-foreground italic">Sem site</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-start gap-1.5 text-sm text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span className="max-w-[240px] truncate">
                            {r.address}
                          </span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <Stars rating={r.rating} />
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {r.reviews} avaliações
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.open ? "default" : "secondary"}
                          className={
                            r.open
                              ? "bg-success/15 text-success hover:bg-success/15"
                              : "bg-muted text-muted-foreground"
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
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
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
            <Card className="border-border/60">
              <div className="border-b border-border/60 p-5">
                <h2 className="text-base font-semibold text-foreground">
                  Histórico de buscas
                </h2>
                <p className="text-sm text-muted-foreground">
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
                    <History className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-foreground">
                      Nenhuma busca registrada
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      As buscas que você realizar aparecerão aqui.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Cidade/Estado</TableHead>
                          <TableHead className="text-right">Leads</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-sm">
                              <div className="flex items-center gap-2 text-muted-foreground">
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
                            <TableCell className="text-muted-foreground capitalize">{item.location}</TableCell>
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
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-border/60 bg-background shadow-sm">
          <Inbox className="h-9 w-9 text-muted-foreground" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-foreground">
        Nenhum resultado encontrado
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Use os filtros ou faça uma nova busca por segmento e localização.
      </p>
    </div>
  );
}
