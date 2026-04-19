import { z } from "zod";

export const registerUserSchema = z.object({
  body: z.object({
    email: z.string().email({ message: "Insira um email válido"}),
    senha: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres"}),
    tipo: z.enum(["CLIENTE", "PRESTADOR"], { message: "O tipo deve ser CLIENTE ou PRESTADOR"})
  })
});

export type RegisterUserDTO = z.infer<typeof registerUserSchema>["body"];
