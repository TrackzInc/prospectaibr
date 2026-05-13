import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  Smartphone, 
  Plus, 
  Settings, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  QrCode,
  Link2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/conexoes")({
  component: ConexoesPage,
});

type Instance = {
  id: string;
  instance_name: string;
  instance_id: string | null;
  status: string;
  qrcode?: string;
};

type EvolutionConfig = {
  api_url: string;
  api_key: string;
};

function ConexoesPage() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingQr, setLoadingQr] = useState<string | null>(null);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [config, setConfig] = useState<EvolutionConfig | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState("");
  const [tempKey, setTempKey] = useState("");
  const [connectionTested, setConnectionTested] = useState(false);

  const fetchConfig = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('evolution_config')
      .select('api_url, api_key')
      .eq('user_id', user.id)
      .single();
    
    if (data) {
      setConfig(data);
      setTempUrl(data.api_url);
      setTempKey(data.api_key);
    } else {
      setShowConfig(true);
    }
  };

  const fetchInstances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_instances')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInstances((data as any[])?.map(item => ({
        ...item,
        status: item.status || 'disconnected'
      })) || []);
    } catch (err: any) {
      toast.error("Erro ao carregar instâncias: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchInstances();
  }, []);

  const saveConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('evolution_config')
        .upsert({
          user_id: user.id,
          api_url: tempUrl,
          api_key: tempKey
        }, { onConflict: 'user_id' });

      if (error) throw error;
      
      setConfig({ api_url: tempUrl, api_key: tempKey });
      setShowConfig(false);
      toast.success("Configuração salva!");
    } catch (err: any) {
      toast.error("Erro ao salvar config: " + err.message);
    }
  };

  const testConnection = async () => {
    if (!tempUrl || !tempKey) {
      toast.error("Informe a URL e a API Key para testar");
      return;
    }

    try {
      const baseUrl = tempUrl.endsWith('/') ? tempUrl.slice(0, -1) : tempUrl;
      const response = await fetch(baseUrl, {
        headers: {
          'apikey': tempKey
        }
      });

      if (response.ok) {
        setConnectionTested(true);
        toast.success("Conexão estabelecida com sucesso! (It is working)");
      } else {
        setConnectionTested(false);
        const errorData = await response.json().catch(() => ({}));
        toast.error(`⚠️ Falha na conexão: ${response.status} ${errorData.message || 'Verifique URL e API Key'}`);
      }
    } catch (err: any) {
      setConnectionTested(false);
      toast.error("⚠️ Erro ao testar conexão: " + err.message);
    }
  };

  const createInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error("Informe um nome para a instância");
      return;
    }

    if (!config) {
      setShowConfig(true);
      toast.error("Configure a Evolution API primeiro");
      return;
    }

    if (!connectionTested) {
      setShowConfig(true);
      toast.error("⚠️ Teste a conexão antes de criar uma instância");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Create in Evolution API
      // Sanitize instance name: no spaces, only alphanumeric and underscores
      const sanitizedName = newInstanceName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
      
      const baseUrl = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url;
      const url = `${baseUrl}/instance/create`;
      const headers = {
        'apikey': config.api_key,
        'Content-Type': 'application/json'
      };
      const body = {
        instanceName: sanitizedName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      };

      console.log("DEBUG: Request Criar Instância", { url, headers, body });
      
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      const evoData = await response.json();
      console.log("Resposta Evolution API (Create):", evoData);
      
      if (!response.ok) {
        console.error("ERRO API (Create):", evoData);
        // Handle specific error case where instance already exists but we want to connect it
        if ((evoData.status === 400 || evoData.code === 400) && 
            (evoData.message?.toLowerCase().includes('existe') || 
             evoData.message?.toLowerCase().includes('exists') ||
             evoData.message?.toLowerCase().includes('taken'))) {
          toast.info("A instância já existe na API. Tentando conectar...");
        } else {
          const apiError = evoData.message || evoData.error || JSON.stringify(evoData);
          throw new Error(apiError);
        }
      }

      // Check if instance already exists in Supabase
      const { data: existingInstance } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('instance_name', sanitizedName)
        .maybeSingle();

      if (!existingInstance) {
        // 2. Save in Supabase
        const { error } = await supabase
          .from('whatsapp_instances')
          .insert({
            user_id: user.id,
            instance_name: sanitizedName,
            instance_id: evoData.instance?.instanceId || evoData.instance?.name || sanitizedName,
            status: 'disconnected'
          });

        if (error) throw error;
      }

      toast.success("Instância pronta! Buscando QR Code...");
      setNewInstanceName("");
      
      // 3. Get QR Code immediately after creation
      await getQRCode(sanitizedName);
      
      fetchInstances();
    } catch (err: any) {
      console.error("Erro detalhado ao criar instância:", err);
      toast.error("Erro ao criar instância: " + err.message);
    }
  };

  const deleteInstance = async (id: string, instanceName: string) => {
    if (!config) return;

    try {
      const baseUrl = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url;
      
      // 1. Delete from Evolution API
      const response = await fetch(`${baseUrl}/instance/delete/${instanceName}`, {
        method: 'DELETE',
        headers: { 'apikey': config.api_key }
      });
      
      if (!response.ok) {
        const errData = await response.json();
        console.warn("Aviso ao excluir na API (pode já não existir):", errData);
      }

      // 2. Delete from Supabase
      const { error } = await supabase
        .from('whatsapp_instances')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Instância excluída");
      fetchInstances();
    } catch (err: any) {
      console.error("Erro ao excluir instância:", err);
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const getQRCode = async (instanceName: string) => {
    if (!config) return;
    try {
      setLoadingQr(instanceName);
      const baseUrl = config.api_url.endsWith('/') ? config.api_url.slice(0, -1) : config.api_url;
      const url = `${baseUrl}/instance/connect/${instanceName}`;
      
      console.log("Buscando QR Code em:", url);
      
      const response = await fetch(url, {
        headers: { 'apikey': config.api_key }
      });
      
      const data = await response.json();
      console.log("Resposta Evolution API (QR Code):", data);
      
      // Handle different Evolution API response formats for QR code
      const qrBase64 = data.base64 || data.qrcode?.base64 || data.code;
      const isConnected = data.instance?.state === 'open' || data.state === 'open' || data.status === 'open' || data.instance?.status === 'open';

      if (qrBase64) {
        setInstances(prev => prev.map(inst => 
          inst.instance_name === instanceName ? { ...inst, qrcode: qrBase64 } : inst
        ));
        toast.success("QR Code gerado!");
      } else if (isConnected) {
        toast.success("Instância já conectada!");
        updateStatus(instanceName, 'connected');
      } else {
        console.warn("Dados do QR Code não encontrados na resposta:", data);
        toast.error("QR Code não disponível. Tente novamente em alguns segundos.");
      }
    } catch (err: any) {
      console.error("Erro ao obter QR Code:", err);
      toast.error("Erro ao obter QR Code: " + err.message);
    } finally {
      setLoadingQr(null);
    }
  };

  const updateStatus = async (instanceName: string, status: string) => {
    await supabase
      .from('whatsapp_instances')
      .update({ status })
      .eq('instance_name', instanceName);
    fetchInstances();
  };

  const activeConnections = instances.filter(i => i.status === 'connected').length;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">CONTROL CENTER</h1>
          <h2 className="text-primary font-bold uppercase tracking-[0.3em] text-sm mt-1 flex items-center gap-2">
            WHATSAPP
            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] animate-pulse">SAUDÁVEL</Badge>
          </h2>
          <p className="text-zinc-400 text-sm mt-4 max-w-md">Gerencie sua frota de conexões WhatsApp para prospecção automatizada.</p>
        </div>

        <div className="flex gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Conexões Ativas</p>
            <p className="text-4xl font-black text-primary">{activeConnections}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Total Frota</p>
            <p className="text-4xl font-black text-white">{instances.length}</p>
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowConfig(!showConfig)}
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-400"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Config Section */}
      {showConfig && (
        <Card className="bg-zinc-800 border-zinc-700 mb-8 overflow-hidden animate-in slide-in-from-top duration-300">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Settings className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Configuração Evolution API</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">URL da API</label>
                <Input 
                  placeholder="https://api.suaevolution.com.br" 
                  value={tempUrl}
                  onChange={(e) => { setTempUrl(e.target.value); setConnectionTested(false); }}
                  className="bg-zinc-900 border-zinc-700 h-10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">API Key</label>
                <Input 
                  type="password"
                  placeholder="Sua API Key" 
                  value={tempKey}
                  onChange={(e) => { setTempKey(e.target.value); setConnectionTested(false); }}
                  className="bg-zinc-900 border-zinc-700 h-10"
                />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                <Button variant="ghost" onClick={() => setShowConfig(false)} className="text-zinc-500">Cancelar</Button>
                <Button 
                  variant="outline" 
                  onClick={testConnection} 
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  TESTAR CONEXÃO
                </Button>
                <Button onClick={saveConfig} className="bg-primary text-black font-bold">SALVAR CONFIGURAÇÃO</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connection status banner */}
      {!connectionTested && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
          <p className="text-xs text-yellow-200/80">
            Antes de criar instâncias, abra a configuração e clique em <span className="font-bold text-yellow-300">TESTAR CONEXÃO</span>. A criação só será liberada após status 200.
          </p>
        </div>
      )}

      {/* Create Instance */}
      <div className="flex flex-col sm:flex-row gap-4 mb-12">
        <Input 
          placeholder="Nome da Instância (ex: Vendas)" 
          value={newInstanceName}
          onChange={(e) => setNewInstanceName(e.target.value)}
          className="bg-zinc-800 border-zinc-700 h-12 text-zinc-100 flex-1"
          disabled={!connectionTested}
        />
        <Button 
          onClick={createInstance}
          disabled={!connectionTested}
          className="bg-primary hover:bg-primary/90 text-black font-black px-8 h-12 text-xs tracking-widest shadow-[0_0_20px_rgba(170,255,0,0.2)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          CRIAR INSTÂNCIA
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-zinc-800/50 rounded-xl animate-pulse border border-zinc-800" />)}
        </div>
      ) : instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-700/50">
            <Smartphone className="h-10 w-10 text-zinc-700" />
          </div>
          <h3 className="text-2xl font-black text-zinc-700 italic tracking-tighter uppercase mb-2">FROTA VAZIA</h3>
          <p className="text-zinc-500 text-sm max-w-xs">Você ainda não tem instâncias configuradas. <br/>Crie uma acima para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {instances.map((inst) => (
            <Card key={inst.id} className="bg-zinc-800 border-zinc-700 overflow-hidden group hover:border-zinc-500 transition-all duration-300 shadow-none">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-lg text-white mb-1">{inst.instance_name}</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${inst.status === 'connected' ? 'bg-primary' : 'bg-red-500'}`} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                        {inst.status === 'connected' ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => deleteInstance(inst.id, inst.instance_name)}
                    className="text-zinc-600 hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-col items-center justify-center bg-zinc-900/50 rounded-lg p-6 mb-6 border border-zinc-700/30">
                  {loadingQr === inst.instance_name ? (
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                      <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Buscando...</p>
                    </div>
                  ) : inst.qrcode ? (
                    <div className="bg-white p-2 rounded-lg animate-in zoom-in duration-300">
                      <img src={inst.qrcode.startsWith('data:') ? inst.qrcode : `data:image/png;base64,${inst.qrcode}`} alt="QR Code" className="w-32 h-32" />
                    </div>
                  ) : inst.status === 'connected' ? (
                    <div className="flex flex-col items-center gap-3">
                      <CheckCircle2 className="h-12 w-12 text-primary/40" />
                      <p className="text-[10px] font-bold text-primary tracking-widest uppercase">Pronto para uso</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <QrCode className="h-12 w-12 text-zinc-700" />
                      <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase text-center px-4">QR Code pendente</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {inst.status !== 'connected' ? (
                    <Button 
                      onClick={() => getQRCode(inst.instance_name)}
                      disabled={loadingQr === inst.instance_name}
                      className="col-span-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-[10px] tracking-widest uppercase"
                    >
                      {inst.qrcode ? 'ATUALIZAR QR CODE' : 'CONECTAR'}
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="col-span-2 border-zinc-700 text-zinc-400 hover:bg-zinc-700 font-bold text-[10px] tracking-widest uppercase"
                      disabled
                    >
                      DESCONECTAR
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}