/**
 * Registrador de comandos slash do Discord
 * 
 * Este script registra automaticamente todos os comandos disponíveis
 * como slash commands no Discord, seja em um servidor específico (dev)
 * ou globalmente (produção)
 */

import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";
import { loadCommands } from "../utils/commandLoader";

/**
 * Função principal que registra os comandos slash
 * Carrega todos os comandos disponíveis e os registra no Discord
 */
async function main() {
  const token = process.env.DISCORD_TOKEN!;
  const clientId = process.env.CLIENT_ID!; // ID da aplicação/bot
  const guildId = process.env.GUILD_ID; // Se definido, registra no servidor para desenvolvimento

  const commandsData = await loadCommands();

  // Converte cada comando em um SlashCommandBuilder
  const commands = Object.keys(commandsData).map((name) =>
    new SlashCommandBuilder()
      .setName(name)
      .setDescription(`Executa o comando **${name}**`)
      .toJSON()
  );

  const rest = new REST({ version: "10" }).setToken(token);

  // Decide se registra no servidor (desenvolvimento) ou globalmente (produção)
  if (guildId) {
    // Registro local no servidor - mais rápido para desenvolvimento
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });
    console.log("✅ Guild commands registered.");
  } else {
    // Registro global - pode levar até 1 hora para propagar
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("✅ Global commands registered (podem levar até 1h para propagar).");
  }
}

/**
 * Executa o registro de comandos e trata erros
 */
main().catch((e) => console.error(e));