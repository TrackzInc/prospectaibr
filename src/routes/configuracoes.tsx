import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Lock, Mail, Bell, Shield, Settings as SettingsIcon, Database, Link as LinkIcon, LogOut, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { crmSupabase, isCRMConnected } from "@/integrations/crm/client";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [crmConnected, setCrmConnected] = useState(false);
  const [crmUser, setCrmUser] = useState<any>(null);
  const [crmEmail, setCrmEmail] = useState("");
  const [crmPassword, setCrmPassword] = useState("");
  const [showCrmLogin, setShowCrmLogin] = useState(false);
  const [testStatus, setTestStatus] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message?: string }>({ status: 'idle' });

  useEffect(() => {
    checkCrmStatus();
  }, []);

  const checkCrmStatus = async () => {
    const connected = await isCRMConnected();
    setCrmConnected(connected);
    if (connected) {
      const { data: { user } } = await crmSupabase.auth.getUser();
      setCrmUser(user);
    }
  };

  const handleCrmLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await crmSupabase.auth.signInWithPassword({
        email: crmEmail,
        password: crmPassword,
      });
      if (error) throw error;
      toast.success("Conectado ao CRM com sucesso!");
      setCrmConnected(true);
      setCrmUser(data.user);
      setShowCrmLogin(false);
    } catch (error: any) {
      toast.error("Erro ao conectar CRM: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCrmLogout = async () => {
    await crmSupabase.auth.signOut();
    setCrmConnected(false);
    setCrmUser(null);
    toast.info("CRM desconectado");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setEmail(user.email || "");
      }
    });
  }, []);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });
      if (error) throw error;
      toast.success("E-mail de confirmação enviado para o novo endereço!");
    } catch (error: any) {
      toast.error("Erro ao atualizar e-mail: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error("Erro ao atualizar senha: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      toast.success("E-mail de redefinição de senha enviado!");
    } catch (error: any) {
      toast.error("Erro ao enviar e-mail: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-zinc-50">
      <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-zinc-50">Configurações</h1>
          <p className="text-xs text-zinc-500 mt-1 uppercase tracking-widest font-medium">Gerencie sua conta e preferências do sistema.</p>
        </div>
      </header>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="perfil" className="space-y-6">
            <TabsList className="bg-zinc-800 border-zinc-700 p-1">
              <TabsTrigger value="perfil" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary font-bold uppercase tracking-tight text-[10px]">
                <User className="h-3.5 w-3.5" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="seguranca" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary font-bold uppercase tracking-tight text-[10px]">
                <Shield className="h-3.5 w-3.5" />
                Segurança
              </TabsTrigger>
              <TabsTrigger value="preferencias" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary font-bold uppercase tracking-tight text-[10px]">
                <SettingsIcon className="h-3.5 w-3.5" />
                Sistema
              </TabsTrigger>
              <TabsTrigger value="integracoes" className="gap-2 data-[state=active]:bg-zinc-700 data-[state=active]:text-primary font-bold uppercase tracking-tight text-[10px]">
                <Database className="h-3.5 w-3.5" />
                Integrações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="perfil">
              <Card className="bg-zinc-800/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Informações da Conta
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Mantenha seus dados de contato atualizados.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleUpdateEmail}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Endereço de E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-zinc-900 border-zinc-700 text-zinc-50 focus-visible:ring-primary"
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-zinc-800 mt-6 pt-6">
                    <Button 
                      type="submit" 
                      disabled={loading || email === user?.email}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-tighter"
                    >
                      {loading ? "Salvando..." : "Salvar Alterações"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>

            <TabsContent value="seguranca">
              <div className="grid gap-6">
                <Card className="bg-zinc-800/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-50 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-primary" />
                      Alterar Senha
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Escolha uma senha forte para proteger sua conta.
                    </CardDescription>
                  </CardHeader>
                  <form onSubmit={handleUpdatePassword}>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-50 focus-visible:ring-primary"
                          required
                          minLength={6}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-zinc-400 uppercase text-[10px] font-bold tracking-widest">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="bg-zinc-900 border-zinc-700 text-zinc-50 focus-visible:ring-primary"
                          required
                          minLength={6}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="border-t border-zinc-800 mt-6 pt-6">
                      <Button 
                        type="submit" 
                        disabled={loading || !newPassword}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-tighter"
                      >
                        {loading ? "Atualizando..." : "Atualizar Senha"}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>

                <Card className="bg-zinc-800/50 border-zinc-800 border-l-4 border-l-amber-500">
                  <CardHeader>
                    <CardTitle className="text-zinc-50">Redefinição de Emergência</CardTitle>
                    <CardDescription className="text-zinc-400">
                      Se você esqueceu sua senha atual ou deseja resetá-la via e-mail, clique no botão abaixo.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button 
                      variant="outline" 
                      onClick={handleResetPassword}
                      disabled={loading}
                      className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10 hover:text-amber-500 font-bold uppercase tracking-tighter"
                    >
                      Enviar Link de Redefinição
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="preferencias">
              <Card className="bg-zinc-800/50 border-zinc-800">
                <CardHeader>
                  <CardTitle className="text-zinc-50 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    Notificações e Preferências
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Configure como o sistema deve interagir com você.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-zinc-200">Notificações por E-mail</Label>
                      <p className="text-xs text-zinc-500">Receba alertas de novos leads e agendamentos.</p>
                    </div>
                    <div className="h-6 w-11 bg-zinc-800 rounded-full border border-zinc-700 flex items-center px-1">
                      <div className="h-4 w-4 bg-zinc-600 rounded-full"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold text-zinc-200">Sincronização Automática</Label>
                      <p className="text-xs text-zinc-500">Sincronizar leads com CRM automaticamente ao gerar.</p>
                    </div>
                    <div className="h-6 w-11 bg-primary rounded-full flex items-center justify-end px-1">
                      <div className="h-4 w-4 bg-primary-foreground rounded-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integracoes">
              <div className="grid gap-6">
                <Card className="bg-zinc-800/50 border-zinc-800 border-l-4 border-l-primary">
                  <CardHeader>
                    <CardTitle className="text-zinc-50 flex items-center gap-2">
                      <LinkIcon className="h-5 w-5 text-primary" />
                      Conectar CRM ProspectAI
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Sincronize seus leads automaticamente com o funil de vendas do seu CRM.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {crmConnected ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <CheckCircle2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-100">CRM Conectado</p>
                              <p className="text-xs text-zinc-500">{crmUser?.email}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleCrmLogout}
                            className="text-zinc-500 hover:text-red-400 hover:bg-red-400/10 gap-2"
                          >
                            <LogOut className="h-4 w-4" />
                            Desconectar
                          </Button>
                        </div>
                        
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <p className="text-xs font-bold text-zinc-300 uppercase tracking-tight">Status da Sincronização</p>
                              <p className="text-[10px] text-zinc-500 uppercase">Leads sincronizados com sucesso</p>
                            </div>
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">OPERACIONAL</Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!showCrmLogin ? (
                          <div className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-800 text-center space-y-4">
                            <Database className="h-12 w-12 text-zinc-700 mx-auto" />
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-zinc-300">Integração Nativa com CRM</p>
                              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                                Conecte sua conta do CRM para enviar leads diretamente para o funil de vendas com status e tags mapeadas.
                              </p>
                            </div>
                            <Button 
                              onClick={() => setShowCrmLogin(true)}
                              className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-tight"
                            >
                              Conectar meu CRM
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleCrmLogin} className="space-y-4 p-4 border border-zinc-800 rounded-lg bg-zinc-900/30">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-zinc-500">E-mail do CRM</Label>
                              <Input 
                                type="email" 
                                value={crmEmail}
                                onChange={(e) => setCrmEmail(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                placeholder="seu@email.com"
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold uppercase text-zinc-500">Senha do CRM</Label>
                              <Input 
                                type="password" 
                                value={crmPassword}
                                onChange={(e) => setCrmPassword(e.target.value)}
                                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                                required
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button 
                                type="submit" 
                                disabled={loading}
                                className="flex-1 bg-primary text-primary-foreground font-bold"
                              >
                                {loading ? "Conectando..." : "Confirmar Conexão"}
                              </Button>
                              <Button 
                                type="button"
                                variant="outline"
                                onClick={() => setShowCrmLogin(false)}
                                className="border-zinc-700 text-zinc-400"
                              >
                                Cancelar
                              </Button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}

                    {crmConnected && (
                      <Card className="bg-zinc-900/50 border-zinc-800 mt-4 overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                            <Database className="h-4 w-4 text-primary" />
                            Testar Sincronização
                          </CardTitle>
                          <CardDescription className="text-xs text-zinc-500">
                            Valide a conexão enviando um contato de teste para o CRM externo.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          {testStatus.status !== 'idle' && (
                            <div className={`p-3 rounded-md mb-4 flex items-start gap-3 text-xs border ${
                              testStatus.status === 'loading' ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400' :
                              testStatus.status === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                              'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}>
                              {testStatus.status === 'loading' ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              ) : testStatus.status === 'success' ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0" />
                              ) : (
                                <AlertCircle className="h-4 w-4 shrink-0" />
                              )}
                              <div className="space-y-1">
                                <p className="font-bold uppercase tracking-tight">
                                  {testStatus.status === 'loading' ? 'Verificando...' : 
                                   testStatus.status === 'success' ? 'Sucesso' : 'Falha na Sincronização'}
                                </p>
                                <p className="opacity-80">{testStatus.message}</p>
                              </div>
                            </div>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            disabled={testStatus.status === 'loading'}
                            onClick={async () => {
                              setTestStatus({ status: 'loading', message: 'Iniciando teste de conexão...' });
                              try {
                                // 1. Verificar Autenticação
                                setTestStatus({ status: 'loading', message: 'Verificando credenciais no CRM...' });
                                const { data: { user: cUser }, error: authError } = await crmSupabase.auth.getUser();
                                if (authError || !cUser) throw new Error("Não foi possível autenticar no CRM. Verifique se as credenciais estão corretas.");
                                
                                // 2. Verificar existência da tabela
                                setTestStatus({ status: 'loading', message: 'Verificando acesso à tabela contacts...' });
                                const { error: tableError } = await crmSupabase.from('contacts').select('id').limit(1);
                                if (tableError && tableError.code === '42P01') {
                                  throw new Error("A tabela 'contacts' não foi encontrada no CRM. Verifique se o projeto do CRM está configurado corretamente.");
                                }

                                // 3. Tentar Inserir Lead
                                setTestStatus({ status: 'loading', message: 'Enviando lead de teste...' });
                                
                                const testPayload = {
                                  user_id: cUser.id,
                                  name: "TESTE PROSPECTAI - " + new Date().toLocaleTimeString(),
                                  phone: "00000000000",
                                  origin: "ProspectAI",
                                  is_lead: true,
                                  stage: "novo_lead",
                                  status: "novo",
                                  notes: `Teste realizado em ${new Date().toLocaleString('pt-BR')}.`
                                };

                                const { error: insertError } = await crmSupabase.from('contacts').insert(testPayload);

                                if (insertError) {
                                  console.error("Erro detalhado do CRM:", insertError);
                                  let errorMessage = insertError.message;
                                  if (insertError.code === '42501') {
                                    errorMessage = "Erro de permissão (RLS). Certifique-se de que seu usuário no CRM tem permissão para inserir contatos.";
                                  }
                                  throw new Error(errorMessage + ` (Código: ${insertError.code})`);
                                }

                                setTestStatus({ status: 'success', message: 'Conexão validada! O lead de teste foi criado com sucesso no CRM.' });
                                toast.success("Integração funcionando perfeitamente!");
                              } catch (error: any) {
                                console.error("Erro no teste de sincronização:", error);
                                setTestStatus({ status: 'error', message: error.message || "Erro desconhecido ao tentar sincronizar." });
                                toast.error("Falha no teste de integração.");
                              }
                            }}
                            className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 gap-2 font-bold uppercase text-[10px] tracking-widest"
                          >
                            {testStatus.status === 'loading' ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Database className="h-3.5 w-3.5" />
                            )}
                            Testar Sincronização Agora
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800/50 border-zinc-800">
                  <CardHeader>
                    <CardTitle className="text-zinc-50 flex items-center gap-2">
                      <Database className="h-5 w-5 text-primary" />
                      Vínculo Manual (Tabela Local)
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                      Os dados também são salvos na tabela local para acesso via Git ou Supabase direto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-200 mb-2">Conexão via Supabase Direct</h4>
                      <p className="text-xs text-zinc-500 mb-4">
                        Para vincular seu CRM diretamente via Git/Supabase, use os dados da tabela <code className="text-primary bg-primary/5 px-1 rounded">contacts</code> do banco de dados deste projeto. 
                      </p>
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                          <span>Status da Tabela</span>
                          <span className="text-primary font-bold">Ativa</span>
                        </div>
                        <div className="flex justify-between text-[10px] uppercase tracking-widest text-zinc-500">
                          <span>Endpoint sugerido</span>
                          <span className="text-zinc-300">/rest/v1/contacts</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
