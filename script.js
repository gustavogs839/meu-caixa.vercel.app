// Variáveis Globais
let listaSaidas = [];
let editandoIndex = -1;

// Inicialização: Define a data de hoje no input
window.onload = () => {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('data-caixa').value = hoje;
    atualizarDataExtenso();
    calcularTudo(); // Garante que começa zerado mas calculado
};

function atualizarDataExtenso() {
    const dataInput = document.getElementById('data-caixa').value;
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = new Date(dataInput + 'T00:00:00').toLocaleDateString('pt-BR', opcoes);
    document.getElementById('data-display').innerText = dataFormatada.toUpperCase();
}

function adicionarSaida() {
    const desc = document.getElementById('saida-desc').value;
    const valor = parseFloat(document.getElementById('saida-valor').value) || 0;

    if (desc === "" || valor <= 0) {
        alert("Preencha a descrição e um valor válido!");
        return;
    }

    if (editandoIndex > -1) {
        listaSaidas[editandoIndex] = { desc, valor };
        editandoIndex = -1;
        document.querySelector('.btn-add').innerText = "+ Adicionar Saída";
    } else {
        listaSaidas.push({ desc, valor });
    }

    document.getElementById('saida-desc').value = "";
    document.getElementById('saida-valor').value = 0;
    renderizarSaidas();
    calcularTudo();
}

function renderizarSaidas() {
    const container = document.getElementById('lista-saidas');
    container.innerHTML = "";
    
    listaSaidas.forEach((item, index) => {
        container.innerHTML += `
            <div class="item-saida">
                <span>${item.desc}: <strong>R$ ${item.valor.toFixed(2)}</strong></span>
                <div>
                    <button onclick="prepararEdicao(${index})" title="Editar">✏️</button>
                    <button onclick="removerSaida(${index})" title="Excluir">🗑️</button>
                </div>
            </div>
        `;
    });
}

function removerSaida(index) {
    if(confirm("Deseja realmente excluir esta saída?")) {
        listaSaidas.splice(index, 1);
        renderizarSaidas();
        calcularTudo();
    }
}

function prepararEdicao(index) {
    const item = listaSaidas[index];
    document.getElementById('saida-desc').value = item.desc;
    document.getElementById('saida-valor').value = item.valor;
    editandoIndex = index;
    document.querySelector('.btn-add').innerText = "Atualizar Saída";
}

// NOVA LÓGICA DE CÁLCULO SOLICITADA
function calcularTudo() {
    // 1. Somar Vendas
    const delivery = parseFloat(document.getElementById('delivery').value) || 0;
    const balcao = parseFloat(document.getElementById('balcao').value) || 0;
    const mesa = parseFloat(document.getElementById('mesa').value) || 0;
    const totalVendas = delivery + balcao + mesa;

    // 2. Somar Recebimentos
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;
    const totalRecebido = dinheiro + cartao;

    // 3. Somar Saídas da lista
    const totalSaidas = listaSaidas.reduce((acc, item) => acc + item.valor, 0);

    // 4. Aplicar a nova regra: (Recebimentos + Saídas) - Vendas
    const sobraEquilibrio = (totalRecebido + totalSaidas) - totalVendas;

    // Atualização Visual
    document.getElementById('subtotal-vendas').innerText = `Subtotal Vendas: R$ ${totalVendas.toFixed(2)}`;
    document.getElementById('subtotal-recebido').innerText = `Subtotal Recebido: R$ ${totalRecebido.toFixed(2)}`;
    document.getElementById('subtotal-saidas').innerText = `Total Saídas: R$ ${totalSaidas.toFixed(2)}`;
    
    const labelEquilibrio = document.getElementById('equilibrio-valor');
    labelEquilibrio.innerText = `R$ ${sobraEquilibrio.toFixed(2)}`;

    // Validação do Status
    const statusCard = document.getElementById('status-card');
    
    if (sobraEquilibrio >= 0) {
        statusCard.innerText = "CAIXA OK ✅";
        statusCard.className = "status-caixa ok";
        labelEquilibrio.style.color = "green";
    } else {
        statusCard.innerText = "CAIXA FALTANDO ❌";
        statusCard.className = "status-caixa erro";
        labelEquilibrio.style.color = "red";
    }
}

function gerarCupom() {
    const dataDisplay = document.getElementById('data-display').innerText;
    const delivery = parseFloat(document.getElementById('delivery').value) || 0;
    const balcao = parseFloat(document.getElementById('balcao').value) || 0;
    const mesa = parseFloat(document.getElementById('mesa').value) || 0;
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;
    
    const totalVendas = delivery + balcao + mesa;
    const totalRecebido = dinheiro + cartao;
    const totalSaidas = listaSaidas.reduce((acc, item) => acc + item.valor, 0);
    const sobra = (totalRecebido + totalSaidas) - totalVendas;
    const status = sobra >= 0 ? "CAIXA OK" : "CAIXA FALTANDO";

    let linhasSaidas = "";
    listaSaidas.forEach(item => {
        // Formatação simples para alinhar descrição à esquerda e valor à direita
        const desc = item.desc.substring(0, 18).padEnd(18, '.');
        const val = item.valor.toFixed(2).padStart(8, ' ');
        linhasSaidas += `<div style="display:flex; justify-content:space-between;">
                            <span>${desc}</span><span>R$ ${val}</span>
                         </div>`;
    });

    const conteudo = `
        <div style="text-align:center; text-transform:uppercase; font-weight:bold; margin-bottom:10px;">
            *** FECHAMENTO DE CAIXA ***<br>
            <span> *** </span>
            ${dataDisplay}
        </div>
        
        <div style="border-bottom: 1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
            <b>VENDAS</b><br>
            Delivery: R$ ${delivery.toFixed(2)}<br>
            Balcão:   R$ ${balcao.toFixed(2)}<br>
            Mesa:     R$ ${mesa.toFixed(2)}<br>
            TOTAL:    R$ ${totalVendas.toFixed(2)}
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
            <b>RECEBIMENTOS</b><br>
            Dinheiro: R$ ${dinheiro.toFixed(2)}<br>
            Cartão:   R$ ${cartao.toFixed(2)}<br>
            TOTAL:    R$ ${totalRecebido.toFixed(2)}
        </div>

        <div style="border-bottom: 1px dashed #000; padding-bottom:5px; margin-bottom:5px;">
            <b>SAÍDAS</b><br>
            ${listaSaidas.length > 0 ? linhasSaidas : "Nenhuma saída."}<br>
            TOTAL:    R$ ${totalSaidas.toFixed(2)}
        </div>

        <div style="text-align:center; margin-top:10px;">
            <b style="font-size:14px;">${status}</b><br>
            Diferença: R$ ${sobra.toFixed(2)}
        </div>

        <div style="text-align:center; margin-top:15px; font-size:10px;">
            --------------------------------<br>
            Relatório gerado em:<br>
            ${new Date().toLocaleString('pt-BR')}
        </div>
    `;

    const divPrint = document.getElementById('cupom-print');
    divPrint.innerHTML = conteudo;

    // Pequeno atraso para garantir que o DOM atualizou antes de imprimir
    setTimeout(() => {
        window.print();
    }, 250);
}

async function salvarDados() {
    const dataDoc = document.getElementById('data-caixa').value; // Usaremos a data como ID do documento
    
    const dados = {
        vendas: {
            delivery: parseFloat(document.getElementById('delivery').value) || 0,
            balcao: parseFloat(document.getElementById('balcao').value) || 0,
            mesa: parseFloat(document.getElementById('mesa').value) || 0
        },
        recebimentos: {
            dinheiro: parseFloat(document.getElementById('dinheiro').value) || 0,
            cartao: parseFloat(document.getElementById('cartao').value) || 0
        },
        saidas: listaSaidas,
        ultimaAtualizacao: new Date()
    };

    try {
        // 'window.db' vem da configuração que fizemos no HTML
        const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        await setDoc(doc(window.db, "fechamentos", dataDoc), dados);
        alert("Dados salvos na nuvem com sucesso!");
    } catch (e) {
        console.error("Erro ao salvar: ", e);
    }
}

// Adicione esta função ao seu script.js

async function carregarDadosDoFirebase() {
    const dataSelecionada = document.getElementById('data-caixa').value;
    
    // Mostra um aviso visual de "carregando"
    console.log("Buscando dados para:", dataSelecionada);

    try {
        const { doc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const docRef = doc(window.db, "fechamentos", dataSelecionada);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const dados = docSnap.data();
            
            // Preenche os campos de Vendas
            document.getElementById('delivery').value = dados.vendas.delivery;
            document.getElementById('balcao').value = dados.vendas.balcao;
            document.getElementById('mesa').value = dados.vendas.mesa;

            // Preenche os campos de Recebimentos
            document.getElementById('dinheiro').value = dados.recebimentos.dinheiro;
            document.getElementById('cartao').value = dados.recebimentos.cartao;

            // Atualiza a lista de saídas global
            listaSaidas = dados.saidas || [];
            
            renderizarSaidas();
            calcularTudo();
            console.log("Dados carregados com sucesso!");
        } else {
            // Se não existir dados, limpa os campos para um novo fechamento
            limparCampos();
            console.log("Nenhum dado encontrado para esta data.");
        }
    } catch (e) {
        console.error("Erro ao carregar dados: ", e);
    }
}

function limparCampos() {
    document.getElementById('delivery').value = 0;
    document.getElementById('balcao').value = 0;
    document.getElementById('mesa').value = 0;
    document.getElementById('dinheiro').value = 0;
    document.getElementById('cartao').value = 0;
    listaSaidas = [];
    renderizarSaidas();
    calcularTudo();
}

// Altere sua função de atualizarDataExtenso para também carregar os dados
function atualizarDataExtenso() {
    const dataInput = document.getElementById('data-caixa').value;
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = new Date(dataInput + 'T00:00:00').toLocaleDateString('pt-BR', opcoes);
    document.getElementById('data-display').innerText = dataFormatada.toUpperCase();
    
    // Chama o carregamento do banco sempre que a data mudar
    carregarDadosDoFirebase();
}