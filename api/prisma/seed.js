import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando injeção de dados de prestadores em Osasco/SP...');

  // Gerar uma senha padrão (criptografada) para todos os prestadores de teste
  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('senha123', salt);

  const prestadoresDeTeste = [
    {
      nome: 'Carlos Encanador',
      email: 'carlos.encanador@test.com',
      telefone: '11977771111',
      fantasia: 'Carlos Resolve Vazamentos',
      servicos: ['Encanador', 'Desentupidora', 'Caça Vazamento'],
      bairro: 'Jardim Veloso',
    },
    {
      nome: 'Roberto Eletricista',
      email: 'roberto.eletrica@test.com',
      telefone: '11977772222',
      fantasia: 'Roberto Serviços Elétricos',
      servicos: ['Eletricista', 'Instalação de Tomadas', 'Fiação'],
      bairro: 'Rochdale',
    },
    {
      nome: 'Marcos Pintor',
      email: 'marcos.pinturas@test.com',
      telefone: '11977773333',
      fantasia: 'Pinturas Ramos',
      servicos: ['Pintor', 'Textura', 'Massa Corrida'],
      bairro: 'Jardim das Flores',
    },
    {
      nome: 'Antonio Pedreiro',
      email: 'antonio.obras@test.com',
      telefone: '11977774444',
      fantasia: 'Obras e Reformas Santo Antonio',
      servicos: ['Pedreiro', 'Alvenaria', 'Piso e Porcelanato', 'Reboco'],
      bairro: 'Km 18',
    },
    {
      nome: 'João Ar Condicionado',
      email: 'joao.ar@test.com',
      telefone: '11977775555',
      fantasia: 'João Climatização',
      servicos: [
        'Manutenção de Ar Condicionado',
        'Instalação de Ar Condicionado',
        'Limpeza de Split',
      ],
      bairro: 'Presidente Altino',
    },
    {
      nome: 'Fernanda Diarista',
      email: 'fernanda.faxina@test.com',
      telefone: '11977776666',
      fantasia: 'Faxina Premium',
      servicos: ['Faxineira', 'Diarista', 'Limpeza Pesada', 'Limpeza Pós-Obra'],
      bairro: "Jardim D'Abril",
    },
    {
      nome: 'Lucas Montador',
      email: 'lucas.moveis@test.com',
      telefone: '11977777777',
      fantasia: 'Lucas Montagem de Móveis',
      servicos: ['Montador de Móveis', 'Instalação de Prateleiras'],
      bairro: 'Pestana',
    },
    {
      nome: 'Diego Gesseiro',
      email: 'diego.gesso@test.com',
      telefone: '11977778888',
      fantasia: 'Gesso Decorações',
      servicos: ['Gesseiro', 'Drywall', 'Sanca de Gesso'],
      bairro: 'Vila Yara',
    },
    {
      nome: 'Ricardo Jardineiro',
      email: 'ricardo.jardim@test.com',
      telefone: '11977779999',
      fantasia: 'Jardinagem Verde Vida',
      servicos: ['Jardineiro', 'Poda de Árvores', 'Corte de Grama'],
      bairro: 'Umuarama',
    },
    {
      nome: 'Pedro Marido de Aluguel',
      email: 'pedro.marido@test.com',
      telefone: '11977770000',
      fantasia: 'Pedro Faz Tudo',
      servicos: [
        'Marido de Aluguel',
        'Instalação de Suporte de TV',
        'Troca de Chuveiro',
        'Pequenos Reparos',
      ],
      bairro: 'Jaguaribe',
    },
  ];

  for (const p of prestadoresDeTeste) {
    // Verifica se já existe para não duplicar se rodar duas vezes
    const exists = await prisma.usuario.findUnique({
      where: { email: p.email },
    });

    if (!exists) {
      await prisma.usuario.create({
        data: {
          email: p.email,
          senha: defaultPassword,
          tipo: 'PRESTADOR',
          perfilPrestador: {
            create: {
              nomeFantasia: p.fantasia,
              telefoneContato: p.telefone,
              servicosOferecidos: p.servicos,
              raioDeAtuacaoKm: 30, // Todos atendendo num raio de 30km (cobrindo a cidade toda)
              estado: 'SP',
              cidade: 'Osasco',
              bairro: p.bairro,
            },
          },
        },
      });
      console.log(`✅ Criado: ${p.nome} (${p.servicos[0]}) em ${p.bairro}`);
    } else {
      console.log(`⏭️  Pulando: ${p.email} já existe no banco.`);
    }
  }

  console.log('Injeção finalizada com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no Seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
