// discordBot.js
const { Client, GatewayIntentBits } = require('discord.js');
const mcServerIP = 'rabbit.fi.freemcserver.net';
const mcPort = 30674;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
  console.log(`✅ Bot de Discord conectado como ${client.user.tag}`);
});

client.on('messageCreate', async (msg) => {
  if (!msg.content.startsWith('!mc')) return;

  const args = msg.content.slice(3).trim().split(/ +/);
  const command = args.shift()?.toLowerCase();

  if (command === 'info') {
    const util = require('minecraft-server-util');

    try {
      const status = await util.status(mcServerIP, mcPort);
      msg.channel.send({
        content: `🟢 **Servidor activo**\n**IP:** ${mcServerIP}\n**Puerto:** ${mcPort}\n**Jugadores:** ${status.players.online}/${status.players.max}\n🕒 Uptime estimado: ${status.roundTripLatency}ms`
      });
    } catch (err) {
      msg.channel.send('🔴 El servidor parece estar apagado.');
    }
  }
});

client.login('AQUÍ_PONES_TU_TOKEN_DIRECTAMENTE'); // sin .env
