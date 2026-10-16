require("dotenv").config();

const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const url = process.env.MONGODB_URL;
const dbName = process.env.DB_NAME;
const colzlectionName = process.env.DB_COLLECTION;
const port = process.env.PORT || 3000;
const client = new MongoClient(url);

const app = express();

// Permite que o Express leia o corpo (body) das requisições em formato JSON
app.use(express.json());

async function startServer() {
    try {
        await client.connect();
        console.log("Conectado ao MongoDB com sucesso!");

        const db = client.db(dbName);
        const collection = db.collection(collectionName);

        // 1. Rota para buscar TODOS os heróis
        app.get("/herois", async function (req, res) {
            try {
                const itens = await collection.find().toArray();
                res.status(200).send(itens);
            } catch (error) {
                res.status(500).send({ erro: "Falha ao buscar a lista de heróis" });
            }
        });

        // 2. Rota para buscar APENAS UM herói pelo ID
        app.get("/herois/:id", async function (req, res) {
            try {
                const id = req.params.id.trim();

                // Converte a string do ID para o tipo ObjectId do MongoDB
                const item = await collection.findOne({ _id: new ObjectId(id) });

                if (!item) {
                    return res.status(404).send({ erro: "Herói não encontrado." });
                }

                // Retorna apenas o herói encontrado
                res.status(200).send(item);
            } catch (error) {
                res.status(400).send({ erro: "ID informado é inválido." });
            }
        });

        // 3. Rota para CRIAR um novo herói
        app.post("/herois", async function (req, res) {
            try {
                const item = req.body;

                if (!item || Object.keys(item).length === 0) {
                    return res.status(400).send({ erro: "O corpo da requisição não pode estar vazio." });
                }

                await collection.insertOne(item);
                res.status(201).send(item);
            } catch (error) {
                res.status(500).send({ erro: "Falha ao cadastrar o herói." });
            }
        });

        // ROTA PUT - ATUALIZAR UM HERÓI POR ID
        app.put("/herois/:id", async function (req, res) {
            try {
                const id = req.params.id.trim(); // Remove espaços acidentais
                const item = req.body;

                // Valida se o ID tem o formato de 24 carateres do MongoDB
                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ erro: "ID com formato inválido." });
                }

                // Valida se foi enviado algum dado no corpo do pedido
                if (!item || Object.keys(item).length === 0) {
                    return res.status(400).send({ erro: "O corpo do pedido não pode estar vazio." });
                }

                const result = await collection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: item }
                );

                // Verifica se encontrou algum registo com esse ID
                if (result.matchedCount === 0) {
                    return res.status(404).send({ erro: "Herói não encontrado para atualizar." });
                }

                res.status(200).send({ mensagem: "Herói atualizado com sucesso!", item });
            } catch (error) {
                console.error("Erro no PUT /herois/:id:", error);
                res.status(500).send({ erro: "Falha interna ao atualizar o herói." });
            }
        });

        // ROTA DELETE - REMOVER UM HERÓI POR ID
        app.delete("/herois/:id", async function (req, res) {
            try {
                const id = req.params.id.trim();

                if (!ObjectId.isValid(id)) {
                    return res.status(400).send({ erro: "ID com formato inválido." });
                }

                const result = await collection.deleteOne({ _id: new ObjectId(id) });

                // Verifica se algum registo foi efetivamente eliminado
                if (result.deletedCount === 0) {
                    return res.status(404).send({ erro: "Herói não encontrado para remover." });
                }

                res.status(200).send({ mensagem: "Item removido com sucesso!" });
            } catch (error) {
                console.error("Erro no DELETE /herois/:id:", error);
                res.status(500).send({ erro: "Falha interna ao remover o herói." });
            }
        });

        app.listen(port, () => {
            console.log(`Servidor rodando em ${port}`);
        });

    } catch (err) {
        console.error("Erro ao iniciar o servidor:", err);
    }
}

startServer();

async function disconectMongolDB() {
    await client.close();
    console.log("Desconectado do MongoDB.");
}