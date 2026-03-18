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

## 💻 4. Requisitos Técnicos Futuros (O que falta construir)

A Prova de Conceito (PoC) atual do bot de 1-para-1 já funciona, mas para atingir este MVP, precisaremos evoluir as seguintes peças de arquitetura:

- [ ] **Banco de Dados Real (SQL ou NoSQL):** Substituir o `servicosMock.js` por um banco (como PostgreSQL ou MongoDB) com tabelas de `Profissionais` e `Serviços`.
- [ ] **Front-End Administrativo (Web):** Desenvolver um painel em React/Vue para que o Prestador possa criar sua conta, definir horários e autorizar o Google Calendar via OAuth2 (Consent Screen).
- [ ] **Serviço de Geolocalização:** Integrar alguma API de Mapas (Google Maps, Mapbox) para calcular distâncias entre o cliente e o prestador.
- [ ] **Módulo de Matching (`matchService.js`):** Um serviço focado exclusivamente em cruzar os dados do DB (Banco) + Geolocation + Calendar Free/Busy.
- [ ] **Segurança e Validação:** Medidas para evitar agendamentos falsos, confirmação de identidade do prestador, e limite de *rate-limiting* no bot.
