# Orion Dashboard

**Orion** é um webapp de marketing alimentado por inteligência artificial, projetado para centralizar diagnóstico, estratégia, execução de campanhas e criação de criativos em uma única plataforma.

## Visão geral

- Diagnóstico de marketing com base em dados
- Planejamento estratégico e definição de objetivos
- Criação de campanhas e roteiros de conteúdo
- Geração de indicações de criativos para mídias digitais
- Integração com Supabase para gestão de autenticação e dados

## Recursos principais

- Painel de métricas e decisões
- Abordagem orientada por dados para campanhas
- Interface de usuário responsiva para times de marketing
- Sistema de onboarding para diagnóstico e posicionamento
- Estrutura preparada para IA e automação de workflows

## Como rodar localmente

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

4. Abra o navegador em `http://localhost:5173`

## Scripts úteis

- `npm run dev` - inicia o servidor de desenvolvimento
- `npm run build` - gera o build de produção
- `npm run preview` - serve o build gerado localmente
- `npm run lint` - executa o ESLint
- `npm run test` - executa os testes com Vitest

## Configuração de ambiente

Este projeto usa variáveis de ambiente para se conectar ao Supabase. Mantenha o arquivo `.env` fora do controle de versão e use `.env.example` como referência.

Exemplo de variáveis:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=pk_xxxxx
VITE_SUPABASE_PROJECT_ID=xxxx
```

## Melhorias recomendadas

- Não versionar `.env`
- Usar um único gerenciador de pacotes consistente (npm ou bun)
- Documentar fluxos de onboarding e rotas internas
- Adicionar testes de integração para rotas críticas
- Refinar os meta dados da aplicação para SEO e compartilhamento

## Tecnologias

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- React Router
- React Query
