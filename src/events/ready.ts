import { Client } from "discord.js";

/**
 * Configura o evento 'ready' do cliente Discord
 * Este evento é disparado quando o bot se conecta com sucesso ao Discord
 * @param client - Instância do cliente Discord.js
 */
export default (client: Client) => {
  client.once("ready", () => {
    console.log(`🤖 Logged in as ${client.user?.tag}!`);
  });
};