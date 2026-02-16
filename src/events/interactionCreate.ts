/**
 * Manipulador avançado de eventos de interação do Discord
 * Suporta: actions, conditions, buttons, select menus, random replies, etc.
 */

import {
  Client,
  Interaction,
  EmbedBuilder,
  MessageFlags,
  ColorResolvable,
  ActionRowBuilder,
  ButtonBuilder,
  StringSelectMenuBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  TextChannel,
  GuildMember,
  ComponentType,
} from "discord.js";
import { loadCommands } from "../utils/commandLoader";
import nunjucks from "nunjucks";
import type { Action, Condition, Button, SelectMenu } from "../types/command";

// Map para armazenar cooldowns
const cooldowns = new Map<string, number>();

// Map para armazenar ações de botões e select menus
const componentActions = new Map<string, Action[]>();

/**
 * Verifica se o usuário está em cooldown
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
 * Define o cooldown
 */
function setCooldown(userId: string, commandName: string, cooldownSeconds: number): void {
  const key = `${userId}-${commandName}`;
  const cooldownTime = Date.now() + cooldownSeconds * 1000;
  cooldowns.set(key, cooldownTime);

  setTimeout(() => {
    cooldowns.delete(key);
  }, cooldownSeconds * 1000);
}

/**
 * Avalia uma condição
 */
async function evaluateCondition(condition: Condition, interaction: any): Promise<boolean> {
  switch (condition.type) {
    case "comparison":
      const val1 = Number(condition.value1);
      const val2 = Number(condition.value2);
      switch (condition.operator) {
        case "==": return val1 === val2;
        case "!=": return val1 !== val2;
        case ">": return val1 > val2;
        case "<": return val1 < val2;
        case ">=": return val1 >= val2;
        case "<=": return val1 <= val2;
        default: return false;
      }

    case "chance":
      const random = Math.random() * 100;
      return random < (condition.chance || 0);

    case "permission":
      if (!interaction.member || !(interaction.member instanceof GuildMember)) return false;
      const permissionName = condition.permission as keyof typeof PermissionFlagsBits;
      return interaction.member.permissions.has(PermissionFlagsBits[permissionName]);

    case "role":
      if (!interaction.member || !(interaction.member instanceof GuildMember)) return false;
      if (condition.roleId) {
        return interaction.member.roles.cache.has(condition.roleId);
      }
      if (condition.roleName) {
        return interaction.member.roles.cache.some((role: any) => role.name === condition.roleName);
      }
      return false;

    case "channel":
      return interaction.channelId === condition.channelId;

    case "user":
      return interaction.user.id === condition.userId;

    default:
      return true;
  }
}

/**
 * Avalia todas as condições
 */
async function evaluateConditions(conditions: Condition[] | undefined, interaction: any): Promise<boolean> {
  if (!conditions || conditions.length === 0) return true;

  for (const condition of conditions) {
    const result = await evaluateCondition(condition, interaction);
    if (!result) return false;
  }

  return true;
}

/**
 * Renderiza conteúdo com Nunjucks
 */
function renderNunjucksContent(content: string, interaction: any): string {
  if (!content) return "";
  
  const argsData = interaction.options?.data?.map((opt: any) => opt.value) || [];
  const templateContext = {
    user: {
      name: interaction.user.username,
      displayName: interaction.user.displayName,
      id: interaction.user.id,
      mention: `<@${interaction.user.id}>`,
    },
    server: {
      name: interaction.guild?.name || "DM",
    },
    random: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
    round: (num: number) => Math.round(num),
    arguments: {
      get: (index: number) => (argsData[index - 1] !== undefined ? Number(argsData[index - 1]) : -1),
    },
  };

  try {
    return nunjucks.renderString(content, templateContext);
  } catch (err) {
    console.error("Erro ao renderizar Nunjucks na action:", err);
    return content;
  }
}

/**
 * Executa uma ação
 */
async function executeAction(action: Action, interaction: any, client: Client): Promise<void> {
  // Verifica condições
  const shouldExecute = await evaluateConditions(action.conditions, interaction);
  if (!shouldExecute) return;

  // Prepara o conteúdo da mensagem e renderiza Nunjucks
  let content = renderNunjucksContent(action.content || "", interaction);
  let embed: EmbedBuilder | undefined;

  // Cria embed se necessário e renderiza Nunjucks nos textos
  if (action.embed) {
    embed = new EmbedBuilder();
    if (action.embed.title) embed.setTitle(renderNunjucksContent(action.embed.title, interaction));
    if (action.embed.description) embed.setDescription(renderNunjucksContent(action.embed.description, interaction));
    if (action.embed.color) embed.setColor(action.embed.color as ColorResolvable);
    if (action.embed.image) embed.setImage(action.embed.image);
    if (action.embed.thumbnail) embed.setThumbnail(action.embed.thumbnail);
    if (action.embed.footer) embed.setFooter({ text: renderNunjucksContent(action.embed.footer, interaction) });
  }

  // Cria componentes interativos
  const components: any[] = [];

  if (action.buttons && action.buttons.length > 0) {
    const buttonRow = new ActionRowBuilder<ButtonBuilder>();
    
    for (const btn of action.buttons) {
      const buttonBuilder = new ButtonBuilder().setLabel(btn.label);

      // Define estilo
      switch (btn.style) {
        case "Primary": buttonBuilder.setStyle(ButtonStyle.Primary); break;
        case "Secondary": buttonBuilder.setStyle(ButtonStyle.Secondary); break;
        case "Success": buttonBuilder.setStyle(ButtonStyle.Success); break;
        case "Danger": buttonBuilder.setStyle(ButtonStyle.Danger); break;
        case "Link": buttonBuilder.setStyle(ButtonStyle.Link); break;
      }

      // Define custom ID ou URL
      if (btn.style === "Link" && btn.url) {
        buttonBuilder.setURL(btn.url);
      } else {
        const customId = btn.customId || `btn_${Date.now()}_${Math.random()}`;
        buttonBuilder.setCustomId(customId);
        
        // Armazena ações do botão
        if (btn.actions) {
          componentActions.set(customId, btn.actions);
        }
      }

      // Adiciona emoji se tiver
      if (btn.emoji) {
        buttonBuilder.setEmoji(btn.emoji);
      }

      buttonRow.addComponents(buttonBuilder);
    }

    components.push(buttonRow);
  }

  if (action.selectMenu) {
    const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>();
    const selectBuilder = new StringSelectMenuBuilder()
      .setCustomId(action.selectMenu.customId)
      .setPlaceholder(action.selectMenu.placeholder || "Selecione uma opção");

    if (action.selectMenu.minValues) selectBuilder.setMinValues(action.selectMenu.minValues);
    if (action.selectMenu.maxValues) selectBuilder.setMaxValues(action.selectMenu.maxValues);

    // Adiciona opções
    for (const option of action.selectMenu.options) {
      const optionData: any = {
        label: option.label,
        value: option.value,
      };
      if (option.description) optionData.description = option.description;
      if (option.emoji) optionData.emoji = option.emoji;

      selectBuilder.addOptions(optionData);

      // Armazena ações da opção
      if (option.actions) {
        componentActions.set(`${action.selectMenu.customId}_${option.value}`, option.actions);
      }
    }

    selectRow.addComponents(selectBuilder);
    components.push(selectRow);
  }

  // Executa ação baseada no tipo
  switch (action.type) {
    case "send_message":
    case "random_reply":
      let messageContent = content;
      
      if (action.type === "random_reply" && action.messages && action.messages.length > 0) {
        const randomMessage = action.messages[Math.floor(Math.random() * action.messages.length)];
        messageContent = renderNunjucksContent(randomMessage, interaction);
      }

      const messagePayload: any = { content: messageContent };
      if (embed) messagePayload.embeds = [embed];
      if (components.length > 0) messagePayload.components = components;

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(messagePayload);
      } else {
        await interaction.reply(messagePayload);
      }
      break;

    case "send_channel":
      if (action.channelId) {
        const channel = await client.channels.fetch(action.channelId);
        if (channel && channel instanceof TextChannel) {
          const channelPayload: any = { content: content || "Mensagem automática" };
          if (embed) channelPayload.embeds = [embed];
          if (components.length > 0) channelPayload.components = components;
          
          await channel.send(channelPayload);
        }
      }
      break;

    case "send_dm":
      const targetUserId = action.userId || interaction.user.id;
      try {
        const user = await client.users.fetch(targetUserId);
        const dmPayload: any = { content: content || "Mensagem direta" };
        if (embed) dmPayload.embeds = [embed];
        if (components.length > 0) dmPayload.components = components;
        
        await user.send(dmPayload);
      } catch (error) {
        console.error("Erro ao enviar DM:", error);
      }
      break;

    case "add_role":
      if (action.roleId && interaction.member instanceof GuildMember) {
        try {
          await interaction.member.roles.add(action.roleId);
        } catch (error) {
          console.error("Erro ao adicionar role:", error);
        }
      }
      break;

    case "remove_role":
      if (action.roleId && interaction.member instanceof GuildMember) {
        try {
          await interaction.member.roles.remove(action.roleId);
        } catch (error) {
          console.error("Erro ao remover role:", error);
        }
      }
      break;

    case "timeout_user":
      if (action.duration && interaction.member instanceof GuildMember) {
        try {
          await interaction.member.timeout(action.duration * 1000, "Timeout por comando");
        } catch (error) {
          console.error("Erro ao aplicar timeout:", error);
        }
      }
      break;

    case "delete_message":
      try {
        if (interaction.message) {
          await interaction.message.delete();
        }
      } catch (error) {
        console.error("Erro ao deletar mensagem:", error);
      }
      break;
  }
}

/**
 * Configura o manipulador de eventos de interação
 */
export default (client: Client) => {
  client.on("interactionCreate", async (interaction: Interaction) => {
    // Trata slash commands
    if (interaction.isChatInputCommand()) {
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

        // Verifica cooldown
        if (typeof commandData === "object" && commandData.cooldown) {
          const remainingTime = checkCooldown(interaction.user.id, interaction.commandName, commandData.cooldown);

          if (remainingTime) {
            const cooldownEmbed = new EmbedBuilder()
              .setColor(0xff6b6b)
              .setTitle("⏰ Comando em Cooldown")
              .setDescription(`Você precisa aguardar **${remainingTime} segundos** antes de usar **/${interaction.commandName}** novamente.`)
              .setAuthor({
                name: interaction.user.displayName,
                iconURL: interaction.user.displayAvatarURL(),
              })
              .setTimestamp();

            await interaction.reply({
              embeds: [cooldownEmbed],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }

        // Cria embed base
        const embed = new EmbedBuilder();

        if (typeof commandData === "string") {
          // Formato simples
          embed.setColor(0x0099ff);
          embed.setAuthor({
            name: `${interaction.user.displayName} usou o comando`,
            iconURL: interaction.user.displayAvatarURL(),
          });
          embed.setDescription(commandData);
          embed.setTitle(`${interaction.commandName.toUpperCase()}`);
        } else {
          // Formato completo
          embed.setColor((commandData.color as ColorResolvable) || 0x0099ff);

          if (commandData.author_name) {
            embed.setAuthor({
              name: commandData.author_name,
              url: commandData.author_url || undefined,
              iconURL: commandData.author_icon || undefined,
            });
          } else {
            embed.setAuthor({
              name: `${interaction.user.displayName} usou o comando`,
              iconURL: interaction.user.displayAvatarURL(),
            });
          }

          embed.setTitle(commandData.title || `${interaction.commandName.toUpperCase()}`);

          // Renderiza descrição com Nunjucks
          const argsData = interaction.options.data.map((opt) => opt.value);
          const override = {
            withTitle: (novoTitulo: string) => {
              embed.setTitle(novoTitulo);
              return "";
            },
            withColor: (novaCor: string) => {
              embed.setColor(novaCor as ColorResolvable);
              return "";
            },
            withImage: (novaImagem: string) => {
              embed.setImage(novaImagem);
              return "";
            },
          };

          const templateContext = {
            user: {
              name: interaction.user.username,
              displayName: interaction.user.displayName,
              id: interaction.user.id,
              mention: `<@${interaction.user.id}>`,
            },
            server: {
              name: interaction.guild?.name || "DM",
            },
            random: (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min,
            round: (num: number) => Math.round(num),
            arguments: {
              get: (index: number) => (argsData[index - 1] !== undefined ? Number(argsData[index - 1]) : -1),
            },
            override: override,
          };

          try {
            let dynamicDescription = nunjucks.renderString(commandData.description, templateContext);
            dynamicDescription = dynamicDescription.replace(/^\s*[\r\n]/gm, "").trim();

            if (dynamicDescription) {
              embed.setDescription(dynamicDescription);
            } else {
              embed.setDescription(null);
            }
          } catch (err) {
            console.error("Erro ao renderizar template:", err);
            embed.setDescription(commandData.description);
          }

          if (commandData.gif) embed.setImage(commandData.gif);
          if (commandData.thumbnail_url) embed.setThumbnail(commandData.thumbnail_url);

          let footerText = commandData.footer_text || "";
          if (commandData.cooldown) {
            setCooldown(interaction.user.id, interaction.commandName, commandData.cooldown);
            if (footerText) {
              footerText += ` | ⏱️ Cooldown: ${commandData.cooldown}s`;
            } else {
              footerText = `⏱️ Cooldown: ${commandData.cooldown}s`;
            }
          }
          if (footerText) embed.setFooter({ text: footerText });

          // Executa actions se existirem
          if (commandData.actions && commandData.actions.length > 0) {
            await interaction.deferReply();
            
            for (const action of commandData.actions) {
              await executeAction(action, interaction, client);
            }
            
            // Só envia embed principal se tiver descrição com conteúdo real
            // ou se não for apenas um placeholder
            const hasRealDescription = commandData.description && 
                                      commandData.description.trim() !== "" &&
                                      !commandData.description.startsWith("Comando ");
            
            if (!interaction.replied && hasRealDescription) {
              await interaction.editReply({ embeds: [embed] });
            } else if (!interaction.replied) {
              // Se não tiver descrição e nenhuma action respondeu, envia confirmação silenciosa
              await interaction.editReply({ content: "✅", embeds: [] });
            }
            return;
          }
        }

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error("Error in interaction:", error);
        await interaction.reply({
          content: "❌ Ocorreu um erro ao processar o comando.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }

    // Trata button clicks
    if (interaction.isButton()) {
      const actions = componentActions.get(interaction.customId);
      if (actions) {
        await interaction.deferReply();
        for (const action of actions) {
          await executeAction(action, interaction, client);
        }
      }
    }

    // Trata select menu
    if (interaction.isStringSelectMenu()) {
      const selectedValues = interaction.values;
      for (const value of selectedValues) {
        const actions = componentActions.get(`${interaction.customId}_${value}`);
        if (actions) {
          await interaction.deferReply();
          for (const action of actions) {
            await executeAction(action, interaction, client);
          }
        }
      }
    }
  });
};