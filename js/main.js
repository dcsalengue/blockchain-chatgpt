import ui from "./ui.js"
import api from "./api.js"
import cpf from "./cpf.js"


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


// Lista usuários ao carregar a página
document.addEventListener("DOMContentLoaded", async () => {
    const usuarios = await api.listarUsuarios()
    ui.montaListaDeUsuarios(usuarios)   

});

// Valida senha de cadastro passando background para verde 
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

// Seleciona o campo de CPF e aplica a máscara ao digitar
cadastroCpf.addEventListener('input', cpf.aplicarMascaraCPF);


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
    api.cadastrarUsuario(jsonCadastro)
    
});


botaoLogin.addEventListener("click", async () => {
    const publicKeyPem = await requisitarTokenDeSessao()
    console.log(publicKeyPem)



    const hashSenha = await hash(loginSenha.value)
    const usuario = { usuario: `${loginUsuario.value}`, senha: `${hashSenha}` };


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

