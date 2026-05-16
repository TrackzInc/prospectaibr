# Plano de Integração e Sincronização com CRM Externo

O objetivo é aprimorar a integração com o projeto CRM externo, garantindo que a sincronização de leads (garimpados e enviados ao funil) ocorra corretamente e que o status da conexão seja visível no Dashboard.

## Mudanças propostas

### 1. Dashboard (Dashboard/Busca)
- **Arquivo**: `src/routes/index.tsx`
- **Ação**: Adicionar um botão de status "CRM" no cabeçalho. Se desconectado, mostrar "Conectar CRM". Se conectado, mostrar "CRM Conectado" com o e-mail do usuário.
- **Sincronização Automática**: Garantir que `saveResultsToDatabaseAuto` e `sendToPipeline` utilizem o `crmSupabase` para enviar leads ao CRM externo quando a conexão estiver ativa.

### 2. Funil de Vendas (Kanban)
- **Arquivo**: `src/routes/funil.tsx`
- **Ação**: Refatorar a função `syncWithCRM` para utilizar o cliente `crmSupabase`.
- **Mapeamento de Status**: Sincronizar o `pipeline_stage` do ProspectAI com o campo `stage` na tabela `contacts` do CRM externo.
- **Identificação**: Garantir que `is_lead: true` seja enviado para todos os contatos sincronizados.

### 3. Configurações e Testes
- **Arquivo**: `src/routes/configuracoes.tsx`
- **Ação**: Adicionar um botão "Testar Sincronização" que envia um lead de teste para o CRM externo para validar a conexão.

### 4. Cliente de Integração
- **Arquivo**: `src/integrations/crm/client.ts`
- **Ação**: Garantir que o helper `isCRMConnected` e o cliente estejam exportando as funções necessárias para o Dashboard.

## Detalhes Técnicos de Mapeamento
- **Origem**: ProspectAI
- **Tabela CRM**: `contacts`
- **Campos**:
  - `name` -> `name`
  - `phone` -> `phone`
  - `segment` -> `interest` / `tags`
  - `is_lead` -> `true`
  - `pipeline_stage` -> `stage` (Mapear "Novo Lead" para "novo_lead", etc.)

