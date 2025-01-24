import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import cripto from './criptografia.js';

let arquivoUsuarios = [];  // array json do arquivo de usuários

const app = express();
app.use(bodyParser.json()); // Para interpretar JSON
app.use(bodyParser.text()); // Adicionado para aceitar payloads como texto
app.use(bodyParser.urlencoded({ extended: true })); // Para interpretar dados de formulário


const PORT = 3001;


// Caminho do arquivo
const bdUsuarios = path.join(__dirname, 'usuarios.json');

function refreshUsuarios() {
    const data = fs.readFileSync(bdUsuarios, 'utf-8');
    arquivoUsuarios = JSON.parse(data)
}

function updateJsonFile(filePath, newContent) {
    let data = [];
    if (fs.existsSync(filePath)) {
        data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    data.push(newContent);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
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



// Rota para criar um novo usuário (CREATE)
app.post('/usuarios', (req, res) => {
    const { nome, cpf, usuario, senha } = req.body;

    // Verifica se o ID já existe
    if (arquivoUsuarios.find(usuario => usuario.cpf === cpf)) {
        return res.status(400).json({ error: 'Usuário com este ID já existe!' });
    }

    updateJsonFile(bdUsuarios, req.body);
    refreshUsuarios()
    res.status(201).json({ message: 'Usuário criado com sucesso!', usuario: { nome, cpf, usuario, senha } });
});

// Rota para listar todos os usuários (READ)
app.get('/usuarios', (req, res) => {
    refreshUsuarios()
    res.json(arquivoUsuarios);
});

// Rota para obter um usuário específico pelo ID (READ)
app.get('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuario = arquivoUsuarios.find(usuario => usuario.cpf === parseInt(cpf));

    if (!usuario) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    res.json(usuario);
});

// Rota para atualizar um usuário pelo ID (UPDATE)
app.put('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const { nome, usuario, senha } = req.body;

    const usuarioIndex = arquivoUsuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    // Atualiza o usuário
    arquivoUsuarios[usuarioIndex] = { cpf: parseInt(cpf), nome, usuario, senha };
    res.json({ message: 'Usuário atualizado com sucesso!', usuario: arquivoUsuarios[usuarioIndex] });
});

// Rota para excluir um usuário pelo ID (DELETE)
app.delete('/usuarios/:cpf', (req, res) => {
    const { cpf } = req.params;
    const usuarioIndex = arquivoUsuarios.findIndex(usuario => usuario.cpf === parseInt(cpf));

    if (usuarioIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado!' });
    }

    arquivoUsuarios.splice(usuarioIndex, 1);
    res.json({ message: 'Usuário excluído com sucesso!' });
});

let globalPublicKey
let globalPrivateKey
// Rota para obter um usuário específico pelo ID (READ)
app.get('/tokendesessao', (req, res) => {
    console.log('tokendesessao');

    const { publicKey, privateKey } = cripto.gerarParDeChaves();

    globalPublicKey = publicKey
    globalPrivateKey = privateKey


    console.log(`${globalPublicKey}`)
    console.log(`${globalPrivateKey}`)


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
            console.log(`${globalPrivateKey}`)
            const decryptedData = await cripto.descriptografar(mensagem, globalPrivateKey);
            console.log('Dado descriptografado:', decryptedData);
            const loginUser = JSON.parse(decryptedData);
            console.log(loginUser)
            // let usuarios = JSON.parse( fs.readFile('./usuarios.json', 'utf8'));
            // console.log(usuarios)

            const usuario = arquivoUsuarios.find((usr) => (usr.usuario === loginUser.usuario) && ((usr.senha === loginUser.senha)));
            console.log(usuario)

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
