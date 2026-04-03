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

// ================= BOT =================
app.post("/bot", async (req, res) => {

  const mensaje = req.body.mensaje;

  if (!mensaje) {
    return res.json({ respuesta: "❌ Envía un mensaje válido" });
  }

  try {

    // 🔥 IMÁGENES
    if (mensaje.toLowerCase().startsWith("imagen")) {
      const prompt = mensaje.replace(/imagen/i, "").trim();

      return res.json({
        respuesta: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    // 🤖 IA LOCAL
    let reply = "";

    if (mensaje.toLowerCase().includes("hola")) {
      reply = "👋 Hola! Soy tu IA";
    }
    else if (mensaje.toLowerCase().includes("como estas")) {
      reply = "😎 Estoy activo y funcionando";
    }
    else if (mensaje.toLowerCase().includes("hora")) {
      reply = "⏰ " + new Date().toLocaleTimeString();
    }
    else {
      reply = "🤖 No entendí eso, intenta otra cosa";
    }

    return res.json({
      respuesta: reply
    });

  } catch (error) {
    console.error(error);
    return res.json({
      respuesta: "⚠ Error en el servidor"
    });
  }

});

// ================= PUERTO (FUERA DEL BOT) =================
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("🚀 Servidor corriendo en puerto " + PORT);
});
