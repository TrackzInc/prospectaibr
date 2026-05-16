# Plano de Integração com Projeto CRM

O objetivo é permitir que o usuário conecte este projeto ao seu projeto de CRM externo (Remix of Cashflow Connect) e sincronize automaticamente os leads capturados.

## Mudanças propostas

### Integração Supabase
- Criar um novo cliente Supabase em `src/integrations/crm/client.ts` apontando para o backend do projeto CRM.
- Usar a URL do Supabase do projeto CRM: `https://xqavudmwsnuzzcgetzkb.supabase.co` (obtida das ferramentas de sistema para o projeto CRM).

### Configurações
- Adicionar uma seção "Conectar CRM" na aba de Integrações em `src/routes/configuracoes.tsx`.
- Implementar o fluxo de autenticação para o CRM externo (armazenando a sessão separadamente se necessário, seguindo o padrão do SaaS Hub).
- Salvar o estado da conexão no `localStorage` ou banco de dados local.

### Sincronização de Dados
- Criar um hook ou utilitário `syncLeadToCRM` que:
    - Recebe os dados de uma empresa/lead.
    - Insere ou atualiza na tabela `contacts` do CRM externo.
    - Define `is_lead: true` e mapeia o status para o `stage` do CRM.
- Integrar este utilitário nos fluxos de:
    - "Vincular ao meu CRM" (que já existe no código, mas agora será automatizado via API).
    - Captura automática de novos leads (se configurado).

### Interface (UI)
- Botão "Conectar CRM" com feedback de status (Conectado/Desconectado).
- Opção para "Sincronização Automática" nas configurações.

## Detalhes técnicos
- Tabela alvo no CRM: `contacts`.
- Campos mapeados: `name`, `phone`, `email`, `website` -> `notes`, `segment` -> `interest`.
- Autenticação: O usuário usará suas credenciais do CRM no modal de conexão.
