import { z } from 'zod';

export const searchProvidersSchema = z.object({
  query: z.object({
    cidade: z.string().optional(),
    bairro: z.string().optional(),
  }).refine(data => data.cidade || data.bairro, {
    message: 'É necessário informar uma cidade e bairro para a busca'
  })
});

export const matchProvidersSchema = z.object({
  body: z.object({
    cliente: z.object({
      nome: z.string().min(2, "Nome é obrigatório e deve conter pelo menos 2 caracteres"),
      telefone: z.string().min(10, "Telefone é obrigatório e deve conter pelo menos 10 dígitos"),
      enderecoBruto: z.string().min(5, "Endereço é obrigatório e deve conter pelo menos 5 caracteres")
    }),
    servicoBuscado: z.string().min(2, "Serviço buscado é obrigatório e deve conter pelo menos 2 caracteres"),
    agendamento: z.object({
      dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
      horaInicio: z.string().regex(/^\d{2}:\d{2}$/, "Hora de início deve estar no formato HH:MM"),
      horaFim: z.string().regex(/^\d{2}:\d{2}$/, "Hora de fim deve estar no formato HH:MM")
    })
  })
});