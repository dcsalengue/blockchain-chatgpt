const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');

const PORT = 3001;

// 1. Gerar um par de chaves pública e privada
function gerarParDeChaves() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // Tamanho da chave em bits
        publicKeyEncoding: { type: 'spki', format: 'pem' }, // Formato da chave pública
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' } // Formato da chave privada
    });
    return { publicKey, privateKey };
}

// 2. Criptografar com a chave pública
function criptografar(mensagem, chavePublica) {
    const bufferMensagem = Buffer.from(mensagem, 'utf-8'); // Converte a mensagem para buffer
    const mensagemCriptografada = crypto.publicEncrypt(chavePublica, bufferMensagem); // Criptografa
    return mensagemCriptografada.toString('base64'); // Retorna em base64
}

// 3. Descriptografar com a chave privada
function descriptografar(mensagemCriptografada, chavePrivada) {
    const bufferMensagemCriptografada = Buffer.from(mensagemCriptografada, 'base64'); // Converte a mensagem criptografada para buffer
    const mensagemDescriptografada = crypto.privateDecrypt(chavePrivada, bufferMensagemCriptografada); // Descriptografa
    return mensagemDescriptografada.toString('utf-8'); // Retorna como string
}

// Middleware para habilitar CORS
app.use(cors({
    origin: 'http://127.0.0.1:5501',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'tokensession'],  // Cabeçalhos permitidos, incluindo o 'session'
    credentials: true,  // Permite o envio de cookies e cabeçalhos personalizados
}));

// Middleware para lidar com JSON no corpo da requisição
app.use(express.json());

// Base de dados em memória (simulação)
let usuarios = [];

// Rota para criar um novo usuário (CREATE)
app.post('/usuarios', (req, res) => {
    const { nome, cpf, usuario, senha } = req.body;

    // Verifica se o ID já existe
    if (usuarios.find(usuario => usuario.cpf === cpf)) {
        return res.status(400).json({ error: 'Usuário com este ID já existe!' });
    }

    usuarios.push({ nome, cpf, usuario, senha });
    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: { nome, cpf, usuario, senha } });
});

// Rota para listar todos os usuários (READ)
app.get('/usuarios', (req, res) => {
    res.json(usuarios);
});

// Rota para obter um usuário específico pelo ID (READ)
app.get('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuario = usuarios.find(usuario => usuario.cpf === parseInt(cpf));

    if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    res.json(usuario);
});

// Rota para atualizar um usuário pelo ID (UPDATE)
app.put('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const { nome, usuario, senha } = req.body;

    const usuarioIndex = usuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    // Atualiza o usuário
    usuarios[usuarioIndex] = { cpf: parseInt(cpf), nome, usuario, senha };
    res.json({ message: 'Usuário atualizado com sucesso!', usuario: usuarios[usuarioIndex] });
});

// Rota para excluir um usuário pelo ID (DELETE)
app.delete('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuarioIndex = usuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    usuarios.splice(usuarioIndex, 1);
    res.json({ message: 'Usuário excluído com sucesso!' });
});

function removeKeyHeaders(key) {
    // Remove as linhas de início e fim, e também espaços em branco extras
    return key
        .replace('-----BEGIN PRIVATE KEY-----', '') // Remove a linha de início
        .replace('-----END PRIVATE KEY-----', '')   // Remove a linha de fim
        .replace('-----BEGIN PUBLIC KEY-----', '') // Remove a linha de início
        .replace('-----END PUBLIC KEY-----', '')   // Remove a linha de fim
        .replace(/[\n\r]/g, '')              // Remove quebras de linha
        .trim();                                    // Remove espaços em branco extras
}

let globalPublicKey
let globalPrivateKey
// Rota para obter um usuário específico pelo ID (READ)
app.get('/tokendesessao', (req, res) => {
    console.log('tokendesessao');

    const { publicKey, privateKey } = gerarParDeChaves();

    const publicKeyStripped = removeKeyHeaders(publicKey);
    const privateKeyStripped = removeKeyHeaders(privateKey);

    globalPublicKey = publicKeyStripped;
    globalPrivateKey= privateKeyStripped;

    // Define o cabeçalho HTTP com o token da sessão
    res.set('tokensession', publicKeyStripped);
    res.send(publicKeyStripped);
});



// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
