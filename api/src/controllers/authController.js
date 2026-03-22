import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const prisma = new PrismaClient();

/**
 * Processa o registro na tabela universal de usuário e no respectivo perfil relacional.
 */
async function register(req, res) {
  try {
    const { email, senha, tipo, perfilDados } = req.body;

    const usuarioExistente = await prisma.usuario.findUnique({ where: { email } });
    if (usuarioExistente) return res.status(400).json({ erro: 'E-mail já cadastrado.' });

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    let dadosDeCriacao = { email, senha: senhaHash, tipo: tipo || 'CLIENTE' };

    if (tipo === 'PRESTADOR') {
      dadosDeCriacao.perfilPrestador = {
        create: {
          nomeFantasia: perfilDados.nomeFantasia,
          telefoneContato: perfilDados.telefoneContato,
          googleCalendarId: perfilDados.googleCalendarId || null,
          servicosOferecidos: perfilDados.servicosOferecidos || [],
          raioDeAtuacaoKm: perfilDados.raioDeAtuacaoKm || 10,
          estado: perfilDados.estado || 'SP',
          cidade: perfilDados.cidade || 'São Paulo',
          bairro: perfilDados.bairro || 'Centro',
          rua: perfilDados.rua || null,
          cep: perfilDados.cep || null
        }
      };
    } else {
      dadosDeCriacao.perfilCliente = {
        create: {
          nome: perfilDados.nome,
          telefone: perfilDados.telefone,
          estado: perfilDados.estado || null,
          cidade: perfilDados.cidade || null,
          bairro: perfilDados.bairro || null,
          rua: perfilDados.rua || null,
          cep: perfilDados.cep || null
        }
      };
    }

    const novoUsuario = await prisma.usuario.create({
      data: dadosDeCriacao,
      include: { perfilCliente: true, perfilPrestador: true }
    });

    const { senha: _, ...usuarioFinal } = novoUsuario;
    return res.status(201).json({ mensagem: 'Cadastro realizado com sucesso!', usuario: usuarioFinal });

  } catch (erro) {
    console.error('Erro no cadastro:', erro);
    return res.status(500).json({ erro: 'Erro interno. Verifique o payload.', detalhes: erro.message });
  }
}

/**
 * Autentica o usuário validando a criptografia via bcryp e injetando um Token JWT.
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario) return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) return res.status(401).json({ erro: 'Credenciais inválidas.' });

    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'senha_super_secreta_para_dev',
      { expiresIn: '24h' }
    );

    const { senha: _, ...usuarioLogado } = usuario;
    return res.status(200).json({ mensagem: 'Login realizado com sucesso!', token, usuario: usuarioLogado });

  } catch (erro) {
    console.error('Erro no login:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

export {
  register,
  login
};
