const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const { keepAlive } = require('./keepalive');
const autoeat = require('mineflayer-auto-eat').plugin;
const pvp = require('mineflayer-pvp').plugin;

keepAlive();

const OWNER = 'Erick25M'; // Cambia esto a tu nombre

const bot = mineflayer.createBot({
  host: 'rabbit.fi.freemcserver.net',
  port: 30674,
  username: 'BotDunas'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(pvp);
bot.loadPlugin(autoeat);

let defaultMove;
let following = false;
let afk = false;
let mobAttack = false;
let attackMemory = {};
let hostileAttack = false;

bot.once('spawn', () => {
  const mcData = require('minecraft-data')(bot.version);
  defaultMove = new Movements(bot, mcData);
  bot.chat('✅ Bot conectado. Usa "-bot help"');
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;
  const isOp = username === OWNER;

  if (message === '-bot help') {
    bot.chat(`📜 Comandos: help, ping, seguir, calmar, comer, dormir, afk, mob, atacar <jugador> (solo OP)`);
  }

  if (message === '-bot ping') {
    bot.chat(`📶 Ping: ${bot.player.ping}ms`);
  }

  if (message === '-bot seguir') {
    const target = bot.players[username]?.entity;
    if (target) {
      bot.chat(`👣 Siguiendo a ${username}`);
      bot.pathfinder.setMovements(defaultMove);
      bot.pathfinder.setGoal(new goals.GoalFollow(target, 1), true);
    }
  }

  if (message === '-bot afk') {
    afk = true;
    bot.chat('🔄 Modo AFK activado');
    doAFK();
  }

  if (message === '-bot calmar') {
    if (!attackMemory[username]) {
      bot.chat(`✅ Te perdono, ${username}`);
    } else if (attackMemory[username].warned && !attackMemory[username].attackedOnce) {
      attackMemory[username] = null;
      bot.chat(`😐 Está bien ${username}, calmado`);
    } else {
      bot.chat(`😡 Ya me engañaste una vez, ¡Prepárate!`);
      const target = bot.players[username]?.entity;
      if (target) bot.pvp.attack(target);
    }
  }

  if (message === '-bot mob') {
    mobAttack = true;
    bot.chat('⚔️ Atacando mobs hostiles cercanos...');
  }

  if (message === '-bot dormir') {
    const bed = bot.findBlock({
      matching: block => bot.isABed(block),
      maxDistance: 5
    });
    if (bed) {
      bot.chat('😴 Intentando dormir...');
      bot.sleep(bed).catch(() => bot.chat('❌ No puedo dormir'));
    } else {
      bot.chat('❌ No hay cama cerca');
    }
  }

  if (message === '-bot comer') {
    bot.chat('🍗 Intentando comer...');
    bot.autoEat.eat().catch(() => bot.chat('❌ No tengo comida o no tengo hambre'));
  }

  if (message.startsWith('-bot atacar ') && isOp) {
    const targetName = message.split(' ')[2];
    const target = bot.players[targetName]?.entity;
    if (target) {
      bot.chat(`🎯 Atacando a ${targetName}`);
      bot.pvp.attack(target);
    } else {
      bot.chat(`❌ No encontré a ${targetName}`);
    }
  }
});

bot.on('entityHurt', (entity) => {
  if (entity === bot.entity) {
    const attacker = bot.nearestEntity(e => e.type === 'player');
    if (attacker && attacker.username !== OWNER) {
      const name = attacker.username;
      if (!attackMemory[name]) {
        attackMemory[name] = { warned: true, attackedOnce: false };
        bot.chat(`⚠️ ¡${name}, no me golpees! Una más y te ataco`);
      } else if (!attackMemory[name].attackedOnce) {
        attackMemory[name].attackedOnce = true;
        bot.chat(`😡 ¡Ahora sí, ${name}!`);
        bot.pvp.attack(attacker);
      }
    }

    // También defenderse de mobs
    const mob = bot.nearestEntity(e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 3);
    if (mob) {
      bot.pvp.attack(mob);
    }
  }
});

// Atacar mobs automáticamente
bot.on('physicsTick', () => {
  if (!mobAttack) return;
  const target = bot.nearestEntity(e =>
    e.type === 'mob' &&
    ['Zombie', 'Skeleton', 'Spider', 'Creeper', 'Husk', 'Drowned'].includes(e.mobType)
  );
  if (target) {
    bot.pvp.attack(target);
  }
});

// AFK automático
function doAFK() {
  if (!afk) return;
  bot.setControlState('jump', true);
  bot.setControlState('left', true);
  setTimeout(() => {
    bot.setControlState('jump', false);
    bot.setControlState('left', false);
    if (afk) setTimeout(doAFK, 3000);
  }, 3000);
}
