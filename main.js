

const URL_BASE = "http://localhost:3001"
const cadastroNome = document.getElementById('cadastro__nome');
const cadastroCpf = document.getElementById('cadastro__cpf');
const cadastroUsuario = document.getElementById('cadastro__usuario');
const cadastroSenha = document.getElementById('cadastro__senha');
const repeteSenha = document.getElementById('repete-senha');
const form = document.getElementById('form-cadastro-usuario');
const botaCadastrar = document.getElementById('botao-cadastrar');

const loginUsuario = document.getElementById("login__usuario")
const loginSenha = document.getElementById("login-senha")
const botaoLogin = document.getElementById("botao-login")

const listaUsuarios = document.getElementById("lista-usuarios")

repeteSenha.onchange = () => {
    if (cadastroSenha.value === repeteSenha.value) {
        cadastroSenha.style.background = "#7bc27b"
        cadastroSenha.setAttribute("valida", true)
    }
    else {
        cadastroSenha.style.background = "#f14747"
        cadastroSenha.style.color = "white"
        cadastroSenha.setAttribute("valida", false)
    }

}

// Função para aplicar a máscara de CPF enquanto o usuário digita
async function aplicarMascaraCPF(event) {

    console.log(event)
    let cpf = event.target.value;

    // Remove qualquer caractere que não seja número
    cpf = cpf.replace(/\D/g, '');

    // Adiciona a máscara: 000.000.000-00
    if (cpf.length > 3) {
        cpf = cpf.replace(/(\d{3})(\d)/, '$1.$2');
    }
    if (cpf.length > 6) {
        cpf = cpf.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
    }
    if (cpf.length > 9) {
        cpf = cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    }

    // Atualiza o valor do input com a máscara
    event.target.value = cpf;
    console.log('input')
    await sinalizaCpfValido(cpf);
}


function validarCPF(cpfComMascara) {
    // Remove pontos e traços da máscara
    const cpf = cpfComMascara.replace(/[.\-]/g, '');

    // Verifica se o CPF tem 11 dígitos
    if (!/^\d{11}$/.test(cpf)) {
        return false;
    }

    // Elimina CPFs com todos os números iguais (ex.: 111.111.111-11)
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf[i]) * (10 - i);
    }
    let digito1 = (soma * 10) % 11;
    if (digito1 === 10 || digito1 === 11) digito1 = 0;

    // Verifica o primeiro dígito
    if (digito1 !== parseInt(cpf[9])) {
        return false;
    }

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf[i]) * (11 - i);
    }
    let digito2 = (soma * 10) % 11;
    if (digito2 === 10 || digito2 === 11) digito2 = 0;

    // Verifica o segundo dígito
    if (digito2 !== parseInt(cpf[10])) {
        return false;
    }

    return true;
}


async function sinalizaCpfValido(valor) {
    const cadastroCpf = document.getElementById('cadastro__cpf');

    if (valor.length < 14) { // Ainda não completamente preenchido
        cadastroCpf.style.background = "white"
        cadastroCpf.style.color = "black"
        console.log(`input valor.length < 14`)
    }
    else if (validarCPF(valor)) {
        console.log(`CPF válido`)
        cadastroCpf.style.background = "#7bc27b"
    }
    else { //Preenchido e inválido
        console.log(`CPF inválido`)
        cadastroCpf.style.background = "#f14747"
        cadastroCpf.style.color = "white"
    }
    console.log(`sinalizaCpfValido ${cadastroCpf.style.background}`)

}

// Seleciona o campo de CPF e aplica a máscara ao digitar

cadastroCpf.addEventListener('input', aplicarMascaraCPF);

async function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
    return hashHex;
}

// Adiciona validação do formulário para exibir mensagens personalizadas

botaCadastrar.addEventListener('click', async function (event) {
    const validaSenha = cadastroSenha.getAttribute("valida") === "true" ? true : false

    //Validções
    if (!cadastroCpf.checkValidity()) {
        alert('Por favor, insira um CPF válido no formato 000.000.000-00.');
        return
    } else if (!validarCPF(cadastroCpf.value)) {
        alert('CPF inválido');
        return
    }
    else if (!validaSenha) {
        alert('Senhas precisam ser idênticas.');
        return
    }

    // get um token de chave pública de sessão enviado pelo servidor ao conectar para criptografar os dados 

    const hashSenha = await hash(cadastroSenha.value)
    let jsonCadastro =
    {
        "nome": `${cadastroNome.value}`,
        "cpf": `${cadastroCpf.value}`,
        "usuario": `${cadastroUsuario.value}`,
        "senha": `${hashSenha}`
    }


    console.log(JSON.stringify(jsonCadastro))

    try {
        const response = await axios.post(`${URL_BASE}/usuarios`, jsonCadastro)
        return await response.data
    } catch (error) {
        alert(`Erro ao salvar usuarios \r\n${error}`);
        throw error;
    }
});

async function listarUsuarios() {
    try {
        const response = await axios.get(`${URL_BASE}/usuarios`)
        return await response.data
    } catch (error) {
        alert(`Erro ao listar usuários \r\n${error}`);
        throw error;
    }
}


// Lista usuários ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
    const usuarios = await listarUsuarios()
    usuarios.forEach(usuario => {
        listaUsuarios.innerHTML += `<li>[${usuario.nome}][${usuario.cpf}][${usuario.usuario}][${usuario.senha}]</li>`
    });

});

async function requisitarTokenDeSessao() {
    try {
        const response = await axios.get(`${URL_BASE}/tokendesessao`, {
            withCredentials: true,  // Isso garante que os cookies e cabeçalhos personalizados sejam enviados
        });


        // Obtendo os dados do corpo da resposta (body)
        return await response.data;

    } catch (error) {
        alert(`Erro ao requisitar token de sessão \r\n${error}`);
        throw error;
    }
}
// Função para converter a chave pública PEM em ArrayBuffer
function pemToArrayBuffer(pem) {
    const base64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\s+/g, ''); // Remove cabeçalhos, rodapés e espaços em branco
    const binary = atob(base64); // Decodifica de Base64
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

// Função para importar a chave pública
async function importPublicKey(pem) {
    const arrayBuffer = pemToArrayBuffer(pem);
    return crypto.subtle.importKey(
        'spki', // Formato SPKI para chaves públicas
        arrayBuffer,
        {
            name: 'RSA-OAEP', // Algoritmo de criptografia
            hash: { name: 'SHA-256' }, // Hash utilizado
        },
        false, // Chave não exportável
        ['encrypt'] // Usada apenas para criptografia
    );
}

// Função para criptografar dados com a chave pública
async function encryptWithPublicKey(publicKey, data) {
    const encoder = new TextEncoder(); // Codifica dados para ArrayBuffer
    const encodedData = encoder.encode(JSON.stringify(data)); // Converte para JSON e codifica
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        publicKey,
        encodedData
    );
    return encryptedData; // Retorna um ArrayBuffer com os dados criptografados
}

async function encryptUserData(publicKeyPem, userData) {
    try {
        // Importar a chave pública
        const publicKey = await importPublicKey(publicKeyPem);

        // Criptografar os dados do usuário
        const encryptedData = await encryptWithPublicKey(publicKey, userData);

        // Converter os dados criptografados para Base64 para envio ao servidor
        const encryptedBase64 = btoa(
            String.fromCharCode(...new Uint8Array(encryptedData))
        );

        // Retorna os dados criptografados em Base64
        return encryptedBase64;
    } catch (error) {
        console.error('Erro ao criptografar os dados:', error);
        throw error; // Repassa o erro para ser tratado externamente
    }
}




async function doLoginUsuario(loginEncriptado) {
    try {
        const response = await axios.post(`${URL_BASE}/login`, loginEncriptado, {
            headers: {
                'Content-Type': 'text/plain', // Indica que o corpo é texto simples
            },
        });


        // Obtendo os dados do corpo da resposta (body)
        return await response.data;

    } catch (error) {
        alert(`Erro logar \r\n${error}`);
        throw error;
    }
}

// Função de Criptografia
function criptografar(mensagem, chavePublica) {
    const crypto = window.cryptoBrowserify;
    const bufferMensagem = Buffer.from(mensagem, 'utf-8');
    const mensagemCriptografada = crypto.publicEncrypt(
        {
            key: chavePublica,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        bufferMensagem
    );
    return mensagemCriptografada.toString('base64');
}

botaoLogin.addEventListener("click", async () => {
    const publicKeyPem = await requisitarTokenDeSessao()
    console.log(publicKeyPem)



    const hashSenha = await hash(loginSenha.value)
    const usuario = { nome: `'${loginUsuario.value}'`, senha: `'${hashSenha}'` };


    // Criptografando os dados
    const encryptedData = await encryptUserData(publicKeyPem, usuario);

    //const encryptedData = await criptografar(usuario, publicKeyPem)
    console.log('Dados criptografados:', encryptedData);

    doLoginUsuario(encryptedData)

    // Requisita token de sessão (get /tokendesessao)
    // Servidor gera um par de chaves pública e privada e coloca em uma lista de sessões ativas
    // Servidor envia a chave pública 
    // Informação digitada de senha é transformada em sha256
    // A informação de login e senha são criptografados com a chave pública
    // Envia hash de login e senha (post /login)
    // Servidor retorna nome de usuário 



});

const btTeste = document.getElementById("botao-testes")
btTeste.addEventListener('click', async () => {

    // const mensagemTeste = "Teste enviado"
    const hashSenha = await hash(loginSenha.value)
    const mensagemTeste = { nome: `'${loginUsuario.value}'`, senha: `'${hashSenha}'` };
    try {
        const response = await axios.post(`${URL_BASE}/teste`, mensagemTeste, {
            headers: {
                'Content-Type': 'text/plain', // Indica que o corpo é texto simples
            },
        }
        );


        // Obtendo os dados do corpo da resposta (body)
        return await response.data;

    } catch (error) {
        alert(`Erro logar \r\n${error}`);
        throw error;
    }
})