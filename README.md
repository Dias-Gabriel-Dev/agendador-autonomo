# 🚀 Agendador Autônomo — Marketplace Inteligente de Serviços

## 📌 1. O que é o Projeto?

Uma plataforma SaaS de **matchmaking de serviços com IA**, que conecta **Clientes** (via Chatbot Telegram) a **Prestadores de Serviços Autônomos** (Encanadores, Eletricistas, Pedreiros, etc) através de:

- **Busca Semântica:** A IA classifica o problema do cliente ("pia entupida" → "Encanamento")
- **Normalização de Local:** Corrige tipos e variações ("Osasdo Veloso" → "Osasco, Veloso")
- **Filtro de Disponibilidade:** Consulta calendários reais (Google Calendar) dos prestadores

**Status Atual:** MVP em Fase 2.5 — Core de matchmaking funcional + melhorias recentes de IA

---

## � 2. Como Rodar o Projeto

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

# 5. Iniciar API (porta 3000) + Bot (Telegram)
npm start
# ou em paralelo:
npm run dev:api &  # em um terminal
npm run dev:bot    # em outro terminal
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

Struct atual: `api/` (Backend) + `bot/` (Telegram) + Docker (PostgreSQL)

### ✅ Concluído (Fase 1: Bot e Integrações)

- **Bot Inteligente Modular (Telegram):** Máquina de estados (`conversationHandler`) em Node.js/ESM
- **Conversação Natural via IA:** Cliente digita livremente; Gemini extrai intenção, data, local
- **Agendamento Automático:** Bot integra evento no Google Calendar do prestador encontrado

### ✅ Concluído (Fase 2: Backend, Banco de Dados e Auth)

- **PostgreSQL + Prisma ORM:** Schema relacional com `Usuario` → `PerfilPrestador` / `PerfilCliente`
- **API RESTful Express.js:** Rotas `/api/auth/register`, `/api/providers/search`, `/api/providers/match`
- **Segurança:** Bcryptjs + JWT para autenticação
- **Seed Script:** Popula banco com prestadores de teste (Osasco-SP)

### 🆕 Concluído (Fase 2.5: Matchmaking Inteligente com IA — RECENTEMENTE ADICIONADO)

- **Classificação de Serviço (Busca Semântica):** Bot agora chama `classificarServico(problema, listaDeServiços)` para mapear "pia entupida" → "Encanamento" corretamente
- **Normalização de Endereço:** Função `extrairEndereco()` converte "Osasdo Veloso" → `{ cidade: "Osasco", bairro: "Veloso" }`
- **Payload Melhorado:** Bot busca lista de serviços locais ANTES de classificar, garantindo precisão
- **Query de Match Aprimorada:** Backend normaliza endereço com IA + filtra com dados limpos, reduzindo falsos negativos

**Como Funciona Agora:**

```
Cliente: "pia entupida em Osasdo Veloso"
    ↓ (IA normaliza endereço)
Bot: Procura por serviços em "Osasco, Veloso" → ["Encanamento", "Hidráulica"]
    ↓ (IA classifica problema)
Bot: Classifica "pia entupida" → "Encanamento"
    ↓ (Payload limpo enviado)
API: Busca por "Encanamento" + "Osasco" + "Veloso" = ✅ Match encontrado!
```

### 🔜 Próximos Passos (Fase 3+)

- [ ] **Portal Web Prestador:** React/Vue login com JWT, editar perfil, conectar Google Calendar (OAuth2)
- [ ] **Geolocalização Real:** Substituir busca por strings → API Google Maps com cálculo de raio (km)
- [ ] **Free/Busy API:** Consultar Google Calendar **antes** de retornar prestadores (agenda em tempo real)
- [ ] **Menu de Múltiplas Escolhas:** Se encontrar vários, oferecer lista numerada ao cliente
- [ ] **WhatsApp Integration:** Evoluir de Telegram para WhatsApp Business API

---

## 📁 6. Estrutura de Pastas e Arquitetura

### `/bot` — Telegram Bot + IA Engine

```
bot/
├── index.js                 # Entry point (inicia Telegraf)
├── .env                     # Credenciais: TELEGRAM_TOKEN, GEMINI_API_KEY
├── src/
│   ├── handlers/
│   │   └── conversationHandler.js   # State machine (Nome → Telefone → Endereço → Problema → Data)
│   │                                # Classifica serviço + normaliza endereço antes do match
│   ├── services/
│   │   ├── aiService.js             # Chamadas ao Gemini (extrair data, classificar serviço, normalizar endereço)
│   │   └── calendarService.js       # Integração Google Calendar API
│   └── utils/
│       └── dateUtils.js             # Formatação de datas/horas
```

### `/api` — Backend Express + Banco de Dados

```
api/
├── server.js                # Express entry point (porta 3000)
├── .env                     # DATABASE_URL, JWT_SECRET
├── prisma/
│   ├── schema.prisma        # Schema: Usuario, PerfilPrestador, PerfilCliente
│   └── seed.js              # Script para popular prestadores de teste
└── src/
    ├── controllers/
    │   ├── authController.js         # Register + Login (JWT)
    │   └── providersController.js    # Busca dinâmica + Matchmaking
    │                                 # Normaliza endereço + filtra com IAs em tempo real
    └── routes/
        ├── authRoutes.js
        └── providersRoutes.js
```

### `/mcp-servers` — Model Context Protocol (futuro)

Estrutura para extensão via agentes AI.

---

## 🛠️ 7. Guia de Manutenção & Extensão

### Adicionar Nova Etapa na Conversa?

Edite `bot/src/handlers/conversationHandler.js`:

- Crie nova função `fluxoNovaEtapa()`
- Adicione case no switch (`PERGUNTAR_NOVAETAPA`)

### Mudar Campos do Prestador?

Edite `api/prisma/schema.prisma`:

```bash
npx prisma migrate dev --name descricao_mudanca
```

### Melhorar Classificação de IA?

Edite o prompt em `bot/src/services/aiService.js` função `classificarServico()`.

### Adicionar Novo Filtro de Match?

Edite `api/src/controllers/providersController.js` função `matchProviders()` — adicione filtro antes da query.

---

## 📊 Stack Técnico

| Camada              | Tecnologia                 | Propósito                                      |
| ------------------- | -------------------------- | ---------------------------------------------- |
| **Bot/Conversação** | Telegraf 4.x + Node.js ESM | Handler de mensagens Telegram                  |
| **IA**              | Google Gemini 2.5 Flash    | Classificação semântica + NLP                  |
| **Backend**         | Express.js 5.x             | API REST + Matchmaking                         |
| **Database**        | PostgreSQL 15 + Prisma ORM | Persistência de usuários/prestadores           |
| **Auth**            | JWT + Bcryptjs             | Segurança                                      |
| **Integração**      | Google Calendar API        | Agenda de prestadores (read-only por enquanto) |
| **DevOps**          | Docker + docker-compose    | PostgreSQL containerizado                      |

---

## 📞 Contato & Contribuições

- **Project by:** Gabriel Dias
- **Status:** MVP em desenvolvimento ativo
- **Email:** gabriel.henrique.dias@outlook.com
- **Bugs / Sugestões:** Abra issue no repositório
