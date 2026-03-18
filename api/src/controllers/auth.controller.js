const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

// Instancia a conexão com o banco PostgreSQL via Prisma
const prisma = new PrismaClient();

/**
 * Endpoint de Cadastro (Register)
 * Recebe: nome, email, senha, telefone, tipo
 */
async function register(req, res) {
  try {
    const { nome, email, senha, telefone, tipo } = req.body;

    // 1. Regra de Negócio: Verificar se o e-mail já existe no banco
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email }
    });

    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // 2. Segurança: Criptografar a senha antes de salvar! NUNCA grave senha em texto puro.
    const salt = await bcrypt.genSalt(10); // Gera um salt aleatório (camada extra de proteção)
    const senhaHash = await bcrypt.hash(senha, salt); // Mistura a senha com o salt

    // 3. Salvar no Banco via Prisma
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha: senhaHash, // Salvando a senha criptografada!
        telefone,
        tipo: tipo || 'CLIENTE'
      }
    });

    // 4. Retornamos sucesso, mas tiramos a senha do retorno (não precisamos mostrar pro front-end)
    const { senha: _, ...usuarioSemSenha } = novoUsuario;

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      usuario: usuarioSemSenha
    });

  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

/**
 * Endpoint de Login
 * Recebe: email, senha
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    // 1. Procura o usuário pelo e-mail
    const usuario = await prisma.usuario.findUnique({
      where: { email }
    });

    if (!usuario) {
      // Retornamos genérico para não dar dicas a hackers se o email existe ou não
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // 2. Verifica se a senha que o cara digitou bate com a criptografia do banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }

    // 3. Se a senha tá certa, geramos o "Crachá" (JWT Token) dele
    // Ele vai usar esse crachá nas próximas requisições pra provar quem ele é!
    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo }, // Payload (o que guardamos dentro do crachá)
      process.env.JWT_SECRET || 'senha_super_secreta_para_dev', // A chave que "assina" o crachá
      { expiresIn: '24h' } // O crachá expira em 24h
    );

    const { senha: _, ...usuarioLogado } = usuario;

    return res.status(200).json({
      mensagem: 'Login realizado com sucesso!',
      token, // O Front-end tem que guardar esse token!
      usuario: usuarioLogado
    });

  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = {
  register,
  login
};
