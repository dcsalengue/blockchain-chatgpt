// Colocar aqui as funções de comunicação com o backend
import criptografia from "./cripto.js";

const URL_BASE = "http://localhost:3001"

const api = {
    async listarUsuarios() {
        try {
            const response = await axios.get(`${URL_BASE}/usuarios`)
            return await response.data
        } catch (error) {
            alert(`Erro ao listar usuários \r\n${error}`);
            throw error;
        }
    },

    async cadastrarUsuario(nome, cpf, usuario, senha) {
        // get um token de chave pública de sessão enviado pelo servidor ao conectar para criptografar os dados 
        const hashSenha = await criptografia.hash(senha)
        let jsonCadastro =
        {
            "nome": `${nome}`,
            "cpf": `${cpf}`,
            "usuario": `${usuario}`,
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
    },

    async loginUsuario(loginEncriptado) {
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
    },

    async requisitarTokenDeSessao() {
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
    },
}
export default api;