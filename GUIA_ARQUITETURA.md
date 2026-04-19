# Guia de Arquitetura — Agendador Autônomo

**Status Atual:** Arquitetura Hexagonal (TypeScript API) & Legado Node.js (Telegraf Bot)  
**Última Atualização:** Abril de 2026

---

## 1. Visão Geral do Sistema

O **Agendador Autônomo** é um ecossistema dividido em dois módulos principais operando em conjunto:
1. **Módulo de Interface (Bot Frontend)**: Um serviço interativo no Telegram responsável por engajar o usuário final, extrair contexto por meio de linguagem natural e compilar a intenção do cliente de forma estruturada.
2. **Módulo de Negócio (API Backend)**: O motor lógico principal, construído com Node.js, Express e TypeScript, regido pelos princípios da **Arquitetura Hexagonal (Ports and Adapters)**. Assegura validações rígidas de entrada, injeção sistemática de dependências e total isolamento das regras de negócio do banco de dados persistente.

---

## 2. Padrões Arquiteturais da API (Backend)

O serviço de API aboliu acoplamentos diretos à camada HTTP e à camada de persistência (`@prisma/client`), separando suas responsabilidades nas seguintes camadas:

### 2.1. Camada de Apresentação (Interface Adapters)
- **Routes & Middlewares**: Responsáveis por expor endpoints HTTP. O middleware `validateResource` intercepta cada roteamento e valida o conteúdo (Body, Params, Query) contra um contrato rígido de formato, bloqueando anomalias precocemente com formato de Status HTTP 400.
- **Controllers**: Os controladores (`AuthController`, `ProvidersController`) não executam lógica de negócios. O papel primário deles é recepcionar as requisições verificadas, acionar os Casos de Uso adequados e mapear o resultado para formato de saída JSON e código de status correspondente.

### 2.2. Camada de Domínio (Core Use Cases)
- O núcleo da aplicação (`src/core/useCases`) que orquestra as regras da empresa. Os Casos de Uso (ex. `MatchProviderUseCase`) não conhecem ou enxergam a biblioteca Prisma e também ignoram bibliotecas de requisição, operando exlusivamente através das Interfaces (`IProviderRepository`, `IAIService`).

### 2.3. Camada de Infraestrutura (Infrastructure)
- **Repositórios e Adaptadores**: Traduzem a linguagem do domínio paras os serviços externos (Prisma ORM, Google Gemini API, Google Calendar API). 

### 2.4. Ingestão de Dependência Centralizada
- A classe global `ControllersFactory` age como provedor primário. Ela instancia os repositórios reais e os injeta nos controladores durante a inicialização do Servidor, viabilizando arquiteturalmente a separação absoluta dos conceitos por via do método de injeção de dependência via construtor.

---

## 3. Estrutura de Diretórios e Componentes (Referência Rápida)

### API Core (`/api/src`)
| Diretório/Arquivo | Responsabilidade Principal |
| ----------------- | -------------------------- |
| `server.ts` | Ponto principal de execução do aplicativo. Congrega o Express, gerencia rotas e vincula o middleware interceptador global de erros. |
| `factories/ControllersFactory.ts` | Contêiner IoC (*Inversion of Control*). Inicializa e fornece acoplagem de dependências para o Express. |
| `schemas/*.ts` | Definições em **Zod** garantindo contratos DTO rígidos para as rotas e tipagem validada via inferência estrita ao TypeScript. |
| `routes/*.ts` | Exposição semântica de mapeamentos HTTP (`GET`, `POST`) encapsulando os identificadores base. |
| `middlewares/errorHandler.ts` | Gerenciamento centralizado de exceções (`try/catch`), prevenindo vazamento perigoso de metadados internos de falhas arquiteturais ou de banco de dados (`Status 500`). |
| `controllers/*.ts` | Receptores HTTP que acionam a execução de classes instanciadas do diretório Use Cases. |
| `core/useCases/*.ts` | Arquivos detentores únicos da inteligência do módulo, com métodos definindo passos determinísticos padronizados por interfaces. |
| `core/interfaces/*.ts` | Contratos estritos para injeção limpa de Repositórios e Serviços Secundários. |
| `infrastructure/database/*` | Operações relativas ao armazenamento em PostgreSQL implementando contratos oficiais por meio do cliente Prisma. |
| `infrastructure/external/*` | Adaptadores conversando com sistemas isolados externos como a API Gemini (`GeminiAIAdapter`) e o Google Calendar Services (`GoogleCalendarAdapter`). |

### Bot (`/bot`) - (Fase Pré-Refatoração)
| Diretório/Arquivo | Responsabilidade Principal |
| ----------------- | -------------------------- |
| `index.js` | Inicialização da ferramenta local Telegraf orientada à API do Telegram. |
| `src/handlers/conversationHandler.js` | Estado transacional segmentando o progresso textual interativo percorrido pelos clientes. |
| `src/services/aiService.js` | Procedimentos em linguagem legada vinculados superficialmente ao Google Gemini. |
| `src/services/calendarService.js` | Transmissão obsoleta de agendamentos fictícios à Google Calendar API. |

---

## 4. Fluxo Lógico e Processamento de Dados (Data Flow)

O ciclo de interatividade do cliente no Telegram e sua respectiva propagação final de agendamento transcorre utilizando os seguintes degraus procedimentais (Modelo atualizado para API Hexagonal):

### Estágio 1: Captação Semântica (Bot)
1. **Cliente aciona o Bot Telegram**: "Minha pia da cozinha está entupida em Osasco no bairro Veloso."
2. **Máquina de Estado (conversationHandler.js)**: Regula sessão local contendo progresso do agrupamento nominal.
3. **Serviços de Análise IA**: Ferramenta legada `aiService.js` normaliza contexto extraindo: Município, Foco da Demanda.

### Estágio 2: Operações Hexagonais Backend (Busca de Profissional)
4. **Requisição Externa (HTTP POST)**: O bot constrói o agrupamento formatado estrito (ex. `{ descricaoServico: "Pia entupida", endereco: "Osasco Veloso" }`) para `http://api/providers/match`.
5. **Autenticador Semântico (Middleware Zod)**: A rota `providersRoutes.ts` bloqueia e intercepta ativamente requisições desestruturadas baseadas em definições de `matchProviderSchema`. Requisições inválidas retornam automaticamente `HttpResponse 400` com catálogo de inconformidades estruturais.
6. **Mapeamento de Ações (Controllers)**: Caso a transição semântica triunfe, a classe injetada `ProvidersController` resgata o respectivo construto e executa instrução central do núcleo de negócios `matchProviderUseCase.execute(...)`.
7. **Regras de Encontro (Use Cases)**: A classe de casos de negócios (com seus artefatos dependentes injetados via interface estrita) implementa:
   * Instruções de modelagem secundária de inteligência interconectando-se ao `GeminiAIAdapter`.
   * Disparo relacional ao banco via `PrismaProviderRepository` avaliando localização contida estritamente.
8. **Devolução do Acoplamento**: A finalização lógica de correspondência (Match) é envelopada e transferida aos blocos originais para formatação de estado 200, ou erros previstos de regra sistêmica englobam a mensagem no formato de estado correspondente, respondendo o requisitante via HTTP JSON.

---

## 5. Orientações de Gerenciamento Estrutural e Troubleshooting

### 5.1. Adicionando Parâmetros no Banco (Prisma Migrations)
Qualquer acréscimo tabular em PostgreSQL deve passar por compilação segura da ORM para manutenção em todos ambientes.
1. Modifique a estrutura `model` alvo no diretório oficial de `api/prisma/schema.prisma`.
2. Aplique a modificação pelo terminal invocando método global de persistência do fabricante: `npx prisma migrate dev --name modificacao_nome`.

### 5.2. O Express Compila porém emite Erros "Module Not Found" no arranque.
Sistemas TypeScript com propriedades `ESModules` inseridas nativamente em `package.json` exigem especificidade máxima para detecção local de artefatos paralelos.
**Procedimento Recomendado:**
Verificar declarações nos blocos de agrupamento superiores do arquivo corrompido assegurando a presença imutável do sufixo relacional `.js` sobre módulos injetados (Ex. `import { Algo } from '../minhaPasta/MeuArquivo.js'`), pois os diretórios relativos convertidos pós-compilação operarão perante arquivos gerados neste formato nativo pelo NodeJS.

### 5.3. Interceptar Inconformidades Globalmente (ErrorHandler)
Todos os escopos das funções do Express em formato primitivo não absorvem exceções natas ativadas no nível sistêmico principal. Para prevenção contra perdas de continuidade operacional de thread interna é requerida a injeção estrita da diretiva terminal Express: `next(error)` repassando toda falha estrutural à linha do middleware Global presente em `server.ts`.

---
*Este documento regula os contratos e formatos arquiteturais mandatórios do ecossistema e não deverá divergir na sua interpretação pelas ferramentas aplicadas nos desenvolvimentos sequenciais do ambiente referenciado.*
