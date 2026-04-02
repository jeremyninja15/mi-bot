const express = require('express');
const axios = require("axios");
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
app.post("/bot", async (req, res) => {

  const mensaje = req.body.mensaje;

  if (!mensaje) {
    return res.json({ respuesta: "❌ Envía un mensaje válido" });
  }

  try {

    // 🔥 IMÁGENES
    if (mensaje.startsWith("imagen")) {
      const prompt = mensaje.replace("imagen", "").trim();

      return res.json({
        respuesta: `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`
      });
    }

    // 🤖 IA GRATIS
    const response = await axios.get(
      `https://api.affiliateplus.xyz/api/chatbot?message=${encodeURIComponent(mensaje)}&botname=NoAdsAI&ownername=Tu`
    );

    const reply = response.data.message;

    return res.json({
      respuesta: reply
    });

  } catch (error) {
    console.error(error);

    return res.json({
      respuesta: "⚠ Error con la IA"
    });
  }
});
