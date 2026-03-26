# 🗺️ Guia de Arquitetura do Agendador Autônomo

Este documento detalha o papel de cada pasta e arquivo em nosso Monorepo (duas aplicações no mesmo repositório).

## 🤖 Bloco 1: O Robô do Telegram (Raiz)
Tudo que está na pasta raiz e na pasta `/src` faz parte do aplicativo que conversa com o cliente.

*   `index.js` -> Ponto de entrada (Entry Point). Apenas liga a biblioteca `telegraf` e repassa as mensagens para o Handler. Nunca coloque regra de negócio aqui.
*   `src/handlers/` -> O cérebro do fluxo de conversa.
    *   `conversationHandler.js`: Controla a "Máquina de Estados" (State Machine). Lembra o que o cliente digitou e decide o que responder em seguida (Switch/Case).
*   `src/services/` -> Os "Especialistas" em integrações externas.
    *   `aiService.js`: Sabe montar prompts e falar com a API do Google Gemini.
    *   `calendarService.js`: Sabe montar payloads e falar com a API do Google Calendar.
*   `src/utils/` -> Ferramentas matemáticas e conversões genéricas de strings/datas (não dependem de integrações).
*   `scripts/` -> Scripts isolados para manutenção (como `limparAgenda.js`) rodados manualmente via terminal.

---

## 🌐 Bloco 2: A API Backend (Pasta `/api`)
Tudo que está na pasta `/api` roda em uma porta separada (3000) e serve os dados do Banco de Dados PostgreSQL.

*   `api/server.js` -> Ponto de entrada do Express. Inicia o servidor e atrela os mapeamentos de URL.
*   `api/prisma/schema.prisma` -> O "Desenhista" do Banco. É aqui que criamos as tabelas `Usuario`, `PerfilPrestador`, etc. O Prisma transforma isso em SQL.
*   `api/src/routes/` -> Os "Garçons". Recebem o pedido HTTP e repassam pro controlador.
    *   `authRoutes.js`: Define as rotas POST `/register` e `/login`.
    *   `providersRoutes.js`: Define a rota GET `/search`.
*   `api/src/controllers/` -> Os "Gerentes". Fazem as validações de regra de negócio, criptografia e buscam no banco de dados com Prisma.
    *   `authController.js`: Cuida de criptografia (Bcrypt) e Tokens (JWT) ao criar e logar usuários.
    *   `providersController.js`: Lógica de busca e *Matchmaking* no banco de dados (ex: achar prestadores por cidade).
*   `api/agendador_api_postman_collection.json` -> O arquivo de teste com chamadas HTTP prontas (Health Check, Register, Login) para usar no Postman e popular a base sem precisar de um site (Front-end) pronto.
