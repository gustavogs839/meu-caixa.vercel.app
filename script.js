// Variáveis Globais
let listaSaidas = [];
let editandoIndex = -1;

// Inicialização: Define a data de hoje e limpa o sistema
window.onload = () => {
    const hoje = new Date().toISOString().split('T')[0];
    const inputData = document.getElementById('data-caixa');
    if(inputData) {
        inputData.value = hoje;
        atualizarDataExtenso();
    }
};

// 1. Lógica de Data
function atualizarDataExtenso() {
    const dataInput = document.getElementById('data-caixa').value;
    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = new Date(dataInput + 'T00:00:00').toLocaleDateString('pt-BR', opcoes);
    document.getElementById('data-display').innerText = dataFormatada.toUpperCase();
    
    // Se tiver Firebase configurado, pode chamar carregarDadosDoFirebase() aqui
    calcularTudo();
}

// 2. Lógica de Saídas (Adicionar, Excluir, Editar)
function adicionarSaida() {
    const descInput = document.getElementById('saida-desc');
    const valorInput = document.getElementById('saida-valor');
    const desc = descInput.value;
    const valor = parseFloat(valorInput.value) || 0;

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

    descInput.value = "";
    valorInput.value = 0;
    renderizarSaidas();
    calcularTudo();
}

function renderizarSaidas() {
    const container = document.getElementById('lista-saidas');
    container.innerHTML = "";
    
    listaSaidas.forEach((item, index) => {
        container.innerHTML += `
            <div class="item-saida">
                <span>${item.desc.toUpperCase()}: <strong>R$ ${item.valor.toFixed(2)}</strong></span>
                <div>
                    <button onclick="prepararEdicao(${index})" style="cursor:pointer; margin-right:10px;">✏️</button>
                    <button onclick="removerSaida(${index})" style="cursor:pointer;">🗑️</button>
                </div>
            </div>
        `;
    });
}

function removerSaida(index) {
    if(confirm("Deseja excluir esta saída?")) {
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

// 3. Lógica de Cálculos (Soma e Status)
function calcularTudo() {
    const delivery = parseFloat(document.getElementById('delivery').value) || 0;
    const balcao = parseFloat(document.getElementById('balcao').value) || 0;
    const mesa = parseFloat(document.getElementById('mesa').value) || 0;
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;

    const totalVendas = delivery + balcao + mesa;
    const totalRecebido = dinheiro + cartao;
    const totalSaidas = listaSaidas.reduce((acc, item) => acc + item.valor, 0);

    // Regra: (Recebimentos + Saídas) - Vendas
    const sobra = (totalRecebido + totalSaidas) - totalVendas;

    // Atualização da UI
    document.getElementById('subtotal-vendas').innerText = `Subtotal Vendas: R$ ${totalVendas.toFixed(2)}`;
    document.getElementById('subtotal-recebido').innerText = `Subtotal Recebido: R$ ${totalRecebido.toFixed(2)}`;
    document.getElementById('subtotal-saidas').innerText = `Total Saídas: R$ ${totalSaidas.toFixed(2)}`;
    document.getElementById('equilibrio-valor').innerText = `R$ ${sobra.toFixed(2)}`;

    const statusCard = document.getElementById('status-card');
    if (sobra >= -0.01) { // Tolerância para centavos
        statusCard.innerText = "CAIXA OK ✅";
        statusCard.className = "status-caixa ok";
    } else {
        statusCard.innerText = "CAIXA FALTANDO ❌";
        statusCard.className = "status-caixa erro";
    }
}

// 4. Lógica de Impressão (Versão Negrito para Elgin i9)
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

    let linhasSaidasHTML = "";
    listaSaidas.forEach(item => {
        linhasSaidasHTML += `
            <div style="display:flex; justify-content:space-between; font-weight:800; margin-bottom:3px;">
                <span>${item.desc.substring(0, 15).toUpperCase()}</span><span>R$ ${item.valor.toFixed(2)}</span>
            </div>`;
    });

    const conteudo = `
        <div style="text-align:center; text-transform:uppercase; font-weight:900; margin-bottom:15px; font-family: sans-serif;">
            <span style="font-size:22px; border: 2px solid #000; padding: 5px; display: block;">FECHAMENTO</span>
            <span style="font-size:14px; margin-top: 10px; display: block;">${dataDisplay}</span>
        </div>
        
        <div style="border-bottom: 3px solid #000; padding-bottom:8px; margin-bottom:8px; font-weight:800; font-size:15px; font-family: monospace;">
            <div style="text-align:center; font-size:17px; text-decoration: underline; margin-bottom:5px;">VENDAS</div>
            <div style="display:flex; justify-content:space-between;"><span>DELIVERY:</span><span>R$ ${delivery.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>BALCAO:</span><span>R$ ${balcao.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>MESA:</span><span>R$ ${mesa.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:18px; border-top:2px dashed #000; padding-top: 5px;">
                <span>TOTAL:</span><span>R$ ${totalVendas.toFixed(2)}</span>
            </div>
        </div>

        <div style="border-bottom: 3px solid #000; padding-bottom:8px; margin-bottom:8px; font-weight:800; font-size:15px; font-family: monospace;">
            <div style="text-align:center; font-size:17px; text-decoration: underline; margin-bottom:5px;">RECEBIMENTOS</div>
            <div style="display:flex; justify-content:space-between;"><span>DINHEIRO:</span><span>R$ ${dinheiro.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between;"><span>CARTAO:</span><span>R$ ${cartao.toFixed(2)}</span></div>
            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:18px; border-top:2px dashed #000; padding-top: 5px;">
                <span>TOTAL:</span><span>R$ ${totalRecebido.toFixed(2)}</span>
            </div>
        </div>

        <div style="border-bottom: 3px solid #000; padding-bottom:8px; margin-bottom:8px; font-weight:800; font-size:15px; font-family: monospace;">
            <div style="text-align:center; font-size:17px; text-decoration: underline; margin-bottom:5px;">SAIDAS</div>
            ${listaSaidas.length > 0 ? linhasSaidasHTML : "<div style='text-align:center;'>SEM SAIDAS</div>"}
            <div style="display:flex; justify-content:space-between; margin-top:5px; font-size:18px; border-top:2px dashed #000; padding-top: 5px;">
                <span>TOTAL SAIDAS:</span><span>R$ ${totalSaidas.toFixed(2)}</span>
            </div>
        </div>

        <div style="text-align:center; margin-top:15px; padding:10px; border:3px solid #000;">
            <b style="font-size:24px; display: block; margin-bottom: 5px;">${status}</b>
            <span style="font-size:18px; font-weight:900;">DIFERENCA: R$ ${sobra.toFixed(2)}</span>
        </div>

        <div style="text-align:center; margin-top:20px; font-size:12px; font-weight:800; font-family: sans-serif;">
            SISTEMA DE CAIXA V1.0<br>
            IMPRESSO EM: ${new Date().toLocaleString('pt-BR')}
        </div>
    `;

    const divPrint = document.getElementById('cupom-print');
    divPrint.innerHTML = conteudo;

    setTimeout(() => {
        window.print();
    }, 300);
}