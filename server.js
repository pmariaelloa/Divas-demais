const express = require('express');
const path = require('path');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
app.use(express.static(__dirname));
app.use(express.json()); // Needed for POST requests

// MongoDB Setup
const uri = "mongodb+srv://pmariaelloa:PAnXa932GFfHRq8i@cluster0.zibpgxb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to DB before starting the server
async function connectToDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
  }
}

const db = client.db("divademais");
const usuarioCollection = db.collection("usuario");

// Serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
app.delete('/usuario/:username', async (req, res) => {
    const username = req.params.username;
  
    try {
      const result = await usuarioCollection.deleteOne({ username: username });
  
      if (result.deletedCount === 0) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
  
      res.json({ message: "Usuário removido com sucesso" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao deletar usuário", details: err });
    }
  });
// GET /usuario/:username - Get user by username
app.get('/usuario/:username', async (req, res) => {
  const username = req.params.username;

  try {
    const user = await usuarioCollection.findOne({ username: username });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
});
app.get('/usuarios', async (req, res) => {
    try {
      const users = await usuarioCollection.find({}).toArray();
      res.json(users);
    } catch (err) {
      res.status(500).json({ error: "Database error", details: err });
    }
  });
// POST /usuario - Create new user
app.post('/usuario', async (req, res) => {
  const newUser = req.body;

  if (!newUser.username) {
    return res.status(400).json({ error: "Missing 'username' field" });
  }

  try {
    const existing = await usuarioCollection.findOne({ username: newUser.username });
    if (existing) {
      return res.status(409).json({ error: "User already exists" });
    }

    const result = await usuarioCollection.insertOne(newUser);
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
});

// Start server after DB connection
const PORT = 8080;
connectToDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor Rodando na porta ${PORT}`);
  });
});
