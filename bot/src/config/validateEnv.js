/**
 * Módulo de Validação de Variáveis de Ambiente
 * Centraliza todas as verificações de chaves de API e variáveis obrigatórias
 */

export function validateEnviroment() {
  const requiredEnvVars = {
    TELEGRAM_TOKEN: 'Token do Bot Telegram',
    GEMINI_API_KEY: 'Chave de API para acesso ao Gemini',
    GOOGLE_APPLICATION_CREDENTIALS: 'Credenciais de aplicação do Google',
  };

  const missingVars = [];
  const validVars = {};

  //Verifica se as variáveis de ambiente obrigatórias estão definidas e não são vazias
  for (const [varName, decsription] of Object.entries(requiredEnvVars)) {
    const value = process.env[varName];

    if (!value || value.trim() === "") {
      missingVars.push({ varName, decsription});
    } else {
      validVars[varName] = value;
    }
  }

  // Se houver variáveis ausentes ou inválidas, exibe um erro detalhado e encerra o processo
  if (missingVars.length > 0) {
    console.error("Erro: Variáveis de ambiente obrigatórias ausentes ou inválidas:");

    missingVars.forEach(({ varName, description }) => {
      console.error(`- ${varName}: ${description}`);
    });

    console.error('Adicione no arquivo .env na raiz do bot/');
    console.error("Exemplo de .env:");
    console.error(`
    TELEGRAM_TOKEN=seu_token_aqui
    GEMINI_API_KEY=sua_chave_gemini_aqui
    GOOGLE_APPLICATION_CREDENTIALS=seu_caminho_para_credenciais_google.json
    `);

    process.exit(1);
  }

  console.log("Todas as variáveis de ambiente validadas com sucesso!\n");
  

  return validVars;


  }