# Plano de Identificação de Leads no Funil

Identificar visualmente na tabela de busca quais leads já foram adicionados ao funil (tabela `contacts` do CRM), permitindo filtrar esses leads e visualizar estatísticas de prospecção.

## Alterações Propostas

### Lógica de Identificação
- Ao carregar os resultados da busca (ou do histórico), verificar quais telefones já existem na tabela `contacts`.
- Adicionar uma propriedade `isAlreadyInFunnel` ao tipo `Company`.
- Criar um estado ou função que cruza os leads da busca com os contatos existentes no Supabase.

### Interface da Tabela
- Adicionar uma Badge "Já no funil" (cor `zinc-500`) na coluna de status ou nome para leads identificados.
- Desabilitar o botão "Funil" (enviar ao pipeline) para esses leads.
- Atualizar o tooltip ou title do botão para explicar que o lead já está prospectado.

### Filtros e Cabeçalho
- Adicionar um Toggle nos filtros: "Ocultar leads já no funil".
- No topo da tabela de resultados, adicionar um contador: "X novos | Y já prospectados".

### Detalhes Técnicos
- **Consulta**: Utilizar o `supabase.from('contacts').select('phone')` para obter a lista de telefones já cadastrados e fazer a comparação em memória (considerando que a lista de busca é pequena, até 10 cidades).
- **Remoção de duplicatas**: Garantir que a lógica de "Remover duplicatas pelo telefone" (já existente) continue funcionando corretamente.
- **Estilo**: Manter o padrão de cores `zinc` e `primary` (#aaff00) do projeto.

## Arquivos Afetados
- `src/routes/index.tsx`: Principal arquivo da página de Busca/Dashboard onde a lógica de busca e a tabela residem.
