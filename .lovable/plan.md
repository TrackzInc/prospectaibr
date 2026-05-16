# Plano: Sincronização de Leads do Histórico com o CRM

O usuário deseja enviar os clientes listados na página de Histórico para o CRM externo. Atualmente, a sincronização com o CRM externo ocorre automaticamente apenas durante novas buscas, e os botões de "Vincular" no histórico sincronizam apenas com o banco de dados local.

## Alterações Propostas

### 1. Refatoração da Função de Sincronização
- Ajustar a função `syncToExternalCRM` em `src/routes/index.tsx` para aceitar um parâmetro opcional de `segment` (nicho/interesse), garantindo que ao sincronizar do histórico, o nicho correto seja enviado ao CRM.

### 2. Atualização da Aba de Busca (Search)
- O botão "VINCULAR AO MEU CRM" na aba de busca hoje sincroniza apenas com a tabela `contacts` local. Vou atualizar para que ele também chame `syncToExternalCRM` para todos os leads filtrados, garantindo que o CRM externo também receba os dados.

### 3. Melhorias na Aba de Histórico (History)
- **Sincronização Individual**: Atualizar o botão "VINCULAR CRM" de cada lead no histórico para também enviar ao CRM externo.
- **Sincronização em Lote**: Adicionar um novo botão "VINCULAR TODOS AO MEU CRM" nos detalhes de uma busca histórica. Isso permitirá enviar todos os leads daquela pesquisa específica para o CRM local e externo de uma só vez.

## Detalhes Técnicos

### Arquivos afetados:
- `src/routes/index.tsx`

### Lógica de Sincronização:
- Ao clicar em "Vincular Todos" no Histórico:
    1. Iterar sobre `historyLeads`.
    2. Fazer o upsert na tabela `contacts` (CRM local).
    3. Chamar `syncToExternalCRM(historyLeads, selectedHistory.segment)`.

### UI:
- Adicionar o botão de sincronização em lote próximo ao cabeçalho dos detalhes do histórico para facilitar o acesso.
