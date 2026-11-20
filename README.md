# VD Bot

Bot de Discord para organizar entrenamientos de **VD Games / Violence District**.

## Funciones
- Grupos con cupo máximo de 6 jugadores.
- Inscripción y salida de jugadores.
- Un jugador solo puede estar inscrito en un grupo a la vez.
- Apertura y cierre de inscripciones.
- Comandos administrativos protegidos por Gestionar servidor.
- Calendario publicable en un canal.
- Datos persistentes en JSON y endpoint de salud para Railway.

## Requisitos
- Node.js 22.
- Aplicación y bot en https://discord.com/developers/applications.
- Invitar el bot con los scopes `bot` y `applications.commands`.

## Variables de entorno
| Variable | Obligatoria | Descripción |
|---|---|---|
| `DISCORD_TOKEN` | Sí | Token secreto del bot. |
| `DISCORD_CLIENT_ID` | Sí | Application ID. |
| `DISCORD_GUILD_ID` | No | ID del servidor para registrar comandos instantáneamente durante pruebas. Sin ella se registran globalmente. |
| `DATA_DIR` | Recomendada | Directorio de datos; usar `/data` con un Railway Volume. |
| `PORT` | No | Railway lo proporciona. |

## Comandos de miembros
- `/ayuda`
- `/ping`
- `/grupos`
- `/inscribirme grupo:<grupo>`
- `/salir grupo:<grupo>`

## Comandos administrativos (permiso Gestionar servidor)
- `/crear-grupo nombre:<nombre> horario:<día y hora>`
- `/cerrar-grupo grupo:<grupo>`
- `/abrir-grupo grupo:<grupo>`
- `/eliminar-grupo grupo:<grupo>`
- `/publicar-grupos`

## Railway
Crear un Volume y montarlo en `/data`. Definir `DATA_DIR=/data`. Sin volumen persistente, los archivos del contenedor pueden perderse al desplegar o reemplazar la instancia.

Configurar el health check en `/health`.

## Desarrollo local
```bash
npm install
DISCORD_TOKEN=... DISCORD_CLIENT_ID=... DISCORD_GUILD_ID=... npm start
```
