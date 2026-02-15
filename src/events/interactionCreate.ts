/**
 * Manipulador de eventos de interação do Discord
 * * Este módulo processa slash commands e responde com embeds estilizados
 * contendo informações sobre comandos de RPG, incluindo GIFs quando disponíveis
 */

import { Client, Interaction, EmbedBuilder, MessageFlags, ColorResolvable } from "discord.js";
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
        await interaction.reply({
          content: `❌ Comando **${interaction.commandName}** não encontrado.`,
          flags: MessageFlags.Ephemeral,
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

          await interaction.reply({
            embeds: [cooldownEmbed],
            flags: MessageFlags.Ephemeral
          });
          return;
        }
      }

      // Criar embed estilizado base
      const embed = new EmbedBuilder();

      if (typeof commandData === 'string') {
        // Formato antigo (apenas string)
        embed.setColor(0x0099FF);
        embed.setAuthor({
          name: `${interaction.user.displayName} usou o comando`,
          iconURL: interaction.user.displayAvatarURL(),
        });
        embed.setDescription(commandData);
        embed.setTitle(`${interaction.commandName.toUpperCase()}`);
        
      } else {
        // Novo formato (objeto com propriedades avançadas do Dashboard)
        
        // 1. Aplicar Cor (Se não tiver, usa azul padrão)
        embed.setColor((commandData.color as ColorResolvable) || 0x0099FF);

        // 2. Aplicar Autor
        if (commandData.author_name) {
          embed.setAuthor({
            name: commandData.author_name,
            url: commandData.author_url || undefined,
            iconURL: commandData.author_icon || undefined,
          });
        } else {
          // Se não definiu um autor fixo no painel, usa quem digitou o comando
          embed.setAuthor({
            name: `${interaction.user.displayName} usou o comando`,
            iconURL: interaction.user.displayAvatarURL(),
          });
        }

        // 3. Aplicar Título e Descrição
        embed.setTitle(commandData.title || `${interaction.commandName.toUpperCase()}`);
        embed.setDescription(commandData.description);
        
        // 4. Aplicar Imagens (GIF principal e Miniatura)
        if (commandData.gif) {
          console.log("Setting GIF:", commandData.gif); // Debug log
          embed.setImage(commandData.gif);
        }
        if (commandData.thumbnail_url) {
          embed.setThumbnail(commandData.thumbnail_url);
        }

        // 5. Aplicar Rodapé e registrar Cooldown
        let footerText = commandData.footer_text || "";
        
        if (commandData.cooldown) {
          setCooldown(interaction.user.id, interaction.commandName, commandData.cooldown);
          
          if (footerText) {
            footerText += ` | ⏱️ Cooldown: ${commandData.cooldown}s`;
          } else {
            footerText = `⏱️ Cooldown: ${commandData.cooldown}s`;
          }
        }

        if (footerText) {
          embed.setFooter({ text: footerText });
        }
      }

      await interaction.reply({ 
        embeds: [embed] 
      });
      
    } catch (error) {
      console.error("Error in interaction:", error);
      await interaction.reply({
        content: "❌ Ocorreu um erro ao processar o comando.",
        flags: MessageFlags.Ephemeral,
      });
    }
  });
};
