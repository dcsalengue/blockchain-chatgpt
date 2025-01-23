const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const crypto = require('crypto');


const app = express();
app.use(bodyParser.json()); // Para interpretar JSON
app.use(bodyParser.text()); // Adicionado para aceitar payloads como texto
app.use(bodyParser.urlencoded({ extended: true })); // Para interpretar dados de formulário


const PORT = 3001;


// Gerar um par de chaves RSA-OAEP
function gerarParDeChaves() {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048, // Tamanho da chave
        publicKeyEncoding: {
            type: 'spki', // Formato compatível com Web Crypto API
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8', // Formato compatível com Web Crypto API
            format: 'pem',
        },
    });
}


function criptografar(mensagem, chavePublica) {
    const bufferMensagem = Buffer.from(mensagem, 'utf-8');
    const mensagemCriptografada = crypto.publicEncrypt(
        {
            key: chavePublica,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // Define o padding OAEP
            oaepHash: 'sha256', // Define o hash compatível com Web Crypto API
        },
        bufferMensagem
    );
    return mensagemCriptografada.toString('base64'); // Retorna o resultado em Base64
}


async function descriptografar(mensagemCriptografada, chavePrivada) {
    const bufferMensagemCriptografada = Buffer.from(mensagemCriptografada, 'base64');
    const mensagemDescriptografada = crypto.privateDecrypt(
        {
            key: chavePrivada,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: 'sha256',
        },
        bufferMensagemCriptografada
    );
    return mensagemDescriptografada.toString('utf-8'); // Converte de volta para string
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

    globalPublicKey = publicKey
    globalPrivateKey = privateKey


    console.log(`${globalPublicKey}`)
    console.log(`${globalPrivateKey}`)
    // const publicKeyStripped = removeKeyHeaders(publicKey);
    // const privateKeyStripped = removeKeyHeaders(privateKey);

 
    res.send(publicKey);
});



app.post('/login',async (req, res) => {
    const mensagem = JSON.stringify(req.body, null, 2)
    // Serializa e exibe o payload recebido
    console.log(`/login:\n${req.body}`);
    
    // Verifica se o payload é uma string
    if (typeof mensagem === 'string') {
        try { 
            // Descriptografa o dado recebido com a chave privada
            console.log(`${globalPrivateKey}`)
            const decryptedData = await descriptografar(mensagem, globalPrivateKey);
            console.log('Dado descriptografado:', decryptedData);
            const loginUser = JSON.parse(decryptedData);
            console.log(loginUser)
            console.log(usuarios)

            const usuario = usuarios.find((usr) => (usr.usuario === loginUser.usuario)&&((usr.senha === loginUser.senha)));
            console.log(usuario)
            res.send(usuario.nome);
        } catch (error) {
            console.error('Erro ao descriptografar os dados:', error);
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
    const mensagemCriptografada = criptografar(mensagemTeste, globalPublicKey)

    console.log(`mensagemCriptografada: ${mensagemCriptografada}\r\n`);
    const mensagemDescriptografada = descriptografar(mensagemCriptografada, globalPrivateKey)
    console.log(`mensagemDescriptografada: ${mensagemDescriptografada}\r\n`);
    res.send(mensagemDescriptografada);
});


// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
