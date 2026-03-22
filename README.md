# 🏆 Arena e-Sports: Plataforma de Torneos y Eventos (Pokémon)

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MySQL](https://img.shields.io/badge/MySQL-00000F?style=for-the-badge&logo=mysql&logoColor=white)

Una plataforma *Full-Stack* diseñada para la gestión, administración y automatización de competiciones de e-sports, con integración nativa para batallas de **Pokémon Showdown**.

---

## ✨ Características Principales

### ⚔️ Motor de Torneos Avanzado
- **Brackets Automáticos:** Generación automática de árboles de **doble eliminación** (Ganadores, Perdedores y Gran Final).
- **Formatos Dinámicos:** Soporte para modalidades **1v1 y 2v2**, incluyendo un sistema de emparejamiento aleatorio (Random 2v2).
- **Series BO3 / BO5:** Despliegue de rondas individuales dentro de una misma partida.

### 🛡️ Visor y Validación Anti-Trampas
- **Showdown Replay Log:** Los jugadores deben subir el log RAW de su combate.
- **Análisis de Equipos:** El sistema cruza el *Paste* del equipo registrado con los Pokémon utilizados realmente en el log para detectar discrepancias en movimientos, habilidades y objetos.
- **Visor Integrado:** Reproductor de combates incrustado directamente en la plataforma.

### 🎁 Sistema de Misiones y Recompensas
- **Misiones Diarias/Globales:** Los usuarios pueden reclamar misiones que los administradores validarán posteriormente.
- **Bonus Dinámicos:** Los Eventos activos pueden otorgar multiplicadores de puntos a toda la plataforma.

### 👑 Panel de Administración Completo
- Gestión absoluta de usuarios, eventos, torneos y enfrentamientos.
- Resolución de disputas y capacidad de **forzar resultados** en los brackets en caso de incomparecencia (Bye).

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** React (Hooks, Context, estilos dinámicos modulares por temas).
- **Backend:** Node.js con Express.
- **Base de Datos:** MySQL (con `mysql2` para consultas basadas en promesas).
- **Otros:** Procesamiento de archivos `.txt/.log` y *parsing* de datos tácticos.

---

## 🚀 Despliegue en Local (Localhost)

Para correr este proyecto en tu propia máquina, sigue estos pasos:

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/Demonstrada/tpf.git](https://github.com/Demonstrada/tpf.git)
   ```

2. **Base de Datos:**
   - Importa el archivo de tu base de datos en tu gestor SQL local (ej. phpMyAdmin / XAMPP).
   - Asegúrate de tener las credenciales correctas en tu archivo del servidor (`server.js`).

3. **Instalar dependencias y arrancar:**
   ```bash
   # Instalar dependencias del Backend y Frontend
   npm install
   
   # Arrancar el servidor backend (normalmente en el puerto 5000)
   node server.js
   
   # Arrancar el frontend (en otra terminal)
   npm start
   ```

---

## 🌐 Preparado para la Nube
Este proyecto está estructurado para ser desplegado de forma gratuita dividiendo sus servicios:
- **Frontend:** Listo para `Vercel` o `Netlify`.
- **Backend:** Listo para `Render.com` o `Railway` (Actualmente fuera de este repositorio).
- **Base de datos:** Compatible con servicios en la nube como `Aiven` (No forma parte de este proyecto).

*Creado con pasión para la comunidad competitiva.* 🎮
