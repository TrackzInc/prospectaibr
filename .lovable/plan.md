# Exportação para CRM Externo

O usuário deseja exportar os leads capturados para seu próprio CRM via Supabase/Git. 

## Mudanças propostas

### Frontend (Busca e Histórico)
- Adicionar um botão "Exportar para CRM" nas abas de **Busca** e **Histórico**.
- Integrar com a tabela `contacts` (que já funciona como um CRM interno) e garantir que a exportação possa ser facilmente estendida para webhooks ou integrações diretas.
- Adicionar uma configuração em "Sistema" (Configurações) para definir o destino da exportação (atualmente focaremos em preparar a estrutura para que o usuário vincule seu CRM).

### Banco de Dados
- Utilizar a tabela `contacts` existente como ponte.
- O usuário mencionou "vincular via git e supabase", o que sugere que ele quer acessar os dados diretamente do banco de dados dele.

## Detalhes técnicos
- Implementar a função `sendToExternalCRM` em `src/routes/index.tsx`.
- Adicionar interface visual consistente com o app (neon green/zinc).
