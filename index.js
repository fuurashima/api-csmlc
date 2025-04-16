require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === process.env.ADMIN_USER && pass === process.env.ADMIN_PASS) {
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '2h' });
    return res.json({ token });
  }
  res.status(401).json({ message: 'Credenciales inválidas' });
});

app.use((req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ message: 'Token inválido' });
  }
});

app.post('/api/alumnos', async (req, res) => {
  const { nombre_alumno, curso, nombre_apoderado, telefono_apoderado, email_apoderado, medio_conocimiento } = req.body;
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(`INSERT INTO alumnos (nombre_alumno, curso, nombre_apoderado, telefono_apoderado, email_apoderado, medio_conocimiento) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_alumno, curso, nombre_apoderado, telefono_apoderado, email_apoderado, medio_conocimiento]);
    await connection.end();
    res.json({ message: 'Alumno registrado correctamente.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar alumno.' });
  }
});

app.get('/api/estadisticas', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(`SELECT curso, estado_matricula, COUNT(*) as total FROM alumnos GROUP BY curso, estado_matricula`);
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas.' });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log('Servidor corriendo...');
});
