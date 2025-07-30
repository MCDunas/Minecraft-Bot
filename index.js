const mineflayer = require('mineflayer');
const autoeat = require('mineflayer-auto-eat');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const express = require('express');
const keepAlive = require('./keepAlive');
keepAlive();

const bot = mineflayer.createBot({
  host: 'rabbit.fi.freemcserver.net',
  port: 30674,
  username: 'BotTLauncher',
  version: '1.20.1'
});

bot.loadPlugin(pathfinder);
bot.loadPlugin(autoeat);

bot.once('spawn', () => {
  console.log('🤖 El bot se ha conectado');

  const mcData = require('minecraft-data')(bot.version);
  const defaultMove = new Movements(bot, mcData);
  bot.pathfinder.setMovements(defaultMove);
});

bot.on('chat', (username, message) => {
  if (username === bot.username) return;

  if (message === '-botmc help') {
    bot.chat('Comandos disponibles: -botmc ping, -botmc come, -botmc help');
  }

  if (message === '-botmc ping') {
    const { x, y, z } = bot.entity.position;
    bot.chat(`📡 Ping: ${bot.player.ping}ms | 📍 XYZ: ${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}`);
  }

  if (message === '-botmc come') {
    const foodItem = bot.inventory.items().find(item => item.name.includes('bread') || item.name.includes('beef'));
    if (foodItem) {
      bot.equip(foodItem, 'hand').then(() => bot.consume()).then(() => {
        bot.chat('🍞 He comido algo.');
      }).catch(() => bot.chat('❌ No pude comer.'));
    } else {
      bot.chat('🚫 No tengo comida.');
    }
  }
});

// Comer automáticamente si tiene hambre
bot.on('health', () => {
  if (bot.food < 20) {
    bot.chat(`🍗 Tengo hambre. Nivel de comida: ${bot.food}/20`);
  }
});

// Detectar si está muriendo
bot.on('health', () => {
  if (bot.health < 10) {
    bot.chat(`☠️ ¡Me estoy muriendo! Vida: ${bot.health}/20`);
  }
});

// Dormir cuando hay una cama cerca y es de noche
bot.on('time', () => {
  if (!bot.isSleeping && bot.time.isNight && !bot.targetDigBlock) {
    const bed = bot.findBlock({
      matching: block => bot.isABed(block),
      maxDistance: 4
    });

    if (bed) {
      bot.chat('🛏️ Es de noche, intentaré dormir.');
      bot.sleep(bed).catch(() => {
        bot.chat('❌ No puedo dormir ahora.');
      });
    }
  }
});

// Detectar ataques
bot.on('entityHurt', (entity) => {
  if (entity === bot.entity) {
    const attacker = bot.nearestEntity(e => e.type === 'player');
    if (attacker) {
      bot.chat(`😡 ¡${attacker.username} me está atacando!`);
    }
  }
});
