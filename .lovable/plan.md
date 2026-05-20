# Plano: Adicionar Página de Territórios

Adicionar uma nova página "Territórios" para permitir a seleção estratégica de cidades brasileiras com base em dados demográficos do IBGE, integrando-a ao fluxo de busca de leads.

## Alterações de Interface

### 1. Menu Lateral (`src/components/ui/modern-side-bar.tsx`)
- Adicionar o item "Territórios" entre "Busca" e "Funil".
- Usar o ícone `Globe` do lucide-react.
- Link para `/territorios`.

### 2. Nova Página de Territórios (`src/routes/territorios.tsx`)
- **Filtros no Topo**:
  - Dropdown de Região (Todas, Norte, Nordeste, etc.).
  - Dropdown de Estado (filtrado pela região).
  - Slider de População com faixas predefinidas (<50k até >1M).
  - Campo de busca por nome.
- **Cards de Resumo**:
  - Total de municípios (5.570).
  - Contadores dinâmicos para cidades >100k, >500k e >1M (baseados no filtro atual ou total).
- **Sugestões Rápidas**:
  - Botões para seleções comuns (Capitais, Nordeste >100k, etc.).
- **Tabela de Cidades**:
  - Colunas: Nome, UF, População (Censo 2022), Região, Seleção.
  - Ordenação padrão por população decrescente.
  - Checkbox para seleção individual e "Selecionar todos da página".
  - Limite de 10 cidades selecionadas.
- **Ação**:
  - Botão flutuante ou fixo "USAR NA BUSCA" (Verde Neon) que redireciona para a página inicial com as cidades selecionadas como parâmetros.

### 3. Integração com a Busca (`src/routes/index.tsx`)
- Modificar a página inicial para detectar o parâmetro `locations` na URL.
- Se presente, preencher automaticamente o estado de cidades da busca.

## Detalhes Técnicos

### Fontes de Dados (API IBGE)
- Municípios: `https://servicodados.ibge.gov.br/api/v1/localidades/municipios`
- População: `https://servicodados.ibge.gov.br/api/v3/agregados/4709/periodos/2022/variaveis/93?localidades=N6`
- Os dados serão carregados via `react-query` para cache e performance.

### Lógica de Seleção
- Armazenar cidades selecionadas em um estado local.
- Ao clicar em "USAR NA BUSCA", navegar usando `navigate({ to: '/', search: { locations: ['Cidade1, UF', 'Cidade2, UF'] } })`.

### Estilização
- Manter o tema Dark Zinc/Slate com acentos em Verde Neon (`#aaff00`).
- Usar componentes do Shadcn UI (Table, Slider, Select, Card, Button).

## Considerações de Performance
- Os dados do IBGE serão processados e cruzados em memória (aprox. 5.600 itens).
- Implementar paginação na tabela para evitar lentidão no DOM.
