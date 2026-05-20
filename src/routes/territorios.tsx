import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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

function Territorios() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegiao, setSelectedRegiao] = useState("all");
  const [selectedEstado, setSelectedEstado] = useState("all");
  const [selectedPopRange, setSelectedPopRange] = useState([0]); // Index of range
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Fetch municipios
  const { data: municipios = [], isLoading: loadingMunicipios } = useQuery({
    queryKey: ['municipios'],
    queryFn: async () => {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios');
        const data = await res.json();
        return data.map((m: any) => ({
          id: m.id.toString(),
          nome: m.nome,
          uf: m.microrregiao.mesorregiao.UF.sigla,
          regiao: m.microrregiao.mesorregiao.UF.regiao.nome
        }));
      } catch (error) {
        console.error("Erro ao buscar municípios do IBGE:", error);
        return [];
      }
    },
    staleTime: Infinity,
  });

  // Fetch populacao
  const { data: populacoes = {}, isLoading: loadingPop } = useQuery({
    queryKey: ['populacao'],
    queryFn: async () => {
      try {
        const res = await fetch('https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6[all]');
        const data = await res.json();
        const results: Record<string, number> = {};
        if (data && data[0] && data[0].resultados && data[0].resultados[0]) {
          data[0].resultados[0].series.forEach((s: any) => {
            results[s.localidade.id] = parseInt(s.serie['2022']);
          });
        }
        return results;
      } catch (error) {
        console.error("Erro ao buscar população do IBGE:", error);
        return {};
      }
    },
    staleTime: Infinity,
  });

  const mergedData = useMemo(() => {
    // Se não houver dados da API, podemos retornar uma lista vazia ou mockada
    // Mas o objetivo é cruzar ID do município com o ID da população
    const data = municipios.map((m: Municipio) => ({
      ...m,
      populacao: populacoes[m.id] || 0
    })).sort((a: any, b: any) => b.populacao - a.populacao);

    // Se a API falhou ou está vazia, mas temos municípios, podemos usar o mock se necessário
    // Por enquanto, confiamos na correção da URL N6[all]
    return data;
  }, [municipios, populacoes]);

  const filteredData = useMemo(() => {
    return mergedData.filter((city: any) => {
      const matchSearch = city.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRegiao = selectedRegiao === "all" || city.regiao === selectedRegiao;
      const matchEstado = selectedEstado === "all" || city.uf === selectedEstado;
      
      const range = POP_RANGES[selectedPopRange[0]];
      const matchPop = city.populacao >= range.min && city.populacao < range.max;

      return matchSearch && matchRegiao && matchEstado && matchPop;
    });
  }, [mergedData, searchTerm, selectedRegiao, selectedEstado, selectedPopRange]);

  const stats = useMemo(() => {
    return {
      total: 5570,
      over100k: mergedData.filter((c: any) => c.populacao > 100000).length,
      over500k: mergedData.filter((c: any) => c.populacao > 500000).length,
      over1M: mergedData.filter((c: any) => c.populacao > 1000000).length,
    };
  }, [mergedData]);

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
                    max={4} 
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
        <div className="rounded-md border border-zinc-800 bg-zinc-800/20">
          <Table>
            <TableHeader className="bg-zinc-800/50">
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
                filteredData.slice(0, 50).map((city: any) => {
                  const cityStr = `${city.nome}, ${city.uf}`;
                  return (
                    <TableRow key={city.id} className="border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                      <TableCell>
                        <Checkbox 
                          checked={selectedCities.includes(cityStr)}
                          onCheckedChange={() => handleSelectCity(cityStr)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-zinc-200">{city.nome}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-zinc-800 border-zinc-700 text-zinc-400">
                          {city.uf}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-zinc-300 font-mono">
                        {city.populacao.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-xs">
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
