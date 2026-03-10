import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. Configurações Iniciais
const auth = getAuth();
const db = getFirestore();
const provider = new GoogleAuthProvider();
let usuarioLogado = null;
let listaSaidas = [];
let editandoIndex = -1;

// 2. Observador de Autenticação (Controla o que aparece na tela)
onAuthStateChanged(auth, (user) => {
    const loginContainer = document.getElementById('login-container');
    const sistemaCaixa = document.getElementById('sistema-caixa');

    if (user) {
        usuarioLogado = user;
        loginContainer.style.display = 'none';
        sistemaCaixa.style.display = 'block';
        document.getElementById('user-name').innerText = `Olá, ${user.displayName.split(' ')[0]}!`;
        
        // Define data de hoje e busca dados
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('data-caixa').value = hoje;
        atualizarDataExtenso(); 
    } else {
        usuarioLogado = null;
        loginContainer.style.display = 'flex';
        sistemaCaixa.style.display = 'none';
    }
});

// 3. Funções de Login/Sair
window.loginComGoogle = async () => {
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Falha ao entrar com Google.");
    }
};

window.fazerLogout = async () => {
    if(confirm("Deseja sair do sistema?")) {
        await signOut(auth);
    }
};

// 4. Lógica de Data e Carregamento do Banco
window.atualizarDataExtenso = async () => {
    const dataInput = document.getElementById('data-caixa').value;
    if(!dataInput) return;

    const opcoes = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dataFormatada = new Date(dataInput + 'T00:00:00').toLocaleDateString('pt-BR', opcoes);
    document.getElementById('data-display').innerText = dataFormatada.toUpperCase();
    
    await carregarDadosDoFirebase(dataInput);
};

async function carregarDadosDoFirebase(data) {
    if (!usuarioLogado) return;

    try {
        const docRef = doc(db, "usuarios", usuarioLogado.uid, "fechamentos", data);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const d = docSnap.data();
            document.getElementById('delivery').value = d.vendas.delivery;
            document.getElementById('balcao').value = d.vendas.balcao;
            document.getElementById('mesa').value = d.vendas.mesa;
            document.getElementById('dinheiro').value = d.recebimentos.dinheiro;
            document.getElementById('cartao').value = d.recebimentos.cartao;
            listaSaidas = d.saidas || [];
        } else {
            limparCampos();
        }
        renderizarSaidas();
        calcularTudo();
    } catch (e) {
        console.error("Erro ao carregar:", e);
    }
}

function limparCampos() {
    document.getElementById('delivery').value = 0;
    document.getElementById('balcao').value = 0;
    document.getElementById('mesa').value = 0;
    document.getElementById('dinheiro').value = 0;
    document.getElementById('cartao').value = 0;
    listaSaidas = [];
}

// 5. Lógica de Saídas e Cálculos
window.adicionarSaida = () => {
    const desc = document.getElementById('saida-desc').value;
    const valor = parseFloat(document.getElementById('saida-valor').value) || 0;

    if (desc === "" || valor <= 0) return alert("Preencha descrição e valor!");

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
    salvarDadosNoFirebase(); // Salva automaticamente ao adicionar saída
};

window.renderizarSaidas = () => {
    const container = document.getElementById('lista-saidas');
    container.innerHTML = "";
    listaSaidas.forEach((item, index) => {
        container.innerHTML += `
            <div class="item-saida">
                <span>${item.desc.toUpperCase()}: <strong>R$ ${item.valor.toFixed(2)}</strong></span>
                <div>
                    <button onclick="prepararEdicao(${index})">✏️</button>
                    <button onclick="removerSaida(${index})">🗑️</button>
                </div>
            </div>`;
    });
};

window.removerSaida = (index) => {
    listaSaidas.splice(index, 1);
    renderizarSaidas();
    calcularTudo();
    salvarDadosNoFirebase();
};

window.prepararEdicao = (index) => {
    const item = listaSaidas[index];
    document.getElementById('saida-desc').value = item.desc;
    document.getElementById('saida-valor').value = item.valor;
    editandoIndex = index;
    document.querySelector('.btn-add').innerText = "Atualizar Saída";
};

window.calcularTudo = () => {
    const delivery = parseFloat(document.getElementById('delivery').value) || 0;
    const balcao = parseFloat(document.getElementById('balcao').value) || 0;
    const mesa = parseFloat(document.getElementById('mesa').value) || 0;
    const dinheiro = parseFloat(document.getElementById('dinheiro').value) || 0;
    const cartao = parseFloat(document.getElementById('cartao').value) || 0;

    const totalVendas = delivery + balcao + mesa;
    const totalRecebido = dinheiro + cartao;
    const totalSaidas = listaSaidas.reduce((acc, item) => acc + item.valor, 0);
    const sobra = (totalRecebido + totalSaidas) - totalVendas;

    document.getElementById('subtotal-vendas').innerText = `Subtotal Vendas: R$ ${totalVendas.toFixed(2)}`;
    document.getElementById('subtotal-recebido').innerText = `Subtotal Recebido: R$ ${totalRecebido.toFixed(2)}`;
    document.getElementById('subtotal-saidas').innerText = `Total Saídas: R$ ${totalSaidas.toFixed(2)}`;
    document.getElementById('equilibrio-valor').innerText = `R$ ${sobra.toFixed(2)}`;

    const statusCard = document.getElementById('status-card');
    if (sobra >= -0.01) {
        statusCard.innerText = "CAIXA OK ✅";
        statusCard.className = "status-caixa ok";
    } else {
        statusCard.innerText = "CAIXA FALTANDO ❌";
        statusCard.className = "status-caixa erro";
    }
};

// 6. Gravação no Firebase
window.salvarDadosNoFirebase = async () => {
    if (!usuarioLogado) return;
    const dataDoc = document.getElementById('data-caixa').value;
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
        await setDoc(doc(db, "usuarios", usuarioLogado.uid, "fechamentos", dataDoc), dados);
        console.log("Sincronizado com Firebase");
    } catch (e) {
        console.error("Erro ao salvar:", e);
    }
};

// 7. Impressão (Versão Negrito)
window.gerarCupom = () => {
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
        <div style="text-align:center; font-weight:900; margin-bottom:15px; font-family: sans-serif;">
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
            <b style="font-size:24px; display: block;">${status}</b>
            <span style="font-size:18px; font-weight:900;">DIFERENCA: R$ ${sobra.toFixed(2)}</span>
        </div>
        <div style="text-align:center; margin-top:20px; font-size:12px; font-weight:800;">
            SISTEMA DE CAIXA V1.0 - ${new Date().toLocaleTimeString()}
        </div>
    `;

    const divPrint = document.getElementById('cupom-print');
    divPrint.innerHTML = conteudo;
    setTimeout(() => { window.print(); }, 300);
};