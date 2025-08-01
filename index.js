const mineflayer = require('mineflayer');
const keepAlive = require('./keepalive');

const bot = mineflayer.createBot({
  host: 'rabbit.fi.freemcserver.net',
  port: 30674,
  username: 'BotDunas',
  version: '1.20.1'
});

keepAlive();

let isAFK = false;
let afkInterval;
let attacker = null;
let warnedPlayers = {};
const OWNER = 'Erick25M';

bot.once('spawn', () => {
  console.log('✅ Bot conectado como BotDunas');
});

// ========== COMANDOS ==========
bot.on('chat', (username, message) => {
  if (username === bot.username || !message.startsWith('-bot')) return;

  const args = message.slice(4).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch (command) {
    case 'ping':
      bot.chat('Pong!');
      break;

    case 'help':
      bot.chat('Comandos: ping, help, comer, dormir, calmar, seguir, parar, afk, mob, atacar <jugador>');
      break;

    case 'comer':
      bot.chat('Intentando comer...');
      eatFood();
      break;

    case 'dormir':
      const bed = bot.findBlock({
        matching: block => bot.isABed(block),
        maxDistance: 6
      });
      if (bed) {
        bot.sleep(bed).catch(err => bot.chat(`Error al dormir: ${err.message}`));
      } else {
        bot.chat('No encontré una cama cerca.');
      }
      break;

    case 'calmar':
      if (warnedPlayers[username]) {
        if (warnedPlayers[username] > 3) {
          bot.chat(`${username}, no me engañes. ¡Ahora te atacaré!`);
          attackPlayer(username);
        } else {
          warnedPlayers[username] = 0;
          bot.chat(`${username} se ha calmado.`);
        }
      }
      break;

    case 'afk':
      toggleAFK();
      break;

    case 'seguir':
      const target = bot.players[username]?.entity;
      if (target) {
        bot.chat('Te seguiré.');
        followEntity(target);
      } else {
        bot.chat('No te veo.');
      }
      break;

    case 'parar':
      bot.clearControlStates();
      bot.chat('Me detengo.');
      break;

    case 'mob':
      bot.chat('Atacaré mobs hostiles automáticamente.');
      setInterval(() => {
        const target = bot.nearestEntity(entity => isHostileMob(entity));
        if (target) attackEntity(target);
      }, 3000);
      break;

    case 'atacar':
      if (username !== OWNER) {
        bot.chat('No tienes permiso para usar este comando.');
        return;
      }
      const playerName = args[0];
      if (!playerName) return bot.chat('Debes especificar un jugador.');
      const targetPlayer = bot.players[playerName]?.entity;
      if (targetPlayer) {
        bot.chat(`Atacando a ${playerName}`);
        attackEntity(targetPlayer);
      } else {
        bot.chat('No encuentro a ese jugador.');
      }
      break;

    default:
      bot.chat('Comando no reconocido.');
  }
});

// ========== FUNCIONES ==========
function toggleAFK() {
  if (isAFK) {
    clearInterval(afkInterval);
    bot.clearControlStates();
    isAFK = false;
    bot.chat('Modo AFK desactivado.');
  } else {
    isAFK = true;
    bot.chat('Modo AFK activado.');
    afkInterval = setInterval(() => {
      bot.setControlState('jump', true);
      bot.setControlState('left', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
        bot.setControlState('left', false);
      }, 1000);
    }, 3000);
  }
}

function eatFood() {
  const food = bot.inventory.items().find(item => item.name.includes('bread') || item.name.includes('apple'));
  if (food) {
    bot.equip(food, 'hand').then(() => bot.consume()).catch(err => bot.chat('Error al comer: ' + err.message));
  } else {
    bot.chat('No tengo comida.');
  }
}

function attackEntity(entity) {
  bot.lookAt(entity.position.offset(0, entity.height, 0));
  bot.attack(entity);
}

function attackPlayer(playerName) {
  const target = bot.players[playerName]?.entity;
  if (target) attackEntity(target);
}

function isHostileMob(entity) {
  return entity.type === 'mob' &&
    !['Villager', 'Armor Stand', 'Bat'].includes(entity.name);
}

function followEntity(entity) {
  const interval = setInterval(() => {
    if (!entity.isValid) {
      clearInterval(interval);
      return bot.chat('Dejé de seguir porque desapareciste.');
    }
    const pos = entity.position;
    bot.lookAt(pos.offset(0, entity.height, 0));
    bot.setControlState('forward', true);
  }, 1000);
}

// ========== DEFENSA ==========
bot.on('entityHurt', entity => {
  if (entity === bot.entity && attacker) {
    const name = attacker.username;
    if (!warnedPlayers[name]) {
      warnedPlayers[name] = 1;
      bot.chat(`${name}, no me ataques.`);
    } else if (warnedPlayers[name] === 1) {
      warnedPlayers[name]++;
      bot.chat(`${name}, te lo advierto...`);
    } else {
      bot.chat(`${name}, ahora me defiendo.`);
      attackPlayer(name);
    }
  }
});

bot.on('attacked', (data) => {
  attacker = data.attacker;
});

require('./discordBot');

