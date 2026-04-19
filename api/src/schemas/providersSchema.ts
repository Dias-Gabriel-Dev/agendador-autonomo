import { z } from 'zod';

export const matchProviderSchema = z.object({
  body: z.object({
    descricaoServico: z.string().min(1, { message: "Descrição do serviço é obrigatória"}),
    endereco: z.string().min(1, { message: "Endereço é obrigatório e precisa ser válido"})
  })
});

export type MatchProviderDTO = z.infer<typeof matchProviderSchema>["body"];
