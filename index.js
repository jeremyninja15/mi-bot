const express = require('express');
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, PermissionFlagsBits, REST, Routes, SlashCommandBuilder } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID || null;
const PORT = Number(process.env.PORT || 8080);
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'vd-bot-data.json');
const MAX_MEMBERS = 6;
if (!TOKEN || !CLIENT_ID) { console.error('Faltan DISCORD_TOKEN y DISCORD_CLIENT_ID.'); process.exit(1); }

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, JSON.stringify({ nextGroupId: 1, groups: [] }, null, 2));
}
function loadStore() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  return { nextGroupId: Number(data.nextGroupId) || 1, groups: Array.isArray(data.groups) ? data.groups : [] };
}
let store = loadStore();
function saveStore() {
  ensureStore();
  const temp = DATA_FILE + '.tmp';
  fs.writeFileSync(temp, JSON.stringify(store, null, 2));
  fs.renameSync(temp, DATA_FILE);
}
function isAdmin(i) { return i.memberPermissions && (i.memberPermissions.has(PermissionFlagsBits.ManageGuild) || i.memberPermissions.has(PermissionFlagsBits.Administrator)); }
function findGroup(value) {
  const v = String(value || '').trim().toLowerCase();
  return store.groups.find(g => g.id.toLowerCase() === v || g.name.toLowerCase() === v);
}
function label(g) { return '**' + g.id + ' · ' + g.name + '** — ' + g.schedule + ' — ' + g.members.length + '/' + MAX_MEMBERS + ' — ' + (g.open ? '🟢 Abierto' : '🔒 Cerrado'); }
function choices(query) {
  const q = String(query || '').toLowerCase();
  return store.groups.filter(g => g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)).slice(0, 25).map(g => ({ name: (g.id + ' · ' + g.name + ' (' + g.members.length + '/6)').slice(0, 100), value: g.id }));
}

const commands = [
  new SlashCommandBuilder().setName('ayuda').setDescription('Muestra cómo usar VD Bot.'),
  new SlashCommandBuilder().setName('ping').setDescription('Comprueba si VD Bot está funcionando.'),
  new SlashCommandBuilder().setName('grupos').setDescription('Muestra los grupos y sus cupos.'),
  new SlashCommandBuilder().setName('inscribirme').setDescription('Inscríbete en un grupo.').addStringOption(o => o.setName('grupo').setDescription('Grupo').setRequired(true).setAutocomplete(true)),
  new SlashCommandBuilder().setName('salir').setDescription('Sal de un grupo.').addStringOption(o => o.setName('grupo').setDescription('Grupo').setRequired(true).setAutocomplete(true)),
  new SlashCommandBuilder().setName('crear-grupo').setDescription('Crea un grupo de hasta 6 jugadores.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o => o.setName('nombre').setDescription('Nombre del grupo').setRequired(true).setMaxLength(40)).addStringOption(o => o.setName('horario').setDescription('Día y hora').setRequired(true).setMaxLength(80)),
  new SlashCommandBuilder().setName('cerrar-grupo').setDescription('Cierra las inscripciones.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o => o.setName('grupo').setDescription('Grupo').setRequired(true).setAutocomplete(true)),
  new SlashCommandBuilder().setName('abrir-grupo').setDescription('Abre las inscripciones.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o => o.setName('grupo').setDescription('Grupo').setRequired(true).setAutocomplete(true)),
  new SlashCommandBuilder().setName('eliminar-grupo').setDescription('Elimina un grupo.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild).addStringOption(o => o.setName('grupo').setDescription('Grupo').setRequired(true).setAutocomplete(true)),
  new SlashCommandBuilder().setName('publicar-grupos').setDescription('Publica el calendario en este canal.').setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map(c => c.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  const route = GUILD_ID ? Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID) : Routes.applicationCommands(CLIENT_ID);
  await rest.put(route, { body: commands });
  console.log('Comandos slash registrados.');
}
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.once(Events.ClientReady, c => console.log('VD Bot conectado como ' + c.user.tag + '.'));

client.on(Events.InteractionCreate, async i => {
  try {
    if (i.isAutocomplete()) {
      if (['inscribirme', 'salir', 'cerrar-grupo', 'abrir-grupo', 'eliminar-grupo'].includes(i.commandName)) await i.respond(choices(i.options.getFocused()));
      return;
    }
    if (!i.isChatInputCommand()) return;
    const cmd = i.commandName;
    if (cmd === 'ping') return i.reply({ content: '🏓 VD Bot activo · ' + client.ws.ping + ' ms', ephemeral: true });
    if (cmd === 'ayuda') return i.reply({ ephemeral: true, content: '**VD BOT · COMANDOS**\n/grupos — ver grupos\n/inscribirme — entrar a un grupo\n/salir — abandonar un grupo\n/ping — comprobar el bot\n\n**Administración (Gestionar servidor):**\n/crear-grupo, /cerrar-grupo, /abrir-grupo, /eliminar-grupo y /publicar-grupos.' });
    if (cmd === 'grupos') {
      const body = store.groups.length ? store.groups.map(label).join('\n') : 'Todavía no hay grupos creados.';
      return i.reply({ content: '**VD GAMES · ENTRENAMIENTOS**\n\n' + body, ephemeral: true });
    }
    if (cmd === 'inscribirme') {
      const g = findGroup(i.options.getString('grupo', true));
      if (!g) return i.reply({ content: 'No encontré ese grupo. Usa /grupos.', ephemeral: true });
      if (!g.open) return i.reply({ content: 'Las inscripciones están cerradas.', ephemeral: true });
      if (g.members.some(m => m.userId === i.user.id)) return i.reply({ content: 'Ya estás inscrito en ese grupo.', ephemeral: true });
      const existing = store.groups.find(x => x.members.some(m => m.userId === i.user.id));
      if (existing) return i.reply({ content: 'Ya estás inscrito en ' + existing.name + '. Sal de ese grupo primero.', ephemeral: true });
      if (g.members.length >= MAX_MEMBERS) return i.reply({ content: 'Ese grupo ya completó sus 6 cupos.', ephemeral: true });
      g.members.push({ userId: i.user.id, username: i.user.username, joinedAt: new Date().toISOString() });
      saveStore();
      return i.reply({ content: '✅ Inscripción confirmada en **' + g.name + '**. Cupos: ' + g.members.length + '/6.', ephemeral: true });
    }
    if (cmd === 'salir') {
      const g = findGroup(i.options.getString('grupo', true));
      if (!g) return i.reply({ content: 'No encontré ese grupo.', ephemeral: true });
      const before = g.members.length;
      g.members = g.members.filter(m => m.userId !== i.user.id);
      if (g.members.length === before) return i.reply({ content: 'No estás inscrito en ese grupo.', ephemeral: true });
      saveStore();
      return i.reply({ content: 'Has salido de **' + g.name + '**. Cupos: ' + g.members.length + '/6.', ephemeral: true });
    }
    if (!isAdmin(i)) return i.reply({ content: 'Necesitas el permiso Gestionar servidor.', ephemeral: true });
    if (cmd === 'crear-grupo') {
      const name = i.options.getString('nombre', true).trim();
      const schedule = i.options.getString('horario', true).trim();
      if (store.groups.some(g => g.name.toLowerCase() === name.toLowerCase())) return i.reply({ content: 'Ya existe un grupo con ese nombre.', ephemeral: true });
      const g = { id: 'G' + String(store.nextGroupId++).padStart(3, '0'), name, schedule, open: true, members: [], createdAt: new Date().toISOString() };
      store.groups.push(g); saveStore();
      return i.reply({ content: '✅ Grupo creado: ' + label(g), ephemeral: true });
    }
    if (['cerrar-grupo', 'abrir-grupo', 'eliminar-grupo'].includes(cmd)) {
      const g = findGroup(i.options.getString('grupo', true));
      if (!g) return i.reply({ content: 'No encontré ese grupo.', ephemeral: true });
      if (cmd === 'eliminar-grupo') { store.groups = store.groups.filter(x => x.id !== g.id); saveStore(); return i.reply({ content: '🗑️ Grupo ' + g.name + ' eliminado.', ephemeral: true }); }
      g.open = cmd === 'abrir-grupo'; saveStore();
      return i.reply({ content: (g.open ? '🟢 Inscripciones abiertas para ' : '🔒 Inscripciones cerradas para ') + '**' + g.name + '**.', ephemeral: true });
    }
    if (cmd === 'publicar-grupos') {
      const body = store.groups.length ? store.groups.map(label).join('\n') : 'Todavía no hay grupos programados.';
      return i.reply({ content: '**VD GAMES · CALENDARIO DE ENTRENAMIENTOS**\n\n' + body + '\n\nUsa /inscribirme para reservar un cupo. Máximo 6 jugadores por grupo.\n**Aprende. Practica. Domina.**', allowedMentions: { parse: [] } });
    }
  } catch (error) {
    console.error('Error procesando interacción:', error);
    if (i.isRepliable()) { const msg = 'Ocurrió un error al procesar el comando.'; if (i.deferred || i.replied) await i.followUp({ content: msg, ephemeral: true }).catch(() => {}); else await i.reply({ content: msg, ephemeral: true }).catch(() => {}); }
  }
});

const app = express();
app.get('/', (_req, res) => res.status(200).send('VD Bot is running.'));
app.get('/health', (_req, res) => res.status(200).json({ ok: true, botReady: client.isReady(), bot: 'VD Bot', groups: store.groups.length }));
app.listen(PORT, '0.0.0.0', () => console.log('Health server escuchando en ' + PORT + '.'));
(async () => { try { await registerCommands(); await client.login(TOKEN); } catch (error) { console.error('No se pudo iniciar VD Bot:', error); process.exit(1); } })();
process.on('SIGTERM', () => { console.log('Cerrando VD Bot...'); client.destroy(); process.exit(0); });
