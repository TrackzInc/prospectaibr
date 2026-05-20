import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Globe, 
  Search as SearchIcon, 
  MapPin, 
  Users, 
  ChevronRight, 
  Building2,
  TrendingUp,
  Target
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route = createFileRoute("/territorios")({
  component: Territorios,
});

interface Municipio {
  id: string;
  nome: string;
  uf: string;
  regiao: string;
}

interface Populacao {
  id: string;
  valor: number;
}

const REGIOES = [
  { value: "all", label: "Todas" },
  { value: "Norte", label: "Norte" },
  { value: "Nordeste", label: "Nordeste" },
  { value: "Sul", label: "Sul" },
  { value: "Sudeste", label: "Sudeste" },
  { value: "Centro-Oeste", label: "Centro-Oeste" },
];

const ESTADOS: Record<string, string[]> = {
  "Norte": ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
  "Nordeste": ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
  "Sudeste": ["ES", "MG", "RJ", "SP"],
  "Sul": ["PR", "RS", "SC"],
  "Centro-Oeste": ["DF", "GO", "MT", "MS"],
};

const POP_RANGES = [
  { label: "Todas", min: 0, max: Infinity },
  { label: "< 50k", min: 0, max: 50000 },
  { label: "50k-100k", min: 50000, max: 100000 },
  { label: "100k-500k", min: 100000, max: 500000 },
  { label: "500k-1M", min: 500000, max: 1000000 },
  { label: "> 1M", min: 1000000, max: Infinity },
];

function MetricCard({
  icon: Icon,
  label,
  value,
  color = "text-zinc-50"
}: {
  icon: any;
  label: string;
  value: string | number;
  color?: string;
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
          <p className={`mt-2 text-3xl font-bold ${color} tracking-tight`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

const TOP_CITIES_DATA = [
  { nome: "São Paulo", uf: "SP", populacao: 11451245, regiao: "Sudeste" },
  { nome: "Rio de Janeiro", uf: "RJ", populacao: 6748000, regiao: "Sudeste" },
  { nome: "Brasília", uf: "DF", populacao: 3094000, regiao: "Centro-Oeste" },
  { nome: "Salvador", uf: "BA", populacao: 2886000, regiao: "Nordeste" },
  { nome: "Fortaleza", uf: "CE", populacao: 2703000, regiao: "Nordeste" },
  { nome: "Belo Horizonte", uf: "MG", populacao: 2530000, regiao: "Sudeste" },
  { nome: "Manaus", uf: "AM", populacao: 2255000, regiao: "Norte" },
  { nome: "Curitiba", uf: "PR", populacao: 1952000, regiao: "Sul" },
  { nome: "Recife", uf: "PE", populacao: 1661000, regiao: "Nordeste" },
  { nome: "Goiânia", uf: "GO", populacao: 1555000, regiao: "Centro-Oeste" },
  { nome: "Porto Alegre", uf: "RS", populacao: 1484000, regiao: "Sul" },
  { nome: "Belém", uf: "PA", populacao: 1499000, regiao: "Norte" },
  { nome: "Guarulhos", uf: "SP", populacao: 1392000, regiao: "Sudeste" },
  { nome: "Campinas", uf: "SP", populacao: 1213000, regiao: "Sudeste" },
  { nome: "São Luís", uf: "MA", populacao: 1108000, regiao: "Nordeste" },
  { nome: "São Gonçalo", uf: "RJ", populacao: 1091000, regiao: "Sudeste" },
  { nome: "Maceió", uf: "AL", populacao: 1025000, regiao: "Nordeste" },
  { nome: "Natal", uf: "RN", populacao: 890000, regiao: "Nordeste" },
  { nome: "Teresina", uf: "PI", populacao: 868000, regiao: "Nordeste" },
  { nome: "Campo Grande", uf: "MS", populacao: 916000, regiao: "Centro-Oeste" },
  { nome: "João Pessoa", uf: "PB", populacao: 817000, regiao: "Nordeste" },
  { nome: "Santo André", uf: "SP", populacao: 748000, regiao: "Sudeste" },
  { nome: "Osasco", uf: "SP", populacao: 696000, regiao: "Sudeste" },
  { nome: "São Bernardo do Campo", uf: "SP", populacao: 844000, regiao: "Sudeste" },
  { nome: "Jaboatão dos Guararapes", uf: "PE", populacao: 706000, regiao: "Nordeste" },
  { nome: "Ribeirão Preto", uf: "SP", populacao: 718000, regiao: "Sudeste" },
  { nome: "Uberlândia", uf: "MG", populacao: 706000, regiao: "Sudeste" },
  { nome: "Sorocaba", uf: "SP", populacao: 700000, regiao: "Sudeste" },
  { nome: "Contagem", uf: "MG", populacao: 668000, regiao: "Sudeste" },
  { nome: "Aracaju", uf: "SE", populacao: 664000, regiao: "Nordeste" },
  { nome: "Feira de Santana", uf: "BA", populacao: 630000, regiao: "Nordeste" },
  { nome: "Cuiabá", uf: "MT", populacao: 623000, regiao: "Centro-Oeste" },
  { nome: "Joinville", uf: "SC", populacao: 616000, regiao: "Sul" },
  { nome: "Juiz de Fora", uf: "MG", populacao: 573000, regiao: "Sudeste" },
  { nome: "Londrina", uf: "PR", populacao: 569000, regiao: "Sul" },
  { nome: "Aparecida de Goiânia", uf: "GO", populacao: 566000, regiao: "Centro-Oeste" },
  { nome: "Ananindeua", uf: "PA", populacao: 535000, regiao: "Norte" },
  { nome: "Niterói", uf: "RJ", populacao: 515000, regiao: "Sudeste" },
  { nome: "Belford Roxo", uf: "RJ", populacao: 514000, regiao: "Sudeste" },
  { nome: "Porto Velho", uf: "RO", populacao: 539000, regiao: "Norte" },
  { nome: "Serra", uf: "ES", populacao: 527000, regiao: "Sudeste" },
  { nome: "Caxias do Sul", uf: "RS", populacao: 435000, regiao: "Sul" },
  { nome: "Macapá", uf: "AP", populacao: 503000, regiao: "Norte" },
  { nome: "Mogi das Cruzes", uf: "SP", populacao: 440000, regiao: "Sudeste" },
  { nome: "São José dos Campos", uf: "SP", populacao: 729000, regiao: "Sudeste" },
  { nome: "Florianópolis", uf: "SC", populacao: 537000, regiao: "Sul" },
  { nome: "Santos", uf: "SP", populacao: 433000, regiao: "Sudeste" },
  { nome: "Mauá", uf: "SP", populacao: 468000, regiao: "Sudeste" },
  { nome: "Caruaru", uf: "PE", populacao: 374000, regiao: "Nordeste" },
  { nome: "Betim", uf: "MG", populacao: 434000, regiao: "Sudeste" },
  { nome: "Olinda", uf: "PE", populacao: 390000, regiao: "Nordeste" },
  { nome: "Campina Grande", uf: "PB", populacao: 411000, regiao: "Nordeste" },
  { nome: "São José do Rio Preto", uf: "SP", populacao: 464000, regiao: "Sudeste" },
  { nome: "Caxias", uf: "MA", populacao: 164000, regiao: "Nordeste" },
  { nome: "Imperatriz", uf: "MA", populacao: 260000, regiao: "Nordeste" },
  { nome: "Bauru", uf: "SP", populacao: 374000, regiao: "Sudeste" },
  { nome: "Jundiaí", uf: "SP", populacao: 422000, regiao: "Sudeste" },
  { nome: "Piracicaba", uf: "SP", populacao: 407000, regiao: "Sudeste" },
  { nome: "Franca", uf: "SP", populacao: 352000, regiao: "Sudeste" },
  { nome: "Pelotas", uf: "RS", populacao: 343000, regiao: "Sul" },
  { nome: "Vitória", uf: "ES", populacao: 365000, regiao: "Sudeste" },
  { nome: "Canoas", uf: "RS", populacao: 350000, regiao: "Sul" },
  { nome: "Limeira", uf: "SP", populacao: 306000, regiao: "Sudeste" },
  { nome: "Paulista", uf: "PE", populacao: 337000, regiao: "Nordeste" },
  { nome: "Camaçari", uf: "BA", populacao: 300000, regiao: "Nordeste" },
  { nome: "Vitória da Conquista", uf: "BA", populacao: 341000, regiao: "Nordeste" },
  { nome: "Santarém", uf: "PA", populacao: 308000, regiao: "Norte" },
  { nome: "Maringá", uf: "PR", populacao: 430000, regiao: "Sul" },
  { nome: "Cascavel", uf: "PR", populacao: 334000, regiao: "Sul" },
  { nome: "Foz do Iguaçu", uf: "PR", populacao: 258000, regiao: "Sul" },
  { nome: "Blumenau", uf: "SC", populacao: 361000, regiao: "Sul" },
  { nome: "Rio Branco", uf: "AC", populacao: 413000, regiao: "Norte" },
  { nome: "Boa Vista", uf: "RR", populacao: 419000, regiao: "Norte" },
  { nome: "Palmas", uf: "TO", populacao: 310000, regiao: "Norte" },
  { nome: "Anápolis", uf: "GO", populacao: 381000, regiao: "Centro-Oeste" },
  { nome: "Dourados", uf: "MS", populacao: 222000, regiao: "Centro-Oeste" },
  { nome: "Mossoró", uf: "RN", populacao: 300000, regiao: "Nordeste" },
  { nome: "Petrolina", uf: "PE", populacao: 343000, regiao: "Nordeste" },
  { nome: "Juazeiro do Norte", uf: "CE", populacao: 278000, regiao: "Nordeste" },
  { nome: "Maracanaú", uf: "CE", populacao: 230000, regiao: "Nordeste" },
  { nome: "Caucaia", uf: "CE", populacao: 368000, regiao: "Nordeste" },
  { nome: "Ilhéus", uf: "BA", populacao: 184000, regiao: "Nordeste" },
  { nome: "Barreiras", uf: "BA", populacao: 158000, regiao: "Nordeste" },
  { nome: "Garanhuns", uf: "PE", populacao: 141000, regiao: "Nordeste" },
  { nome: "Petrolândia", uf: "PE", populacao: 39000, regiao: "Nordeste" },
  { nome: "Arcoverde", uf: "PE", populacao: 75000, regiao: "Nordeste" },
  { nome: "Serra Talhada", uf: "PE", populacao: 84000, regiao: "Nordeste" },
  { nome: "Caruaru", uf: "PE", populacao: 374000, regiao: "Nordeste" }
].map((c, i) => ({ ...c, id: i.toString() }));

function Territorios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegiao, setSelectedRegiao] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");
  const [selectedPopRange, setSelectedPopRange] = useState([0]); 
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Fetch municipios
  const { data: municipios = [], isLoading: loadingMunicipios } = useQuery({
    queryKey: ['municipios'],
    queryFn: async () => {
      console.log("Iniciando busca de municípios no IBGE...");
      const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
      if (!res.ok) throw new Error("Falha ao carregar municípios");
      const data = await res.json();
      
      return data.map((m: any) => ({
        id: m.id.toString(),
        nome: m.nome,
        uf: m.microrregiao.mesorregiao.UF.sigla,
        regiao: m.microrregiao.mesorregiao.UF.regiao.nome
      }));
    },
    staleTime: Infinity,
  });

  // Fetch populacao
  const { data: populacoes = {}, isLoading: loadingPop } = useQuery({
    queryKey: ['populacao'],
    queryFn: async () => {
      console.log("Iniciando busca de população no IBGE...");
      const res = await fetch('https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[all]');
      if (!res.ok) throw new Error("Falha ao carregar dados de população");
      const data = await res.json();
      const results: Record<string, number> = {};
      
      if (data && data[0]?.resultados?.[0]?.series) {
        data[0].resultados[0].series.forEach((s: any) => {
          results[s.localidade.id] = parseInt(s.serie['2022']);
        });
      }
      return results;
    },
    staleTime: Infinity,
  });

  const mergedData = useMemo(() => {
    if (municipios.length === 0 && Object.keys(populacoes).length === 0 && !loadingMunicipios && !loadingPop) {
      return TOP_CITIES_FALLBACK;
    }

    const data = municipios.map((m: Municipio) => ({
      ...m,
      populacao: populacoes[m.id] || 0
    })).sort((a: any, b: any) => b.populacao - a.populacao);
    
    // If we have municipios but zero population data (API still loading or failed), use fallback for matching IDs
    if (data.length > 0 && data.every((d: any) => d.populacao === 0) && !loadingPop) {
      console.warn("Dados de população não carregados corretamente, aplicando fallback para principais cidades.");
      return data.map((d: any) => {
        const fallback = TOP_CITIES_FALLBACK.find(f => f.id === d.id);
        return fallback ? { ...d, populacao: fallback.populacao } : d;
      }).sort((a: any, b: any) => b.populacao - a.populacao);
    }

    return data;
  }, [municipios, populacoes, loadingMunicipios, loadingPop]);

  const filteredData = useMemo(() => {
    const range = POP_RANGES[selectedPopRange[0]];
    const filtered = mergedData.filter((city: any) => {
      const matchSearch = city.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRegiao = selectedRegiao === "all" || city.regiao === selectedRegiao;
      const matchEstado = selectedEstado === "all" || city.uf === selectedEstado;
      
      const matchPop = city.populacao >= range.min && city.populacao < range.max;

      return matchSearch && matchRegiao && matchEstado && matchPop;
    });

    return filtered;
  }, [mergedData, searchTerm, selectedRegiao, selectedEstado, selectedPopRange]);

  const stats = useMemo(() => {
    return {
      total: municipios.length || 5570,
      over100k: mergedData.filter((c: any) => c.populacao > 100000).length,
      over500k: mergedData.filter((c: any) => c.populacao > 500000).length,
      over1M: mergedData.filter((c: any) => c.populacao > 1000000).length,
    };
  }, [mergedData, municipios]);

  const handleSelectCity = (cityStr: string) => {
    if (selectedCities.includes(cityStr)) {
      setSelectedCities(selectedCities.filter(c => c !== cityStr));
    } else {
      if (selectedCities.length >= 10) {
        toast.error("Máximo de 10 cidades selecionadas");
        return;
      }
      setSelectedCities([...selectedCities, cityStr]);
    }
  };

  const handleQuickSelect = (type: string) => {
    let cities: any[] = [];
    if (type === "capitais") {
      const capitais = ["Rio Branco", "Maceió", "Macapá", "Manaus", "Salvador", "Fortaleza", "Brasília", "Vitória", "Goiânia", "São Luís", "Cuiabá", "Campo Grande", "Belo Horizonte", "Belém", "João Pessoa", "Curitiba", "Recife", "Teresina", "Rio de Janeiro", "Natal", "Porto Alegre", "Porto Velho", "Boa Vista", "Florianópolis", "São Paulo", "Aracaju", "Palmas"];
      cities = mergedData.filter((c: any) => capitais.includes(c.nome) && (c.uf !== "RJ" || c.nome === "Rio de Janeiro")); // Simple filter, maybe not perfect for duplicates
    } else if (type === "nordeste_100k") {
      cities = mergedData.filter((c: any) => c.regiao === "Nordeste" && c.populacao >= 100000);
    } else if (type === "sul_50k") {
      cities = mergedData.filter((c: any) => c.regiao === "Sul" && c.populacao >= 50000);
    } else if (type === "sp_interior_200k") {
      cities = mergedData.filter((c: any) => c.uf === "SP" && c.nome !== "São Paulo" && c.populacao >= 200000);
    } else if (type === "caruaru") {
      const proximas = ["Caruaru", "Bezerros", "Toritama", "Santa Cruz do Capibaribe", "Agrestina", "São Caetano"];
      cities = mergedData.filter((c: any) => proximas.includes(c.nome) && c.uf === "PE");
    }

    const cityStrings = cities.slice(0, 10).map((c: any) => `${c.nome}, ${c.uf}`);
    setSelectedCities(cityStrings);
    toast.success(`${cityStrings.length} cidades selecionadas`);
  };

  const handleUseInSearch = () => {
    if (selectedCities.length === 0) {
      toast.error("Selecione pelo menos uma cidade");
      return;
    }
    navigate({ to: "/", search: { locations: selectedCities } as any });
  };

  const currentEstados = selectedRegiao === "all" ? [] : ESTADOS[selectedRegiao] || [];

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-900 p-8 pb-32">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-zinc-50 flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Territórios Estratégicos
          </h1>
          <p className="text-zinc-400 mt-2">
            Selecione cidades por densidade demográfica para uma prospecção mais eficiente.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard icon={Building2} label="Total de Municípios" value={stats.total.toLocaleString()} />
          <MetricCard icon={Users} label="Cidades > 100k" value={stats.over100k} />
          <MetricCard icon={TrendingUp} label="Cidades > 500k" value={stats.over500k} />
          <MetricCard icon={Target} label="Cidades > 1M" value={stats.over1M} />
        </div>

        {/* Quick Selection */}
        <div className="flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            onClick={() => handleQuickSelect("capitais")}
          >
            Capitais do Brasil
          </Button>
          <Button 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            onClick={() => handleQuickSelect("nordeste_100k")}
          >
            Nordeste acima de 100k
          </Button>
          <Button 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            onClick={() => handleQuickSelect("sul_50k")}
          >
            Sul acima de 50k
          </Button>
          <Button 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            onClick={() => handleQuickSelect("sp_interior_200k")}
          >
            SP interior acima de 200k
          </Button>
          <Button 
            variant="outline" 
            className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
            onClick={() => handleQuickSelect("caruaru")}
          >
            Cidades próximas de Caruaru
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-800/50 border-zinc-700 border-dashed">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Região</label>
                <Select value={selectedRegiao} onValueChange={(val) => {
                  setSelectedRegiao(val);
                  setSelectedEstado("all");
                }}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                    {REGIOES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Estado</label>
                <Select value={selectedEstado} onValueChange={setSelectedEstado} disabled={selectedRegiao === "all"}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-700 text-zinc-300">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-300">
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {currentEstados.map(uf => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex justify-between">
                  <span>População mínima</span>
                  <span className="text-primary">{POP_RANGES[selectedPopRange[0]].label}</span>
                </label>
                <div className="pt-2">
                  <Slider 
                    value={selectedPopRange} 
                    onValueChange={setSelectedPopRange} 
                    max={POP_RANGES.length - 1} 
                    step={1}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Busca por nome</label>
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Ex: São Paulo" 
                    className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <div className="rounded-md border border-zinc-700 bg-zinc-800">
          <Table>
            <TableHeader className="bg-zinc-700/50">
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={filteredData.length > 0 && filteredData.slice(0, 50).every((c: any) => selectedCities.includes(`${c.nome}, ${c.uf}`))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        const pageCities = filteredData.slice(0, 50).map((c: any) => `${c.nome}, ${c.uf}`);
                        const newSelection = [...new Set([...selectedCities, ...pageCities])].slice(0, 10);
                        setSelectedCities(newSelection);
                        if (pageCities.length > 10) toast.info("Apenas as primeiras 10 cidades foram selecionadas");
                      } else {
                        const pageCities = filteredData.slice(0, 50).map((c: any) => `${c.nome}, ${c.uf}`);
                        setSelectedCities(selectedCities.filter(c => !pageCities.includes(c)));
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">Cidade</TableHead>
                <TableHead className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">UF</TableHead>
                <TableHead className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">População (Censo 2022)</TableHead>
                <TableHead className="text-zinc-400 font-bold text-[10px] uppercase tracking-wider">Região</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loadingMunicipios || loadingPop) ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-zinc-800/50">
                    <TableCell colSpan={5} className="h-16 animate-pulse bg-zinc-800/20" />
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-zinc-500">Nenhuma cidade encontrada com esses filtros.</TableCell>
                </TableRow>
              ) : (
              (filteredData.length > 500 ? filteredData.slice(0, 500) : filteredData).map((city: any) => {
                  const cityStr = `${city.nome}, ${city.uf}`;
                  return (
                    <TableRow key={city.id} className="border-zinc-700 hover:bg-zinc-700 transition-colors">
                      <TableCell>
                        <Checkbox 
                          checked={selectedCities.includes(cityStr)}
                          onCheckedChange={() => handleSelectCity(cityStr)}
                          className="border-zinc-500 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-zinc-50">{city.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-400">
                          {city.uf}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-200 font-mono">
                        {city.populacao.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-zinc-400 text-xs">
                        {city.regiao}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Floating Action Bar */}
      {selectedCities.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-zinc-800 border border-zinc-700 rounded-full shadow-2xl px-6 py-4 flex items-center gap-6 backdrop-blur-md">
            <div className="flex flex-col">
              <span className="text-zinc-50 font-bold text-sm">
                {selectedCities.length} cidades selecionadas
              </span>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                Máximo de 10 cidades
              </span>
            </div>
            <div className="h-8 w-[1px] bg-zinc-700" />
            <Button 
              className="bg-[#aaff00] hover:bg-[#aaff00]/90 text-black font-bold px-8 rounded-full shadow-[0_0_20px_rgba(170,255,0,0.3)] transition-all hover:scale-105"
              onClick={handleUseInSearch}
            >
              USAR NA BUSCA
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <button 
              className="text-zinc-500 hover:text-zinc-300 text-xs font-medium"
              onClick={() => setSelectedCities([])}
            >
              Limpar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
