// Entry point — wired up in full implementation phase
const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
