# 💰 Sistema de Fechamento de Caixa Pro

Este é um sistema web desenvolvido para facilitar o fechamento de caixa diário de estabelecimentos comerciais (como restaurantes, lanchonetes e lojas). O sistema permite o lançamento de vendas, recebimentos e saídas, calculando automaticamente a conformidade do caixa e permitindo a impressão de cupons térmicos.

## 🚀 Demonstração
O projeto está hospedado na Vercel e pode ser acessado em: 
[(https://meu-caixa-vercel-app.vercel.app/)]

## ✨ Funcionalidades
- **Cálculo em Tempo Real**: Totalização de vendas (Delivery, Balcão, Mesa) e recebimentos.
- **Gestão de Saídas**: Lançamento detalhado de despesas com opção de edição e exclusão.
- **Validação de Status**: Identificação automática de "Caixa OK" ou "Caixa Faltante".
- **Integração com Firebase**: Salvamento e recuperação de dados na nuvem por data.
- **Impressão de Cupom**: Formatação otimizada para impressoras térmicas de **72mm (ex: Elgin i9)**.
- **Interface Responsiva**: Design moderno e adaptável para tablets e computadores.

## 🛠️ Tecnologias Utilizadas
- **HTML5** & **CSS3**: Estrutura e estilização moderna com Flexbox/Grid.
- **JavaScript (Vanilla)**: Lógica de cálculos e manipulação do DOM.
- **Firebase Firestore**: Banco de Dados NoSQL para persistência em tempo real.
- **Vercel**: Hospedagem e Deploy contínuo.

## ⚙️ Como configurar o Banco de Dados
Para rodar este projeto com seu próprio banco de dados:
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2. Ative o **Firestore Database**.
3. Obtenha suas credenciais no menu "Configurações do Projeto".
4. Substitua o objeto `firebaseConfig` no arquivo `index.html`.

