import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import cripto from './criptografia.js';
import trataArquivos from './trataArquivos.js';

const app = express();
app.use(bodyParser.json()); // Para interpretar JSON
app.use(bodyParser.text()); // Adicionado para aceitar payloads como texto
app.use(bodyParser.urlencoded({ extended: true })); // Para interpretar dados de formulário

const PORT = 3001;

// Middleware para habilitar CORS
app.use(cors({
    origin: 'http://127.0.0.1:5501',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'tokensession'],  // Cabeçalhos permitidos, incluindo o 'session'
    credentials: true,  // Permite o envio de cookies e cabeçalhos personalizados
}));

// Middleware para lidar com JSON no corpo da requisição
app.use(express.json());

// Rota para criar um novo usuário (CREATE)
app.post('/usuarios', (req, res) => {
    const { nome, cpf, usuario, senha } = req.body;

    // Verifica se o ID já existe
    if (trataArquivos.arquivoUsuarios.find(usuario => usuario.cpf === cpf)) {
        return res.status(400).json({ error: 'Usuário com este ID já existe!' });
    }

    trataArquivos.updateJsonFile(req.body);
    trataArquivos.refreshUsuarios()
    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: { nome, cpf, usuario, senha } });
});

// Rota para listar todos os usuários (READ)
app.get('/usuarios', (req, res) => {
    trataArquivos.refreshUsuarios()
    res.json(trataArquivos.arquivoUsuarios);
});

// Rota para obter um usuário específico pelo ID (READ)
app.get('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuario = trataArquivos.arquivoUsuarios.find(usuario => usuario.cpf === parseInt(cpf));

    if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    res.json(usuario);
});

// Rota para atualizar um usuário pelo ID (UPDATE)
app.put('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const { nome, usuario, senha } = req.body;

    const usuarioIndex = trataArquivos.arquivoUsuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    // Atualiza o usuário
    trataArquivos.arquivoUsuarios[usuarioIndex] = { cpf: parseInt(cpf), nome, usuario, senha };
    res.json({ message: 'Usuário atualizado com sucesso!', usuario: trataArquivos.arquivoUsuarios[usuarioIndex] });
});

// Rota para excluir um usuário pelo ID (DELETE)
app.delete('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuarioIndex = trataArquivos.arquivoUsuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    trataArquivos.arquivoUsuarios.splice(usuarioIndex, 1);
    res.json({ message: 'Usuário excluído com sucesso!' });
});
// Isso precisa ser alterado, vinculado ao usuário
let globalPublicKey
let globalPrivateKey
// Rota para obter um usuário específico pelo ID (READ)
app.get('/tokendesessao', (req, res) => {
    const { publicKey, privateKey } = cripto.gerarParDeChaves();

    globalPublicKey = publicKey
    globalPrivateKey = privateKey
    res.send(publicKey);
});



app.post('/login', async (req, res) => {
    const mensagem = JSON.stringify(req.body, null, 2)
    // Serializa e exibe o payload recebido
    console.log(`/login:\n${req.body}`);

    // Verifica se o payload é uma string
    if (typeof mensagem === 'string') {
        try {
            // Descriptografa o dado recebido com a chave privada
            const decryptedData = await cripto.descriptografar(mensagem, globalPrivateKey);
            const loginUser = JSON.parse(decryptedData);
            const usuario = trataArquivos.arquivoUsuarios.find((usr) => (usr.usuario === loginUser.usuario) && ((usr.senha === loginUser.senha)));

            if (!usuario) {
                return res.status(401).json({ error: 'Usuário ou senha inválidos!' });
            }
            res.send(usuario.nome);
        } catch (error) {
            console.error('Erro ao descriptografar os dados:', error);
            res.status(500).json({ error: 'Erro interno no servidor!' });
        }
    } else {
        console.error('Erro: O payload não é uma string.');
    }


});


app.post('/teste', (req, res) => {
    const mensagem = JSON.stringify(req.body, null, 2)
    // Serializa e exibe o payload recebido
    console.log(`Dado recebido (JSON):\n${req.body}`);


    const mensagemTeste = mensagem //"isso é um teste"

    console.log(`criptografar: ${mensagemTeste} ${publicKey}\r\n`);
    const mensagemCriptografada = cripto.criptografar(mensagemTeste, globalPublicKey)

    console.log(`mensagemCriptografada: ${mensagemCriptografada}\r\n`);
    const mensagemDescriptografada = cripto.descriptografar(mensagemCriptografada, globalPrivateKey)
    console.log(`mensagemDescriptografada: ${mensagemDescriptografada}\r\n`);
    res.send(mensagemDescriptografada);
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
