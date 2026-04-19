# 🚀 Agendador Autônomo — Marketplace Inteligente de Serviços

## 📌 1. O que é o Projeto?

Uma plataforma SaaS de **matchmaking de serviços com IA**, que conecta **Clientes** (via Chatbot Telegram) a **Prestadores de Serviços Autônomos** (Encanadores, Eletricistas, Pedreiros, etc) através de:

- **Busca Semântica:** A IA classifica o problema do cliente ("pia entupida" → "Encanamento")
- **Normalização de Local:** Corrige tipos e variações ("Osasdo Veloso" → "Osasco, Veloso")
- **Filtro de Disponibilidade:** Consulta calendários reais (Google Calendar) dos prestadores

**Status Atual:** MVP em Fase 2.5 — Backend migrado para Arquitetura Hexagonal (TypeScript) e Core de matchmaking funcional.

---

## 💻 2. Como Rodar o Projeto

### 2.1 Pré-requisitos

- **Node.js** 18+ (com npm/yarn)
- **Docker** (para PostgreSQL)
- **Variáveis de Ambiente:**
  - `.env` na raiz do `/bot`: `TELEGRAM_TOKEN`, `GEMINI_API_KEY`, `GCP_CREDENTIALS_PATH`
  - `.env` na raiz do `/api`: `DATABASE_URL`, `JWT_SECRET`, etc

### 2.2 Instalação Rápida

```bash
# 1. Instalar dependências (monorepo)
npm install

# 2. Subir PostgreSQL
docker-compose up -d

# 3. Rodar migrações Prisma
npx prisma migrate dev

# 4. Popular banco (seed)
npx prisma db seed

# 5. Iniciar API (Backend)
cd api
npm run build
npm run start
# em outro terminal, inicie o Bot
cd bot
npm run dev
```

### 2.3 Testar a Integração

1. Abra Telegram e procure o bot (configurado via `TELEGRAM_TOKEN`)
2. Digite `/start` e siga o fluxo conversacional
3. Exemplo: _"Osasco, Veloso | pia entupida | amanhã 14h"_
4. Sistema retorna encanador disponível

---

## 👥 3. Tipos de Usuários (Atores do Sistema)

### 3.1. Prestador de Serviço (Autônomo)

O profissional acessa o **Portal Web / App** e realiza o seu cadastro.
**Dados coletados no cadastro:**

- **Perfil:** Nome, E-mail, Telefone.
- **Atuação:** Tipo(s) de serviço(s) prestado(s).
- **Localização:** Endereço base e Raio de Atuação (em KM).
- **Regras de Negócio (Agenda):** Dias da semana em que trabalha (ex: Seg a Sex) e Horário de Atendimento (ex: 08:00 às 18:00).
- **Integração Externa:** Conecta o seu **Google Calendar** na plataforma para que o sistema saiba, em tempo real, os "buracos" (horários livres) na agenda dele.

### 3.2. Cliente Final

O cliente NÃO precisa baixar nenhum aplicativo. Ele interage diretamente com o **Bot Inteligente** no Telegram (ou WhatsApp).

- O cliente digita em linguagem natural: _"Preciso de alguém para arrumar o encanamento da minha pia vazando amanhã de manhã na Vila Mariana"_.
- A IA extrai: `Serviço (Encanador)`, `Data/Hora (Amanhã, manhã)` e `Local (Vila Mariana)`.

---

## ⚙️ 4. O "Core" do MVP: Algoritmo de Matchmaking (3 Filtros)

Quando o bot extrai o pedido do cliente, ele precisa buscar na **Base de Dados de Prestadores** a combinação perfeita. Os 3 filtros principais (O Funil) são:

1. **Filtro de Serviço (Busca Semântica):** Encontra todos os prestadores cadastrados cuja especialidade bate com a abstração do cliente (ex: "vazamento" -> "Encanador").
2. **Filtro de Localidade (Geolocalização):** Destes encanadores, filtra apenas aqueles cujo "Raio de Atuação" engloba o bairro/CEP do cliente.
3. **Filtro de Disponibilidade (Google Calendar):**
   - O sistema checa as _Regras de Negócio_ do prestador (Ele trabalha de manhã?).
   - O sistema acessa a API do Google Calendar dos prestadores filtrados e pergunta: _"Quem NÃO tem evento marcado nesse dia e horário?"_.

### O Desfecho:

O Bot devolve ao cliente: _"Encontrei 3 encanadores disponíveis na Vila Mariana para amanhã de manhã. Escolha um: 1 - João Silva, 2 - Marcos Antonio"_.
O cliente escolhe, e o bot automaticamente insere o evento no Google Calendar do **João Silva** com o nome, telefone e endereço do cliente.

---

## 💻 5. Progresso do Desenvolvimento (Arquitetura em Monorepo)

Estrutura atual: `api/` (Backend TypeScript via Arquitetura Hexagonal) + `bot/` (Telegram) + Docker (PostgreSQL)

### ✅ Concluído (Fase 1: Bot e Integrações)

- **Bot Inteligente Modular (Telegram):** Máquina de estados Node.js
- **Conversação Natural via IA:** Cliente digita livremente; Gemini extrai intenção, data, local
- **Agendamento Automático:** Bot integra evento no Google Calendar do prestador encontrado

### ✅ Concluído (Fase 2: Backend, Banco de Dados e Auth)

- **PostgreSQL + Prisma ORM:** Schema relacional de `Usuarios` e perfis segmentados.
- **Arquitetura Hexagonal:** Desacoplamento do domínio via Interfaces, IoC (ControllersFactory) e Injeção de Dependências.
- **Validação Rigorosa:** Middlewares operando contratos Zod para garantir integridade.
- **Segurança:** Bcryptjs + JWT para autenticação com isolamento de metadados de erro (`globalErrorHandler`).

### 🆕 Concluído (Fase 2.5: Matchmaking Inteligente com IA)

- **Classificação de Serviço:** Bot classifica o problema ("pia entupida" → "Encanamento").
- **Backend Clean:** Backend recebe o payload filtrado processando queries unificadas injetadas sobre o Prisma.

### 🔜 Próximos Passos (Fase 3+)

- [ ] **Refatoração do Bot:** Elevar o Bot Telegram legando aos padrões sólidos TypeScript.
- [ ] **Portal Web Prestador:** Frontend e Dashboard para cadastro autônomo.
- [ ] **Integrações Assíncronas:** Free/Busy API do Google Calendar em tempo real.

---

## 📁 6. Estrutura de Pastas e Arquitetura

### `/bot` — Telegram Bot + IA Engine (Legado)

```
bot/
├── index.js                 # Entry point Telegram
├── .env                     # Credenciais
├── src/
│   ├── handlers/            # State machine do Chat
│   └── services/            # Antigos serviços de IA e Calendar
```

### `/api` — Backend Express (Arquitetura Hexagonal TypeScript)

```
api/
├── src/server.ts            # Bootstrapper IoC Express
├── prisma/                  # DB, Schema e Migrations
└── src/
    ├── core/                # Camada de Negócios 
    │   ├── interfaces/      # Contratos de Desacoplamento
    │   └── useCases/        # Inteligência e Orquestração Pura
    ├── controllers/         # Operadores HTTP
    ├── infrastructure/      # Adaptadores de Serviços Externos e DB
    ├── middlewares/         # Bloqueios e Validações (Zod)
    ├── schemas/             # Contratos DTO
    └── factories/           # Controladora Central de Injeções
```

---

## 🛠️ 7. Guia de Manutenção & Extensão

O acesso tático às pastas e regras arquiteturais foi movido para o **Guia Oficial de Engenharia**. Consulte o arquivo nativo na raiz do projeto:

> 📘 Ler a documentação completa em: [`GUIA_ARQUITETURA.md`](./GUIA_ARQUITETURA.md)

---

## 📊 Stack Técnico

| Camada              | Tecnologia                 | Propósito                                      |
| ------------------- | -------------------------- | ---------------------------------------------- |
| **Bot/Conversação** | Telegraf 4.x + Node.js     | Handler de mensagens Telegram                  |
| **Plataforma Core** | TypeScript + Express 5     | API sob o Padrão Porta-Adaptador               |
| **Data Integrity**  | Zod Schemas                | Barreira de entrada DTO contra Payload Corrompido|
| **IA**              | Google Gemini 2.5 Flash    | Classificação semântica + NLP                  |
| **Database**        | PostgreSQL 15 + Prisma ORM | Persistência Relacional via Repository Pattern   |
| **DevOps**          | Docker + docker-compose    | Ambiente replicável local                      |

---

## 📞 Contato & Contribuições

- **Project by:** Gabriel Dias
- **Status:** MVP em desenvolvimento ativo
- **Email:** gabriel.henrique.dias@outlook.com
- **Bugs / Sugestões:** Abra issue no repositório
