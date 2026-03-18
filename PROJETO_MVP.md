# 🚀 Visão do Produto MVP: Agendador Autônomo (Marketplace Inteligente)

## 📌 1. O que é o Projeto?
Uma plataforma SaaS de **matchmaking de serviços**, operada primariamente via Chatbot (Telegram/WhatsApp) integrado a IA, focada em conectar **Clientes** que precisam de serviços imediatos a **Prestadores de Serviços Autônomos** (Encanadores, Eletricistas, Pedreiros, Marceneiros, etc) que possuam disponibilidade na agenda e estejam na mesma região.

---

## 👥 2. Tipos de Usuários (Atores do Sistema)

### 2.1. Prestador de Serviço (Autônomo)
O profissional acessa o **Portal Web / App** e realiza o seu cadastro.
**Dados coletados no cadastro:**
- **Perfil:** Nome, E-mail, Telefone.
- **Atuação:** Tipo(s) de serviço(s) prestado(s).
- **Localização:** Endereço base e Raio de Atuação (em KM).
- **Regras de Negócio (Agenda):** Dias da semana em que trabalha (ex: Seg a Sex) e Horário de Atendimento (ex: 08:00 às 18:00).
- **Integração Externa:** Conecta o seu **Google Calendar** na plataforma para que o sistema saiba, em tempo real, os "buracos" (horários livres) na agenda dele.

### 2.2. Cliente Final
O cliente NÃO precisa baixar nenhum aplicativo. Ele interage diretamente com o **Bot Inteligente** no Telegram (ou WhatsApp).
- O cliente digita em linguagem natural: *"Preciso de alguém para arrumar o encanamento da minha pia vazando amanhã de manhã na Vila Mariana"*.
- A IA extrai: `Serviço (Encanador)`, `Data/Hora (Amanhã, manhã)` e `Local (Vila Mariana)`.

---

## ⚙️ 3. O "Core" do MVP: Algoritmo de Matchmaking
Quando o bot extrai o pedido do cliente, ele precisa buscar na **Base de Dados de Prestadores** a combinação perfeita. Os 3 filtros principais (O Funil) são:

1. **Filtro de Serviço (Busca Semântica):** Encontra todos os prestadores cadastrados cuja especialidade bate com a abstração do cliente (ex: "vazamento" -> "Encanador").
2. **Filtro de Localidade (Geolocalização):** Destes encanadores, filtra apenas aqueles cujo "Raio de Atuação" engloba o bairro/CEP do cliente.
3. **Filtro de Disponibilidade (Google Calendar):**
   - O sistema checa as *Regras de Negócio* do prestador (Ele trabalha de manhã?).
   - O sistema acessa a API do Google Calendar dos prestadores filtrados e pergunta: *"Quem NÃO tem evento marcado nesse dia e horário?"*.

### O Desfecho:
O Bot devolve ao cliente: *"Encontrei 3 encanadores disponíveis na Vila Mariana para amanhã de manhã. Escolha um: 1 - João Silva, 2 - Marcos Antonio"*.
O cliente escolhe, e o bot automaticamente insere o evento no Google Calendar do **João Silva** com o nome, telefone e endereço do cliente.

---

## 💻 4. Progresso do Desenvolvimento e Arquitetura Técnica

Até o momento, evoluímos a Prova de Conceito (PoC) simples do bot e já começamos a estruturar o Backend Oficial do MVP em um Monorepo:

### ✅ Concluído (Fase 1: Bot e Integrações)
- **Bot Inteligente (Telegram):** Máquina de estados rodando com Node.js (Telegraf).
- **Busca Semântica:** Integração com Google Gemini 2.5 Flash (`aiService`).
- **Agendamento Automático:** Integração validada com Service Accounts da Google Calendar API (`calendarService`).

### ✅ Concluído (Fase 2: Banco de Dados Real e Autenticação)
- **Banco de Dados Relacional:** Substituímos o Mock por um servidor **PostgreSQL 15** rodando via Docker (`docker-compose.yml`).
- **Modelagem ORM:** Implementação do **Prisma ORM** v5 para facilitar as *Migrations* e modelos. Criado o modelo base de `Usuario` (`CLIENTE` e `PRESTADOR`).
- **API RESTful:** Servidor **Express.js** inicializado na pasta `/api` para atender o futuro Front-End.
- **Segurança (Auth):** Rotas de Registro e Login implementadas com senha forte encriptada via **Bcryptjs** e sessão autenticada usando Tokens **JWT**.

### 🔜 Próximos Passos (O que falta construir)
- [ ] **Front-End Administrativo (Web):** Desenvolver um painel em React/Vue para que o Prestador faça login (usando nossa rota JWT), edite seu perfil e autorize seu próprio Google Calendar via OAuth2.
- [ ] **Integração Bot-API:** Fazer o bot do Telegram parar de usar o `servicosMock.js` e passar a consumir as rotas da nossa nova `api/` para buscar os profissionais em tempo real no PostgreSQL.
- [ ] **Serviço de Geolocalização:** Integrar APIs de mapas (Google/Mapbox) para calcular a distância entre o cliente (do Bot) e os prestadores (do Banco).
- [ ] **Módulo de Matching (`matchService.js`):** O "Cérebro" que cruza `PostgreSQL (Serviços)` + `Geolocation (Local)` + `Calendar API (Free/Busy)`.
