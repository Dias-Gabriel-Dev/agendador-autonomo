/**
 * Fábrica centralizada de dependências
 *
 * Padrão: Service Locator + Factory Method
 *
 * Responsabilidades:
 * 1. Criar e manter instâncias singleton (PrismaClient)
 * 2. Instanciar repositórios com suas dependências
 * 3. Instanciar adapters com suas credenciais
 * 4. Instanciar use cases com repositórios injetados
 * 5. Instanciar controllers com use cases injetados
 * 6. Retornar tudo pronto para uso em routes
 *
 * Benefício: Trocar de Prisma para MongoDB = trocar 1 arquivo
 * Sem tocar em controllers, routes, ou qualquer outra coisa
 */

import { PrismaClient } from '@prisma/client';

//Interfaces
import { IUserRepository } from '../core/interfaces/IUserRepository.js';
import { IProviderRepository } from '../core/interfaces/IProviderRepository.js';
import { IAIService } from '../core/interfaces/IAIService.js';
import { ICalendarService } from '../core/interfaces/ICalendarService.js';

//Implementações de Repositórios
import { PrismaUserRepository } from '../infrastructure/database/repositories/PrismaUserRepository.js';
import { PrismaProviderRepository } from '../infrastructure/database/repositories/PrismaProviderRepository.js';

//Implementações de Adapters
import { GeminiAIAdapter } from '../infrastructure/external/GeminiAIAdapter.js';
import { GoogleCalendarAdapter } from '../infrastructure/external/GoogleCalendarAdapter.js';

import { RegisterUserUseCase } from '../core/useCases/RegisterUserCases.js';
import { MatchProviderUseCase } from '../core/useCases/MatchProviderUseCase.js';

import { AuthController } from '../controllers/AuthController.js';
import { ProvidersController } from '../controllers/ProvidersController.js';

export class ControllersFactory {
  private static prismaInstace: PrismaClient | null = null;

  /**
   * Getter singleton para PrismaClient
   *
   * Padrão: Double-checked locking
   * 1. Se já existe instância: retorna
   * 2. Se não existe: cria uma
   * 3. Próximas chamadas retornam a mesma
   *
   * @returns PrismaClient singleton
   */
  private static getPrisma(): PrismaClient {
    if (!ControllersFactory.prismaInstace) {
      console.log('[ControllersFactory] Inicializando PrismaClient...');

      ControllersFactory.prismaInstace = new PrismaClient({
        log:
          process.env.NODE_ENV === 'development'
            ? ['info', 'error', 'warn']
            : ['error'],
      });

      process.on('SIGINT', async () => {
        console.log('[ControllerFactory] Desconectando do banco de dados...');
        await ControllersFactory.prismaInstace?.$disconnect();
        process.exit(0);
      });
    }

    return ControllersFactory.prismaInstace;
  }

  /**
   * factory para IUserRepository
   *
   * Encapsulamento:
   * - Routes não sabem que usa Prisma
   * - Se trocar para MongoDB: só muda aqui
   * - Controller continua igual
   *
   * Injeção:
   * - Repository recebe Prisma via constructor
   * - Repository implementa interface
   *
   * @returns Instância de PrismaUserRepository
   */
  private static createUserRepository(): IUserRepository {
    const prisma = ControllersFactory.getPrisma();
    return new PrismaUserRepository(prisma);
  }

  /**
   * Método facory para IProviderRepository
   *
   * Mesmo padrão de IUserRepository
   *
   * @returns Instância de PrismaProviderRepository
   */
  private static createProviderRepository(): IProviderRepository {
    const prisma = ControllersFactory.getPrisma();
    return new PrismaProviderRepository(prisma);
  }

  /**
   * Método factory para IAIService
   *
   * Encapsulamento:
   * - Routes não sabem qual LLM usa
   * - Se trocar para outro modelo, só muda aqui
   */
  private static createAIService(): IAIService {
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      throw new Error('[ControllersFactory] GOOGLE_API_KEY não configurada');
    }

    return new GeminiAIAdapter(apiKey);
  }

  /**
   * Método factory para ICalendarService
   *
   * Encapsulamento:
   * - Routes não sabem qual calendário usa
   * - Se trocar para Outlook: só muda aqui
   */
  private static createCalendarService(): ICalendarService {
    const serviceAccountKey = process.env.GOOGLE_CREDENTIALS;

    if (!serviceAccountKey) {
      throw new Error(
        '[ControllersFactory] GOOGLE_CREDENTIALS não configurada',
      );
    }

    // Obs: Em produção, parse JSON do arquivo
    // const const key = JSON.parse(fs.readFileSync(serviceAccountKeyPath, 'utf8'));

    const key = {
      type: 'service_account',
      project_id: process.env.GOOGLE_PROJECT_ID,
      private_key: process.env.GOOGLE_PRIVATE_KEY,
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
    };

    return new GoogleCalendarAdapter(key);
  }
  /**
   * Método factory para RegisterUserUseCase
   *
   * Injeção em cadeia:
   * RegisterUserUseCase
   *   ├─ recebe UserRepository
   *   │  └─ que recebe PrismaClient
   *   └─ recebe PasswordHasher (bcryptjs)
   *
   * Será criado em T011
   *
   * @returns Instância de RegisterUserUseCase
   */
  private static createRegisterUserUseCase(): RegisterUserUseCase {
    const userRepository = ControllersFactory.createUserRepository();
    return new RegisterUserUseCase(userRepository);
  }

  /**
   * Método factory para MatchProviderUseCase
   *
   * Injeção em cadeia:
   * MatchProviderUseCase
   *   ├─ recebe ProviderRepository
   *   ├─ recebe AIService
   *   └─ recebe CalendarService
   *
   * Será criado em T011-T012
   *
   * @returns Instância de MatchProviderUseCase
   */
  private static createMatchProviderUseCase(): MatchProviderUseCase {
    const providerRepository = ControllersFactory.createProviderRepository();
    const aiService = ControllersFactory.createAIService();
    const calendarService = ControllersFactory.createCalendarService();
    return new MatchProviderUseCase(
      providerRepository,
      aiService,
      calendarService,
    );
  }

  /**
   * Método factory para AuthController
   *
   * Injeção:
   * AuthController
   *   └─ recebe RegisterUserUseCase
   *      └─ que recebe UserRepository
   *         └─ que recebe PrismaClient
   *
   * Controlador não sabe detalhes internos
   * Só sabe: tenho um UseCase que registra usuários
   *
   * @returns Instância de AuthController
   */
  public static createAuthController(): AuthController {
    const registerUserUseCase = ControllersFactory.createRegisterUserUseCase();
    return new AuthController(registerUserUseCase);
  }

  /**
   * Método factory para ProvidersController
   *
   * Injeção:
   * ProvidersController
   *   └─ recebe MatchProviderUseCase
   *      ├─ que recebe ProviderRepository
   *      ├─ que recebe AIService
   *      └─ que recebe CalendarService
   *
   * @returns Instância de ProvidersController
   */
  public static createProvidersController(): ProvidersController {
    const matchProviderUseCase = ControllersFactory.createMatchProviderUseCase();
    return new ProvidersController(matchProviderUseCase);
  }

  /**
   * Método público: Retorna todas as dependências prontas para uso
   *
   * Uso em server.ts:
   * ```typescript
   * const { authController, providersController } = ControllersFactory.initialize();
   *
   * app.use('/auth', authController.router);
   * app.use('/providers', providersController.router);
   * ```
   *
   * @returns Objeto com todos controllers instanciados
   */
  public static initialize() {
    console.log(
      '[ControllersFactory] Inicializando fábrica de dependências...',
    );

    return {
      // Controllers vazios por enquanto (será comentado acima)
      // authController: ControllersFactory.createAuthController(),
      // providersController: ControllersFactory.createProvidersController(),

      // Para testes, retorna repositórios diretos
      prisma: ControllersFactory.getPrisma(),
      userRepository:
        ControllersFactory.createUserRepository() as IUserRepository,
      providerRepository:
        ControllersFactory.createProviderRepository() as IProviderRepository,
      aiService: ControllersFactory.createAIService() as IAIService,
      calendarService:
        ControllersFactory.createCalendarService() as ICalendarService,
    };
  }

  /**
   * Desliga todas as dependências (graceful shutdown)
   *
   * Uso em server.ts error handler:
   * ```typescript
   * process.on('SIGINT', () => {
   *   ControllersFactory.shutdown();
   *   process.exit(0);
   * });
   * ```
   */
  public static async shutdown(): Promise<void> {
    console.log('[ControllersFactory] Encerrando dependências...');

    if (ControllersFactory.prismaInstace) {
      await ControllersFactory.prismaInstace.$disconnect();
    }
  }
}
