# Plano: Busca em Múltiplas Cidades Simultaneamente

Este plano descreve as alterações necessárias para permitir a busca de leads em até 10 cidades simultaneamente na página de busca, consolidando os resultados e melhorando a interface do usuário.

## Alterações na Interface (Página de Busca)

1.  **Campo de Cidades**:
    - Substituir o input `Cidade/Estado` por um componente de entrada de tags.
    - O usuário digita o nome da cidade e pressiona `Enter` para adicionar uma tag.
    - Limite máximo de 10 cidades.
    - Exibir contador: `X/10 cidades selecionadas`.
2.  **Cidades Frequentes**:
    - Adicionar um botão "Cidades frequentes" ao lado do campo de cidades.
    - Dropdown com sugestões: São Paulo, Rio de Janeiro, Recife, Fortaleza, Salvador, Belo Horizonte, Curitiba, Manaus, Belém, Goiânia.
    - Ao selecionar, a cidade é adicionada à lista de tags (respeitando o limite).
3.  **Progresso da Busca**:
    - Exibir uma mensagem de status durante a busca: `Buscando X/Y cidades...`.

## Alterações na Lógica de Busca

1.  **Processamento Paralelo**:
    - Utilizar `Promise.all` para disparar as requisições de busca para cada cidade selecionada simultaneamente.
    - As chamadas serão feitas para a Edge Function `google-places-proxy`.
2.  **Consolidação e Deduplicação**:
    - Reunir todos os resultados em um único array.
    - Remover duplicatas baseando-se no número de telefone (`phone`).
    - Adicionar a propriedade `city` a cada objeto de empresa para identificar sua origem.
3.  **Persistência**:
    - Atualizar as funções de salvamento automático e manual para considerar a cidade específica de cada lead ao inserir na coluna `city_state` da tabela `companies`.

## Alterações na Tabela de Resultados

1.  **Nova Coluna**:
    - Adicionar a coluna `Cidade` na tabela de resultados para facilitar a identificação visual.
2.  **Métricas**:
    - Atualizar os cards de métricas (Total, Com telefone, etc.) após a conclusão de todas as buscas.
    - Exibir quantos leads foram encontrados em cada cidade no resumo de resultados.

## Detalhes Técnicos

- **Arquivo**: `src/routes/index.tsx`
- **Estado**: Adicionar `locations: string[]` e `searchProgress: { current: number, total: number }`.
- **Componentes**: Criar um componente interno de `TagInput` ou usar um padrão similar ao que já existe no projeto.
- **API**: Nenhuma alteração necessária na Edge Function, apenas na forma como ela é chamada.
