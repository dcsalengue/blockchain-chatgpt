const cpf = {
    

    async sinalizaCpfValido(valor) {
        // const cadastroCpf = document.getElementById('cadastro__cpf');

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

    },

    // Função para aplicar a máscara de CPF enquanto o usuário digita
    async aplicarMascaraCPF(event) {

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
        await cpf.sinalizaCpfValido(cpf);
    },

    validarCPF(cpfComMascara) {
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
}

export default cpf;





