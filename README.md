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
- **Bot Inteligente Modular (Telegram):** Máquina de estados desacoplada (`conversationHandler`) operando em Node.js com módulos modernos (ESM).
- **Busca Semântica Dinâmica:** O robô pede o endereço, busca profissionais na API, e o Gemini filtra semanticamente o serviço desejado, tratando ambiguidades com menus numerados.
- **Agendamento Automático Baseado em Match:** Integração validada onde o bot descobre o Google Calendar ID específico do prestador e insere o evento.

### ✅ Concluído (Fase 2: Banco de Dados Real e Autenticação)
- **Banco de Dados Relacional:** Servidor **PostgreSQL 15** rodando localmente via Docker (`docker-compose.yml`).
- **Modelagem ORM Avançada:** Implementação do **Prisma ORM** v5. Criada tabela unificada de `Usuario` ligada em 1-para-1 com as tabelas filhas `PerfilPrestador` e `PerfilCliente`.
- **API RESTful e Injeção de Dados:** Servidor **Express.js** inicializado, com rota de busca de prestadores (`/api/providers/search`) e Seed Scripts rodando para injetar prestadores em Osasco-SP.
- **Segurança (Auth):** Rotas de Registro e Login criadas com senha criptografada via **Bcryptjs** e emissão de Tokens **JWT**.

### 🔜 Próximos Passos (O que falta construir)
- [ ] **Front-End Administrativo (Web):** Desenvolver um painel em React/Vue para que o Prestador faça login (usando a nossa rota JWT), edite seu perfil e integre seu próprio Google Calendar via Consent Screen (OAuth2).
- [ ] **Serviço de Geolocalização Real:** Evoluir a busca atual (feita por Strings de `Cidade/Bairro` via Axios e URLSearchParams) para utilizar uma API de mapas oficial (Google/Mapbox) calculando Distância KM (`Raio de Atuação`).
- [ ] **Integração Completa (Free/Busy API):** Fazer a API consultar os horários livres na agenda do Google Calendar dos prestadores **antes** de enviá-los para a lista do bot, criando um verdadeiro cruzamento de agenda.
