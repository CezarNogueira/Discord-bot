/**
 * Utilitário para carregar comandos de RPG
 * 
 * Suporta carregamento de comandos via API REST ou arquivo JSON local
 * Inclui validação de schema com Zod para garantir integridade dos dados
 * Suporta tanto formato simples (string) quanto formato completo (objeto com GIF)
 */

import { readFile } from "fs/promises";
import { resolve } from "path";
import { z } from "zod";

// Schema para estrutura completa de comando com GIF e metadados
const commandObjectSchema = z.object({
  description: z.string().min(1),
  gif: z.string().url().optional(),
  cooldown: z.number().positive().optional(),
  color: z.string().optional(),
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().url().optional(),
  author_icon: z.string().url().optional(),
  thumbnail_url: z.string().url().optional(),
  footer_text: z.string().optional(),
  footer_icon: z.string().url().optional(),
});

// Schema que aceita tanto string quanto objeto para compatibilidade
export const commandSchema = z.record(
  z.string().min(1), 
  z.union([z.string().min(1), commandObjectSchema])
);

/**
 * Tipo que representa um livro de comandos
 * Pode conter comandos no formato simples (string) ou completo (objeto)
 */
export type CommandBook = z.infer<typeof commandSchema>;

/**
 * Carrega e valida comandos a partir de arquivo local ou API externa.
 * @returns CommandBook – dicionário { commandName: description }
 */
export async function loadCommands(): Promise<CommandBook> {
  const apiUrl = process.env.COMMANDS_API_URL;

  if (apiUrl) {
    // Usa fetch nativo do Node >= 20
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Failed to fetch commands: ${res.status}`);
    const json = await res.json();
    return commandSchema.parse(json);
  }

  const raw = await readFile(resolve(process.cwd(), "fastapi-app", "commands.json"), "utf8");
  return commandSchema.parse(JSON.parse(raw));
}