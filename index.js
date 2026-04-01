const express = require('express');
const fs = require('fs');

const app = express();
app.use(express.json());

// ================= BASE DE DATOS =================
let users = {};

if (fs.existsSync('./users.json')) {
  users = JSON.parse(fs.readFileSync('./users.json'));
}

function saveUsers() {
  fs.writeFileSync('./users.json', JSON.stringify(users, null, 2));
}

// ================= RUTA TEST =================
app.get('/', (req, res) => {
  res.send("🚀 BOT ACTIVO");
});

// ================= BOT PRINCIPAL =================
app.post('/bot', (req, res) => {

  const mensaje = req.body.mensaje?.toLowerCase();
  const userId = req.body.userId || "anonimo";

  if (!mensaje) {
    return res.json({ respuesta: "❌ Envía un mensaje válido" });
  }

  // ===== CREAR USUARIO =====
  if (!users[userId]) {
    users[userId] = { xp: 0, level: 1 };
  }

  const user = users[userId];

  // ===== XP Y NIVELES =====
  user.xp += 10;

  if (user.xp >= user.level * 100) {
    user.level++;
  }

  saveUsers();

  // ================= COMANDOS =================

  // SALUDO
  if (mensaje === "hola") {
    return res.json({
      respuesta: `👋 Hola! Nivel ${user.level}`
    });
  }

  // NIVEL
  if (mensaje === "nivel") {
    return res.json({
      respuesta: `📊 Nivel ${user.level} | XP ${user.xp}`
    });
  }

  // IMAGEN IA
  if (mensaje.startsWith("imagen")) {
    const prompt = mensaje.replace("imagen ", "");

    return res.json({
      respuesta: `🎨 ${prompt}`,
      imagen: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
    });
  }

  // RESPUESTA RANDOM
  const respuestas = [
    "😎 Todo chill",
    "🤖 No entendí bien",
    "🔥 Eso suena interesante",
    "💭 Explícame más",
    "👀 Estoy pensando..."
  ];

  const random = respuestas[Math.floor(Math.random() * respuestas.length)];

  return res.json({
    respuesta: random,
    nivel: user.level
  });

});

// ================= SERVIDOR =================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🔥 API corriendo en puerto ${PORT}`);
});
