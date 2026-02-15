/**
 * Bot Discord para RPG - Arquivo principal
 * 
 * Este bot permite executar comandos personalizados de RPG através de slash commands
 * Suporta múltiplos RPGs e pode buscar comandos via API ou arquivo local
 * 
 * @author José Adalberto dos Santos Neto
 * @version 1.0.0
 */

import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import ready from "./events/ready";
import interactionCreate from "./events/interactionCreate";

// Cria uma nova instância do cliente Discord com as intenções necessárias
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Configura os manipuladores de eventos
ready(client);
interactionCreate(client);

// Inicia a conexão com o Discord
client.login(process.env.DISCORD_TOKEN);