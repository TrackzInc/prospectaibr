import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { User, Lock, Mail, Bell, Shield, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

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
          </Tabs>
        </div>
      </div>
    </div>
  );
}
