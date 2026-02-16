/**
 * Utilitário para carregar comandos de RPG com suporte a actions avançadas
 */

import { readFile } from "fs/promises";
import { resolve } from "path";
import { z } from "zod";

// Schema para condições
const conditionSchema = z.object({
  type: z.enum(["comparison", "chance", "permission", "role", "channel", "user"]),
  value1: z.union([z.string(), z.number()]).optional(),
  operator: z.enum(["==", "!=", ">", "<", ">=", "<="]).optional(),
  value2: z.union([z.string(), z.number()]).optional(),
  chance: z.number().min(0).max(100).optional(),
  permission: z.string().optional(),
  roleId: z.string().optional(),
  roleName: z.string().optional(),
  channelId: z.string().optional(),
  userId: z.string().optional(),
});

// Schema para botões
const buttonSchema = z.object({
  label: z.string(),
  style: z.enum(["Primary", "Secondary", "Success", "Danger", "Link"]),
  customId: z.string().optional(),
  url: z.string().url().optional(),
  emoji: z.string().optional(),
  actions: z.array(z.lazy(() => actionSchema)).optional(),
});

// Schema para opções de select menu
const selectOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
  description: z.string().optional(),
  emoji: z.string().optional(),
  actions: z.array(z.lazy(() => actionSchema)).optional(),
});

// Schema para select menu
const selectMenuSchema = z.object({
  customId: z.string(),
  placeholder: z.string().optional(),
  minValues: z.number().optional(),
  maxValues: z.number().optional(),
  options: z.array(selectOptionSchema),
});

// Schema para embed customizado
const embedSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  color: z.string().optional(),
  image: z.string().url().optional(),
  thumbnail: z.string().url().optional(),
  footer: z.string().optional(),
});

// Schema para ações
const actionSchema: z.ZodType<any> = z.object({
  type: z.enum([
    "send_message",
    "send_channel",
    "send_dm",
    "random_reply",
    "add_role",
    "remove_role",
    "delete_message",
    "timeout_user",
  ]),
  conditions: z.array(conditionSchema).optional(),
  content: z.string().optional(),
  messages: z.array(z.string()).optional(),
  channelId: z.string().optional(),
  userId: z.string().optional(),
  roleId: z.string().optional(),
  duration: z.number().optional(),
  buttons: z.array(buttonSchema).optional(),
  selectMenu: selectMenuSchema.optional(),
  embed: embedSchema.optional(),
});

// Schema para comando completo com actions
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
  actions: z.array(actionSchema).optional(),
  requireConfirmation: z.boolean().optional(),
  confirmationMessage: z.string().optional(),
});

// Schema que aceita tanto string quanto objeto
export const commandSchema = z.record(z.string().min(1), z.union([z.string().min(1), commandObjectSchema]));

export type CommandBook = z.infer<typeof commandSchema>;

/**
 * Carrega e valida comandos
 */
export async function loadCommands(): Promise<CommandBook> {
  const apiUrl = process.env.COMMANDS_API_URL;

  if (apiUrl) {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Failed to fetch commands: ${res.status}`);
    const json = await res.json();
    return commandSchema.parse(json);
  }

  const raw = await readFile(resolve(process.cwd(), "fastapi-app", "commands.json"), "utf8");
  return commandSchema.parse(JSON.parse(raw));
}