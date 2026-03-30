# 🗺️ Guia de Arquitetura do Agendador Autônomo

Este projeto utiliza uma arquitetura baseada em **Camadas (Layered Architecture)** para separar responsabilidades e facilitar o aprendizado e manutenção.

## 🤖 Bloco 1: O Robô do Telegram (Raiz e `/src`)
Focado na interação direta com o cliente final.

*   `index.js`: **Entry Point**. Apenas inicializa a biblioteca Telegraf e liga o servidor de mensagens.
*   `src/handlers/conversationHandler.js`: **State Machine**. Controla em que passo da conversa o usuário está e o que ele deve responder. Cada etapa (Nome, Telefone, IA) é uma função isolada.
*   `src/services/aiService.js`: **IA Engine**. Responsável exclusivamente por formatar prompts e falar com o Google Gemini.
*   `src/services/calendarService.js`: **Google Engine**. Responsável por se autenticar e inserir eventos no Google Calendar API.
*   `src/utils/dateUtils.js`: **Formatadores**. Funções puras de transformação de strings de data e hora.

---

## 🌐 Bloco 2: A API Backend (Pasta `/api`)
Focado na gestão de profissionais e dados estruturados no banco de dados.

*   `api/server.js`: **Express Entry Point**. Liga o servidor HTTP na porta 3000.
*   `api/prisma/schema.prisma`: **Database Model**. Define como o PostgreSQL é estruturado (Tabelas: Usuario, PerfilPrestador, PerfilCliente).
*   `api/src/routes/`: **Roteamento**. Define as URLs (`/auth/register`, `/providers/search`).
*   `api/src/controllers/`: **Controllers**. Onde mora a lógica de banco de dados:
    *   `authController.js`: Cria usuários e perfis relacionais com senhas criptografadas (Bcrypt) e gera Tokens JWT.
    *   `providersController.js`: Faz a busca dinâmica de profissionais e serviços por cidade/região.
*   `api/prisma/seed.js`: **Script de População**. Usado para injetar prestadores de teste (Osasco) no banco de dados.

---

## 🛠️ Como dar manutenção (Tech-Lead Tips)
1.  **Mudança de Fluxo:** Se quiser adicionar uma pergunta nova (ex: CPF), você adiciona uma função em `conversationHandler.js`.
2.  **Mudança no Banco:** Se quiser novos campos de endereço, você edita o `schema.prisma` e roda `npx prisma db push`.
3.  **Melhoria na IA:** Se o bot não estiver entendendo bem os serviços, ajuste o `aiService.js`.
