// Colocar aqui as funções de comunicação com o backend
import criptografia from "./cripto.js";

const URL_BASE = "http://localhost:3001"
// let sessionId = null
// let publicKeySession = null
class Api {
    constructor() {
        this.sessionId = null;       // ID de sessão gerado
        this.publicKeySession = null; // Chave pública recebida do servidor
    }
    // sessionId ,       // Id de sessão enviado pelo servidor
    // publicKeySession,// Chave pública relacionada a sessionId
    async listarUsuarios() {
        try {
            const response = await axios.get(`${URL_BASE}/usuarios`)
            return await response.data
        } catch (error) {
            alert(`Erro ao listar usuários \r\n${error}`);
            throw error;
        }
    }

    async cadastrarUsuario(nome, cpf, usuario, senha) {        
        // Transforma senha em um hash RSA256
        const hashSenha = await criptografia.hash(senha)
        let jsonCadastro =
        {
            "nome": `${nome}`,
            "cpf": `${cpf}`,
            "usuario": `${usuario}`,
            "senha": `${hashSenha}`
        }

    // Criptografando os dados
    const encryptedData = await criptografia.encryptUserData(this.publicKeySession, jsonCadastro);

    console.log(this.sessionId)
        try {
            const response = await axios.post(`${URL_BASE}/usuarios`, {
                data: encryptedData,
                sessionId: this.sessionId
            });
            return await response.data
        } catch (error) {
            alert(`Erro ao salvar usuarios \r\n${error}`);
            throw error;
        }
    }

    async loginUsuario(loginUsuario) {
        const loginEncriptado = await criptografia.encryptUserData(this.publicKeySession, loginUsuario );
        try {
            const response = await axios.post(`${URL_BASE}/login`, {
                data: loginEncriptado,
                sessionId: this.sessionId
            });
            return await response.data
        } catch (error) {
            alert(`Erro ao salvar usuarios \r\n${error}`);
            throw error;
        }
        
        
        
        
        
        
        
        
        // try {
        //     const response = await axios.post(`${URL_BASE}/login`, loginEncriptado, {
        //         headers: {
        //             'Content-Type': 'text/plain', // Indica que o corpo é texto simples
        //         },
        //     });


        //     // Obtendo os dados do corpo da resposta (body)
        //     return await response.data;

        // } catch (error) {
        //     alert(`Erro logar \r\n${error}`);
        //     throw error;
        // }
    }

    async requisitarTokenDeSessao() {
        try {
            const response = await axios.get(`${URL_BASE}/tokendesessao`, {
                withCredentials: true,  // Isso garante que os cookies e cabeçalhos personalizados sejam enviados
            });
            ({ publicKey: this.publicKeySession, sessionId: this.sessionId } = response.data);

            // Obtendo os dados do corpo da resposta (body)
            return (`sessionId: ${this.sessionId} | publicKey: ${this.publicKeySession} `);

        } catch (error) {
            alert(`Erro ao requisitar token de sessão \r\n${error}`);
            throw error;
        }
    }
}
// Exporta uma instância da API para uso
const api = new Api();
export default api;