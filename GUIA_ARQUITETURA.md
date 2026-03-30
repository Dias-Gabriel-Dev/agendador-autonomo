# 🗺️ Guia de Arquitetura — Agendador Autônomo

**Status Atual:** MVP Fase 2.5 | Última Atualização: Março 2026

---

## 📋 Sumário

1. [Quick Reference](#quick-reference) — O que cada pasta/arquivo faz
2. [Fluxo Completo](#fluxo-completo) — Como os dados fluem pelo sistema
3. [Bloco 1: Bot Telegram](#bloco-1-o-robô-do-telegram) — Interação com cliente
4. [Bloco 2: API Backend](#bloco-2-a-api-backend) — Banco de dados e lógica
5. [Fluxo de Dados Detalhado](#fluxo-de-dados-detalhado) — Passo a passo
6. [Quick Maintenance](#quick-maintenance) — Soluções rápidas
7. [Troubleshooting](#troubleshooting) — Problemas comuns

---

## ⚡ Quick Reference

### Bot (`/bot`)

| Arquivo                    | Responsabilidade             | Funções Principais                                                                                                    |
| -------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **index.js**               | Inicia Telegraf e servidor   | `bot.launch()`, event listeners                                                                                       |
| **conversationHandler.js** | State machine conversacional | `fluxoBoasVindas()`, `fluxoNome()`, `fluxoTelefone()`, `fluxoEndereco()`, `fluxoProblema()`, `fluxoAgendamentoData()` |
| **aiService.js**           | Chamadas ao Gemini           | `extrairDadosDeAgendamento()`, `classificarServico()` ⭐ **NOVO**, `extrairEndereco()`                                |
| **calendarService.js**     | Google Calendar API          | `inserirEventoTeste()`                                                                                                |
| **dateUtils.js**           | Formatação de datas          | `extrairEFormatarData()`, `extrairHorario()`, `calcularHoraFim()`                                                     |

### API (`/api`)

| Arquivo                    | Responsabilidade                 | Funções Principais                            |
| -------------------------- | -------------------------------- | --------------------------------------------- |
| **server.js**              | Express entry point (porta 3000) | Rotas, middlewares, health check              |
| **authController.js**      | Autenticação de usuários         | `register()`, `login()`                       |
| **providersController.js** | Busca e matchmaking              | `searchProviders()`, `matchProviders()`       |
| **schema.prisma**          | Modelo de dados PostgreSQL       | `Usuario`, `PerfilPrestador`, `PerfilCliente` |
| **seed.js**                | Popula banco de teste            | Cria prestadores em Osasco                    |

---

## flow Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Telegram)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │ "Pia entupida em Osasdo Veloso"
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BOT (Node.js/Telegraf)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ conversationHandler.js → handleUserMessage()             │  │
│  │ (State machine: PERGUNTAR_NOME → ... → AGENDAMENTO_DATA)│  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────┐   │
│  │ aiService.js                                             │   │
│  │ • extrairEndereco("Osasdo Veloso")                       │   │
│  │   → {cidade:"Osasco", bairro:"Veloso"} ⭐ NOVO          │   │
│  │ • extrairDadosDeAgendamento(data/hora)                  │   │
│  │   → {dia:"30/03/2026", turno:"manhã"}                   │   │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────┐   │
│  │ API Call 1: GET /api/providers/search                   │   │
│  │ ?cidade=Osasco&bairro=Veloso                            │   │
│  │ Response: [Encanamento, Hidráulica] ⭐ NOVO             │   │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────┐   │
│  │ aiService.js → classificarServico()                     │   │
│  │ ("pia entupida", [Encanamento, Hidráulica])             │   │
│  │ → "Encanamento" ⭐ NOVO FEATURE                         │   │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                                 │
│  ┌──────────────▼──────────────────────────────────────────┐   │
│  │ Monta PAYLOAD limpo:                                    │   │
│  │ { cliente, servicoBuscado: "Encanamento",               │   │
│  │   agendamento }                                         │   │
│  └──────────────┬───────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ POST /api/providers/match
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│              API EXPRESS (providersController.js)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ matchProviders(req, res)                                 │  │
│  │ • extrairEndereco(enderecoBruto) ⭐ NOVO                 │  │
│  │   → {cidade:"Osasco", bairro:"Veloso"}                  │  │
│  │ • Prisma query: WHERE servicosOferecidos HAS            │  │
│  │   "Encanamento" AND (cidade CONTAINS Osasco OR          │  │
│  │   bairro CONTAINS Veloso) ⭐ NOVO FILTRO                │  │
│  │ • Retorna: { profissionalSelecionado, telefone, ... }   │  │
│  └──────────────┬───────────────────────────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       │ JSON Response
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BOT (calendarService.js)                      │
│                                                                   │
│  inserirEventoTeste() → Google Calendar API                     │
│  Cria evento no calendário do prestador encontrado             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤖 Bloco 1: O Robô do Telegram

### Estrutura de Pastas

```
bot/
├── index.js                              # ← ENTRY POINT
├── .env                                  # Credenciais (TELEGRAM_TOKEN, GEMINI_API_KEY)
├── package.json
└── src/
    ├── handlers/
    │   └── conversationHandler.js        # ← STATE MACHINE
    ├── services/
    │   ├── aiService.js                  # ← IA ENGINE (Gemini)
    │   └── calendarService.js            # ← GOOGLE CALENDAR
    └── utils/
        └── dateUtils.js                  # ← FORMATADORES DE DATA
```

### 📄 Arquivo: `bot/index.js`

**O que faz:** Inicia o servidor Telegraf e coloca o bot online  
**Quando mudar:** Nunca (a menos que queira mudar porta/timeout)

```javascript
// Apenas inicializa e ligamessage listeners
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
bot.on("text", handleUserMessage); // Todo texto vai para conversationHandler
bot.launch(); // ← Bot online
```

---

### 📄 Arquivo: `bot/src/handlers/conversationHandler.js`

**O que faz:** **State Machine** — controla em que etapa da conversa o usuário está

**Fluxo de Estados:**

```
/start → PERGUNTAR_NOME → PERGUNTAR_TELEFONE → PERGUNTAR_ENDERECO
  → PERGUNTAR_PROBLEMA → AGENDAMENTO_DATA → [FIM + DELETE SESSION]
```

**Funções (cada uma é uma etapa):**

| Função                               | O que faz                                                        | Próximo Passo        |
| ------------------------------------ | ---------------------------------------------------------------- | -------------------- |
| `fluxoBoasVindas(ctx, usuarioId)`    | Cria nova sessão, pergunta nome                              | `PERGUNTAR_TELEFONE` |
| `fluxoNome(ctx, sessao)`             | Recebe nome, armazena, pergunta telefone                          | `PERGUNTAR_TELEFONE` |
| `fluxoTelefone(ctx, sessao)`         | Recebe telefone, pergunta endereço                               | `PERGUNTAR_ENDERECO` |
| `fluxoEndereco(ctx, sessao)`         | Recebe endereço bruto, pergunta problema                          | `PERGUNTAR_PROBLEMA` |
| `fluxoProblema(ctx, sessao)`         | Recebe problema, pergunta data/hora                              | `AGENDAMENTO_DATA`   |
| `fluxoAgendamentoData()`             | Norma. endereço + classifica serviço + chama API | DELETE SESSION       |

**Dados armazenados em `sessoesAtivas[usuarioId]`:**

```javascript
{
  passoAtual: "AGENDAMENTO_DATA",
  dadosColetados: {
    nome: "João Silva",
    telefone: "(11) 98765-4321",
    endereco: "Osasco, Veloso",     // Texto bruto do usuário
    problema: "pia entupida",         // Texto bruto do usuário
  }
}
```

**⭐ NOVO (Fase 2.5):** A função `fluxoAgendamentoData()` agora faz:

1. Normaliza endereço com IA
2. Busca lista de serviços locais (`GET /search`)
3. Classifica o problema com IA
4. Envia payload limpo à API

---

### 📄 Arquivo: `bot/src/services/aiService.js`

**O que faz:** Formata prompts e chama Google Gemini API

**Funções:**

| Função                                         | Input                             | Output             | Exemplo                             |
| ---------------------------------------------- | --------------------------------- | ------------------ | ----------------------------------- |
| `extrairDadosDeAgendamento(mensagem)`          | "Amanhã às 15h"                   | JSON com dia/turno | `{dia:"31/03", turno:"15h"}`        |
| `classificarServico(texto, lista)`  | "pia entupida", `["Encanamento"]` | Serviço mapeado    | `"Encanamento"`                     |
| `extrairEndereco(texto)`                       | "Osasdo Veloso"                   | JSON cidade/bairro | `{cidade:"Osasco",bairro:"Veloso"}` |

**Detalhes Importantes:**

- Usa `modelo.generateContent()` do Gemini 2.5 Flash
- Sempre remove `json ` markers do response
- Usa `JSON.parse()` para converter string → objeto

---

### 📄 Arquivo: `bot/src/services/calendarService.js`

**O que faz:** Integra com Google Calendar API para inserir eventos

**Funções:**

| Função                 | O que faz                          | Usado em                         |
| ---------------------- | ---------------------------------- | -------------------------------- |
| `inserirEventoTeste()` | Insere evento de teste no calendar | FUTURO: `fluxoAgendamentoData()` |

---

### 📄 Arquivo: `bot/src/utils/dateUtils.js`

**O que faz:** Formata strings de data/hora

**Funções:**

| Função                        | Input            | Output              |
| ----------------------------- | ---------------- | ------------------- |
| `extrairEFormatarData(dia)`   | "30 de março"    | "30/03/2026"        |
| `extrairHorario(turno)`       | "tarde" ou "15h" | "14:00"             |
| `calcularHoraFim(horaInicio)` | "14:00"          | "15:00" (1h depois) |

---

## 🌐 Bloco 2: A API Backend

### Estrutura de Pastas

```
api/
├── server.js                           # ← ENTRY POINT Express
├── .env                                # DATABASE_URL, JWT_SECRET
├── package.json
├── prisma/
│   ├── schema.prisma                   # ← DATABASE MODEL
│   └── seed.js                         # ← POPULA BANCO DE TESTE
└── src/
    ├── controllers/
    │   ├── authController.js           # ← AUTH
    │   └── providersController.js      # ← MATCHMAKING 
    └── routes/
        ├── authRoutes.js
        └── providersRoutes.js
```

---

### 📄 Arquivo: `api/server.js`

**O que faz:** Inicia Express, conecta rotas, health check

```javascript
const app = express();
app.use(cors());
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "OK" }));

// Rotas
app.use("/api/auth", authRoutes);
app.use("/api/providers", providerRoutes);

app.listen(3000); // ← Porta 3000
```

---

### 📄 Arquivo: `api/src/controllers/authController.js`

**O que faz:** Registro e login de usuários (Prestadores/Clientes)

**Funções:**

| Função               | Input                  | Output    | Usa              |
| -------------------- | ---------------------- | --------- | ---------------- |
| `register(req, res)` | `{email, senha, tipo}` | JWT token | Bcryptjs, Prisma |
| `login(req, res)`    | `{email, senha}`       | JWT token | Bcryptjs, Prisma |

---

### 📄 Arquivo: `api/src/controllers/providersController.js`

**O que faz:** Busca prestadores e faz matchmaking com cliente

**Funções:**

| Função                                 | Input                                    | Output                        |  Mudança                                         |
| -------------------------------------- | ---------------------------------------- | ----------------------------- | -------------------------------------------------- |
| `searchProviders(req, res)`            | `?cidade=X&bairro=Y`                     | Lista de serviços disponíveis | Sem mudança                                        |
| `matchProviders(req, res)`  | `{cliente, servicoBuscado, agendamento}` | Prestador encontrado          | Normaliza endereço com IA, filtra com dados limpos |

**Detalhes de `matchProviders()`:**

```javascript
async function matchProviders(req, res) {
  const { cliente, servicoBuscado, agendamento } = req.body;

  // ⭐ NOVO: Normaliza endereço com IA
  const respostaEndereco = await extrairEndereco(cliente.enderecoBruto);
  const enderecoParsed = JSON.parse(respostaEndereco);
  const { cidade, bairro } = enderecoParsed;

  // ⭐ NOVO: Filtra dinâmicos baseado em dados normalizados
  const filtrosLocacao = [];
  if (cidade)
    filtrosLocacao.push({ cidade: { contains: cidade, mode: "insensitive" } });
  if (bairro)
    filtrosLocacao.push({ bairro: { contains: bairro, mode: "insensitive" } });

  // ⭐ NOVO: Query com filtros aprimorados
  const profissionaisEncontrados = await prisma.perfilPrestador.findMany({
    where: {
      servicosOferecidos: { has: servicoBuscado },
      ...(filtrosLocacao.length > 0 && { OR: filtrosLocacao }),
    },
  });

  // Retorna primeiro match
  return res.json({
    profissionalSelecionado: profissionaisEncontrados[0].nomeFantasia,
  });
}
```

---

### 📄 Arquivo: `api/prisma/schema.prisma`

**O que faz:** Define structure do banco PostgreSQL

**Tabelas:**

```prisma
model Usuario {
  id              String      @id @default(uuid())
  email           String      @unique
  senha           String                  // Criptografada com Bcrypt
  tipo            TipoUsuario @default(CLIENTE)
  perfilCliente   PerfilCliente?          // Relação 1-para-1
  perfilPrestador PerfilPrestador?        // Relação 1-para-1
}

model PerfilPrestador {
  id                  String   @id @default(uuid())
  nomeFantasia        String
  telefoneContato     String
  servicosOferecidos  String[] // Array de strings (ex: "Encanamento", "Hidráulica")
  cidade              String
  bairro              String
  googleCalendarId    String?
  usuarioId           String   @unique
  usuario             Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
}

model PerfilCliente {
  id          String   @id @default(uuid())
  nome        String
  telefone    String?
  cidade      String?
  bairro      String?
  usuarioId   String   @unique
  usuario     Usuario  @relation(fields: [usuarioId], references: [id], onDelete: Cascade)
}
```

---

### 📄 Arquivo: `api/prisma/seed.js`

**O que faz:** Popula banco com prestadores de teste

**Usado para:** Testes rápidos sem precisar criar prestadores manualmente via API

```bash
npx prisma db seed  # ← Executa seed.js
```

---

## 🔄 Fluxo de Dados Detalhado

### Cenário: Cliente quer encanador em Osasco

```
1️⃣ TELEGRAM (Cliente)
   Cliente digita: "Pia entupida em Osasdo, Veloso"

2️⃣ BOT (conversationHandler.js)
   fluxoAgendamentoData() é chamado
   sessao.dadosColetados = {problema: "pia entupida", endereco: "Osasdo, Veloso"}

3️⃣ IA (aiService.js)
   3a. extrairEndereco("Osasdo, Veloso")
       → Gemini normaliza → {cidade: "Osasco", bairro: "Veloso"} 

4️⃣ BOT chama SearchProviders (axios.get)
   GET http://localhost:3000/api/providers/search?cidade=Osasco&bairro=Veloso
   → API busca todos prestadores em Osasco/Veloso
   → Retorna lista de serviços: ["Encanamento", "Hidráulica"]

5️⃣ IA Classifica Serviço (aiService.js)
   classificarServico("pia entupida", ["Encanamento", "Hidráulica"])
   → Gemini extrai "Encanamento" 

6️⃣ BOT Monta Payload Limpo
   payloadParaAPI = {
     cliente: {...},
     servicoBuscado: "Encanamento",  ← Agora é valor REAL, não texto bruto
     agendamento: {...}
   }

7️⃣ BOT Chama Match (axios.post)
   POST http://localhost:3000/api/providers/match
   Body: payloadParaAPI

8️⃣ API (providersController.js)
   matchProviders() recebe payload
   8a. normaliza endereço novamente (backup) 
   8b. busca Prisma WHERE:
       - servicosOferecidos HAS "Encanamento"
       - (cidade CONTAINS "Osasco" OR bairro CONTAINS "Veloso")
   8c. Encontra: João Encanador (Osasco, Veloso) ✅

9️⃣ Retorna
   {
     profissionalSelecionado: "João Encanador",
     emailCalendario: "joao@gmail.com",
     telefone: "(11) 98765-4321"
   }

🔟 BOT mostra ao Cliente
    "Achei João Encanador para você! Agendado para 30/03 às 14h"
```

---

## 🛠️ Quick Maintenance

### 🎯 Preciso adicionar uma nova pergunta no bot

**Arquivo:** `bot/src/handlers/conversationHandler.js`

Steps:

1. Crie função: `async function fluxoMinhaPergunta(ctx, sessao) { ... }`
2. Adicione ao switch em `handleUserMessage()`:
   ```javascript
   case "MINHA_PERGUNTA":
     return fluxoMinhaPergunta(ctx, sessao);
   ```
3. Atualize a etapa anterior para `sessao.passoAtual = "MINHA_PERGUNTA"`

---

### 🎯 Preciso mudar um campo do Prestador no banco

**Arquivo:** `api/prisma/schema.prisma`

Steps:

1. Edit o modelo `PerfilPrestador`
2. Rode:
   ```bash
   npx prisma migrate dev --name descricao_mudanca
   ```
3. Atualize `seed.js` se precisa alimentar novos campos

---

### 🎯 A IA está classificando mal o serviço

**Arquivo:** `bot/src/services/aiService.js`

Steps:

1. Ache a função `classificarServico()`
2. Melhor o prompt (instruções ao Gemini):
   ```javascript
   const instrucao = `
   Você é um sistema de busca semântica MUITO rigoroso.
   Mapa "pia entupida" → "Encanamento"
   Mapa "fiação ruim" → "Eletricista"
   ...
   `;
   ```

---

### 🎯 Preciso adicionar novo filtro de match

**Arquivo:** `api/src/controllers/providersController.js`

Função: `matchProviders()`

Steps:

1. Após normalizar endereço, adicione filtro:
   ```javascript
   // Filtro de raio de atuação (FUTURO)
   if (cliente.latLng) {
     // Calcular distância
   }
   ```
2. Adicione à query Prisma antes do `findMany()`

---

## ⚠️ Troubleshooting

### Bot não responde

**Checklist:**

- [ ] `TELEGRAM_TOKEN` configurado em `.env` do bot?
- [ ] Bot server rodando? (`node bot/index.js`)
- [ ] API também rodando? (`npm run dev:api`)
- [ ] PostgreSQL rodando? (`docker-compose ps`)

**Logs:**

```bash
# Terminal bot
node index.js
# Deve mostrar: "Bot rodando! Vá para Telegram e mande /start"
```

---

### Sistema não encontra prestador

**Checklist:**

- [ ] Prestador está no banco? (`npx prisma studio` → check PerfilPrestador)
- [ ] Serviço está em `servicosOferecidos` array?
- [ ] Cidade/bairro está correto?
- [ ] Endereço do cliente foi normalizado? (Check logs da IA)

**Debug:**

```bash
# Teste a busca manualmente
curl "http://localhost:3000/api/providers/search?cidade=Osasco&bairro=Veloso"
# Deve retornar lista de serviços
```

---

### Erro ao inserir evento no Google Calendar

**Possíveis causas:**

- Google Calendar API não tem permissão
- `googleCalendarId` do prestador está vazio ou inválido
- Token expirou

**Solução:**

- Verificar credenciais GCP em `bot/credenciais-gcp.json`
- Testar manualmente: `await inserirEventoTeste()`

---

## 📊 Resumo Técnico

| Aspecto             | Status          | Detalhes                                 |
| ------------------- | --------------- | ---------------------------------------- |
| **Bot Telegram**    | ✅ MVP          | Estado machine em conversationHandler.js |
| **Normalização IA** | ✅ Fase 2.5     | extrairEndereco() + classificarServico() |
| **Busca Dinâmica**  | ✅ MVP          | searchProviders() com Prisma             |
| **Matchmaking**     | ✅ Fase 2.5     | matchProviders() com filtros aprimorados |
| **Google Calendar** | 🔄 Em Progresso | Inserção funciona, Free/Busy REST        |
| **Portal Web**      | 🔜 Próximo      | React/Vue com OAuth2                     |
| **Geolocalização**  | 🔜 Próximo      | Google Maps API com raio de KM           |

---

## 📞 Referências Rápidas

**Rotas Principais:**

- `GET /api/providers/search` — Busca serviços por cidade/bairro
- `POST /api/providers/match` — Encontra prestador ideal
- `POST /api/auth/register` — Cria novo usuário
- `POST /api/auth/login` — Login com JWT

**Variáveis Críticas:**

- `process.env.TELEGRAM_TOKEN` — Credencial do bot
- `process.env.GEMINI_API_KEY` — Credencial da IA
- `process.env.DATABASE_URL` — Conexão PostgreSQL

**Comandos Úteis:**

```bash
npx prisma studio  # Visualizar/editar banco graficamente
npx prisma db seed # Popular banco com dados de teste
npm run dev:api    # Inicia API (com hot-reload)
npm run dev:bot    # Inicia Bot (direto)
docker-compose up -d # PostgreSQL 🆙
```
