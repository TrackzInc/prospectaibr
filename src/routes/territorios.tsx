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
  { label: "Todas", min: 0, max: Infinity },
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

  // Cidades hardcoded para carregamento instantâneo
  const municipios = [
    { id: "3550308", nome: "São Paulo", uf: "SP", regiao: "Sudeste", populacao: 11451245 },
    { id: "3304557", nome: "Rio de Janeiro", uf: "RJ", regiao: "Sudeste", populacao: 6748000 },
    { id: "5300108", nome: "Brasília", uf: "DF", regiao: "Centro-Oeste", populacao: 3094000 },
    { id: "2927408", nome: "Salvador", uf: "BA", regiao: "Nordeste", populacao: 2886000 },
    { id: "2304400", nome: "Fortaleza", uf: "CE", regiao: "Nordeste", populacao: 2703000 },
    { id: "3106200", nome: "Belo Horizonte", uf: "MG", regiao: "Sudeste", populacao: 2530000 },
    { id: "1302603", nome: "Manaus", uf: "AM", regiao: "Norte", populacao: 2255000 },
    { id: "4106902", nome: "Curitiba", uf: "PR", regiao: "Sul", populacao: 1952000 },
    { id: "2611606", nome: "Recife", uf: "PE", regiao: "Nordeste", populacao: 1661000 },
    { id: "5208707", nome: "Goiânia", uf: "GO", regiao: "Centro-Oeste", populacao: 1555000 },
    { id: "4314902", nome: "Porto Alegre", uf: "RS", regiao: "Sul", populacao: 1484000 },
    { id: "1501402", nome: "Belém", uf: "PA", regiao: "Norte", populacao: 1499000 },
    { id: "3518800", nome: "Guarulhos", uf: "SP", regiao: "Sudeste", populacao: 1392000 },
    { id: "3509502", nome: "Campinas", uf: "SP", regiao: "Sudeste", populacao: 1213000 },
    { id: "2111300", nome: "São Luís", uf: "MA", regiao: "Nordeste", populacao: 1108000 },
    { id: "3304904", nome: "São Gonçalo", uf: "RJ", regiao: "Sudeste", populacao: 1091000 },
    { id: "2704302", nome: "Maceió", uf: "AL", regiao: "Nordeste", populacao: 1025000 },
    { id: "2408102", nome: "Natal", uf: "RN", regiao: "Nordeste", populacao: 890000 },
    { id: "2211001", nome: "Teresina", uf: "PI", regiao: "Nordeste", populacao: 868000 },
    { id: "5002704", nome: "Campo Grande", uf: "MS", regiao: "Centro-Oeste", populacao: 916000 },
    { id: "2507507", nome: "João Pessoa", uf: "PB", regiao: "Nordeste", populacao: 817000 },
    { id: "3547809", nome: "Santo André", uf: "SP", regiao: "Sudeste", populacao: 748000 },
    { id: "3534401", nome: "Osasco", uf: "SP", regiao: "Sudeste", populacao: 696000 },
    { id: "3548708", nome: "São Bernardo do Campo", uf: "SP", regiao: "Sudeste", populacao: 844000 },
    { id: "2607901", nome: "Jaboatão dos Guararapes", uf: "PE", regiao: "Nordeste", populacao: 706000 },
    { id: "3543402", nome: "Ribeirão Preto", uf: "SP", regiao: "Sudeste", populacao: 718000 },
    { id: "3170206", nome: "Uberlândia", uf: "MG", regiao: "Sudeste", populacao: 706000 },
    { id: "3552205", nome: "Sorocaba", uf: "SP", regiao: "Sudeste", populacao: 700000 },
    { id: "3118601", nome: "Contagem", uf: "MG", regiao: "Sudeste", populacao: 668000 },
    { id: "2800308", nome: "Aracaju", uf: "SE", regiao: "Nordeste", populacao: 664000 },
    { id: "2910800", nome: "Feira de Santana", uf: "BA", regiao: "Nordeste", populacao: 630000 },
    { id: "5103403", nome: "Cuiabá", uf: "MT", regiao: "Centro-Oeste", populacao: 623000 },
    { id: "4209102", nome: "Joinville", uf: "SC", regiao: "Sul", populacao: 616000 },
    { id: "3136702", nome: "Juiz de Fora", uf: "MG", regiao: "Sudeste", populacao: 573000 },
    { id: "4113700", nome: "Londrina", uf: "PR", regiao: "Sul", populacao: 575000 },
    { id: "2933307", nome: "Vitória da Conquista", uf: "BA", regiao: "Nordeste", populacao: 341000 },
    { id: "3506003", nome: "Bauru", uf: "SP", regiao: "Sudeste", populacao: 379000 },
    { id: "3549904", nome: "São José do Rio Preto", uf: "SP", regiao: "Sudeste", populacao: 469000 },
    { id: "3538709", nome: "Piracicaba", uf: "SP", regiao: "Sudeste", populacao: 407000 },
    { id: "3525300", nome: "Jundiaí", uf: "SP", regiao: "Sudeste", populacao: 423000 },
    { id: "3530607", nome: "Mauá", uf: "SP", regiao: "Sudeste", populacao: 477000 },
    { id: "3502804", nome: "Anápolis", uf: "GO", regiao: "Centro-Oeste", populacao: 391000 },
    { id: "3541000", nome: "Praia Grande", uf: "SP", regiao: "Sudeste", populacao: 330000 },
    { id: "3516200", nome: "Franca", uf: "SP", regiao: "Sudeste", populacao: 355000 },
    { id: "3523107", nome: "Itaquaquecetuba", uf: "SP", regiao: "Sudeste", populacao: 375000 },
    { id: "2604106", nome: "Caruaru", uf: "PE", regiao: "Nordeste", populacao: 365000 },
    { id: "3505708", nome: "Barueri", uf: "SP", regiao: "Sudeste", populacao: 276000 },
  ];

  useEffect(() => {
    console.log(`[Territorios] Array de municípios carregado com ${municipios.length} cidades.`);
  }, []);

  const mergedData = useMemo(() => {
    return [...municipios].sort((a, b) => b.populacao - a.populacao);
  }, [municipios]);

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
    const data = mergedData;
    return {
      total: data.length || 5570,
      over100k: data.filter((c: any) => c.populacao > 100000).length,
      over500k: data.filter((c: any) => c.populacao > 500000).length,
      over1M: data.filter((c: any) => c.populacao > 1000000).length,
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
              {filteredData.length === 0 ? (
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
