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

const MOCK: Company[] = [
  {
    id: "1",
    name: "Clínica Vida Plena",
    phone: "(11) 4002-8922",
    website: "vidaplena.com.br",
    address: "Av. Paulista, 1200 — São Paulo, SP",
    rating: 4.8,
    reviews: 312,
    open: true,
  },
  {
    id: "2",
    name: "Espaço Saúde Integrada",
    phone: "(11) 3344-5566",
    website: null,
    address: "R. Augusta, 540 — São Paulo, SP",
    rating: 4.5,
    reviews: 188,
    open: true,
  },
  {
    id: "3",
    name: "Centro Médico Bem Estar",
    phone: "(11) 2233-4455",
    website: "bemestarcm.com.br",
    address: "R. Oscar Freire, 88 — São Paulo, SP",
    rating: 4.2,
    reviews: 96,
    open: false,
  },
  {
    id: "4",
    name: "Clínica Ortomed",
    phone: null,
    website: "ortomed.com.br",
    address: "Av. Faria Lima, 3477 — São Paulo, SP",
    rating: 3.9,
    reviews: 41,
    open: true,
  },
  {
    id: "5",
    name: "Instituto Saúde+",
    phone: "(11) 5566-7788",
    website: "saudemais.com.br",
    address: "R. Haddock Lobo, 220 — São Paulo, SP",
    rating: 4.7,
    reviews: 502,
    open: true,
  },
  {
    id: "6",
    name: "Clínica Reviver",
    phone: "(11) 9988-7766",
    website: null,
    address: "R. Teodoro Sampaio, 1010 — São Paulo, SP",
    rating: 4.0,
    reviews: 73,
    open: false,
  },
];

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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("google_places_api_key") || "");
  const [segment, setSegment] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Company[] | null>(null);

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
      toast.error("Configure sua Google Places API Key no topo");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // 1. Geocode location
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('google-places-proxy', {
        body: { action: 'geocode', apiKey, params: { address: location } }
      });

      if (geocodeError || !geocodeData.results?.[0]) {
        throw new Error("Erro ao converter localização.");
      }

      const { lat, lng } = geocodeData.results[0].geometry.location;
      const latLngStr = `${lat},${lng}`;

      // 2. Nearby Search
      const { data: searchData, error: searchError } = await supabase.functions.invoke('google-places-proxy', {
        body: { 
          action: 'nearbysearch', 
          apiKey, 
          params: { location: latLngStr, keyword: segment } 
        }
      });

      if (searchError || !searchData.results) {
        throw new Error("Erro na busca por estabelecimentos.");
      }

      // 3. Place Details for each result (limit to top 15 for better performance/cost)
      const topResults = searchData.results.slice(0, 15);
      const detailedResults: Company[] = [];

      for (const place of topResults) {
        const { data: detailsData, error: detailsError } = await supabase.functions.invoke('google-places-proxy', {
          body: { action: 'placedetails', apiKey, params: { placeId: place.place_id } }
        });

        if (!detailsError && detailsData.result) {
          const res = detailsData.result;
          detailedResults.push({
            id: place.place_id,
            name: res.name,
            phone: res.formatted_phone_number || null,
            website: res.website || null,
            address: res.formatted_address,
            rating: res.rating || 0,
            reviews: res.user_ratings_total || 0,
            open: res.opening_hours?.open_now ?? false,
          });
        }
      }

      setResults(detailedResults);
      if (detailedResults.length === 0) {
        toast.info("Nenhum resultado encontrado.");
      } else {
        toast.success(`${detailedResults.length} empresas encontradas!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Erro inesperado na busca.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      toast.error("Cole sua API Key antes de salvar");
      return;
    }
    localStorage.setItem("google_places_api_key", apiKey);
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

  const metrics = filteredResults
    ? {
        total: filteredResults.length,
        withPhone: filteredResults.filter((r) => r.phone).length,
        withSite: filteredResults.filter((r) => r.website).length,
        avgRating: filteredResults.length > 0 
          ? filteredResults.reduce((s, r) => s + r.rating, 0) / filteredResults.length
          : 0,
      }
    : null;

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
        {/* Search */}
        <Card className="border-border/60">
          <CardContent className="p-5 md:p-6">
            <div className="mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Buscar empresas
              </h2>
              <p className="text-sm text-muted-foreground">
                Encontre leads qualificados por segmento e localização.
              </p>
            </div>
            <form
              onSubmit={handleSearch}
              className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="segment">Segmento</Label>
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
                  Buscar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Metrics */}
        {(loading || metrics) && (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {loading && !metrics
              ? Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} className="border-border/60">
                    <CardContent className="p-5">
                      <Skeleton className="h-11 w-11 rounded-lg" />
                      <Skeleton className="mt-3 h-3 w-20" />
                      <Skeleton className="mt-2 h-6 w-12" />
                    </CardContent>
                  </Card>
                ))
              : metrics && (
                  <>
                    <MetricCard
                      icon={Building2}
                      label="Total encontrado"
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
        )}

        {/* Results */}
        <Card className="border-border/60">
          <div className="flex items-center justify-between gap-4 border-b border-border/60 p-5">
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Resultados
              </h2>
              <p className="text-sm text-muted-foreground">
                {results
                  ? `${results.length} empresas encontradas`
                  : loading
                    ? "Buscando empresas…"
                    : "Faça uma busca para ver os resultados"}
              </p>
            </div>
            <Button
              variant="outline"
              className="gap-2"
              disabled={!results || results.length === 0}
              onClick={() => results && exportCSV(results)}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
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
          ) : !results ? (
            <EmptyState />
          ) : results.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Site</TableHead>
                    <TableHead>Endereço</TableHead>
                    <TableHead>Avaliação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell>
                        {r.phone ? (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {r.phone}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.website ? (
                          <a
                            href={`https://${r.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            {r.website}
                          </a>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => exportCSV([r])}
                        >
                          <Download className="h-3.5 w-3.5" />
                          Exportar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
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
        Nenhum resultado ainda
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Use o formulário acima para buscar empresas por segmento e localização.
        Os resultados aparecerão aqui.
      </p>
    </div>
  );
}
