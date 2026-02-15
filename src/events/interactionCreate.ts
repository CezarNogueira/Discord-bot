/**
 * Manipulador de eventos de interação do Discord
 * 
 * Este módulo processa slash commands e responde com embeds estilizados
 * contendo informações sobre comandos de RPG, incluindo GIFs quando disponíveis
 */

import { Client, ChatInputCommandInteraction, Interaction, EmbedBuilder } from "discord.js";
import { loadCommands } from "../utils/commandLoader";

// Map para armazenar cooldowns por usuário e comando: "userId-commandName" -> timestamp
const cooldowns = new Map<string, number>();

/**
 * Verifica se o usuário está em cooldown para um comando específico
 * @param userId - ID do usuário
 * @param commandName - Nome do comando
 * @param cooldownSeconds - Tempo de cooldown em segundos
 * @returns Tempo restante em segundos ou null se não há cooldown
 */
function checkCooldown(userId: string, commandName: string, cooldownSeconds: number): number | null {
  const key = `${userId}-${commandName}`;
  const now = Date.now();
  const cooldownTime = cooldowns.get(key);
  
  if (cooldownTime && now < cooldownTime) {
    return Math.ceil((cooldownTime - now) / 1000);
  }
  
  return null;
}

/**
 * Define o cooldown para um usuário e comando
 * @param userId - ID do usuário
 * @param commandName - Nome do comando
 * @param cooldownSeconds - Tempo de cooldown em segundos
 */
function setCooldown(userId: string, commandName: string, cooldownSeconds: number): void {
  const key = `${userId}-${commandName}`;
  const cooldownTime = Date.now() + (cooldownSeconds * 1000);
  cooldowns.set(key, cooldownTime);
  
  // Limpar cooldown automaticamente após expirar
  setTimeout(() => {
    cooldowns.delete(key);
  }, cooldownSeconds * 1000);
}

/**
 * Configura o manipulador de eventos de interação
 * Processa slash commands e responde com embeds estilizados
 * @param client - Instância do cliente Discord.js
 */
export default (client: Client) => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      const commands = await loadCommands();
      const commandData = commands[interaction.commandName];

      if (!commandData) {
        await (interaction as ChatInputCommandInteraction).reply({
          content: `❌ Comando **${interaction.commandName}** não encontrado.`,
          ephemeral: true,
        });
        return;
      }

      console.log("Command data:", commandData); // Debug log

      // Verificar cooldown se o comando tem essa propriedade
      if (typeof commandData === 'object' && commandData.cooldown) {
        const remainingTime = checkCooldown(interaction.user.id, interaction.commandName, commandData.cooldown);
        
        if (remainingTime) {
          const cooldownEmbed = new EmbedBuilder()
            .setColor(0xFF6B6B)
            .setTitle("⏰ Comando em Cooldown")
            .setDescription(`Você precisa aguardar **${remainingTime} segundos** antes de usar **/${interaction.commandName}** novamente.`)
            .setAuthor({
              name: interaction.user.displayName,
              iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

          await (interaction as ChatInputCommandInteraction).reply({
            embeds: [cooldownEmbed],
            ephemeral: true
          });
          return;
        }
      }

      // Criar embed estilizado
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setAuthor({
          name: `${interaction.user.displayName} usou o comando`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      if (typeof commandData === 'string') {
        // Formato antigo (apenas string)
        embed.setDescription(commandData);
        embed.setTitle(`${interaction.commandName.toUpperCase()}`);
      } else {
        // Novo formato (objeto com propriedades)
        const commandName = interaction.commandName.toUpperCase();
        embed.setTitle(`${commandName}`);
        embed.setDescription(commandData.description);
        
        if (commandData.gif) {
          console.log("Setting GIF:", commandData.gif); // Debug log
          embed.setImage(commandData.gif);
        }

        // Definir cooldown após uso bem-sucedido
        if (commandData.cooldown) {
          setCooldown(interaction.user.id, interaction.commandName, commandData.cooldown);
          
          // Adicionar footer com informação do cooldown
          embed.setFooter({
            text: `⏱️ Cooldown: ${commandData.cooldown}s`
          });
        }
      }

      await (interaction as ChatInputCommandInteraction).reply({ 
        embeds: [embed] 
      });
    } catch (error) {
      console.error("Error in interaction:", error);
      await (interaction as ChatInputCommandInteraction).reply({
        content: "❌ Ocorreu um erro ao processar o comando.",
        ephemeral: true,
      });
    }
  });
};