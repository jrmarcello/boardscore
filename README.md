# 🏆 BoardScore

![License](https://img.shields.io/github/license/jrmarcello/boardscore?style=for-the-badge)
![React](https://img.shields.io/badge/React-20232a?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)

Um placar digital simples e em tempo real para gamificar a jogatina da família. Gerencia pontuações, reordena o ranking automaticamente e gera aquela rivalidade saudável no Uno ou no carteado de domingo.

## ✨ Funcionalidades (MVP)

*   **Realtime:** Alterou no celular, atualiza na TV na hora (Firebase).
*   **Ranking Automático:** Quem tem mais pontos sobe para o topo com animação suave.
*   **Interface Clean:** Focado em visibilidade e facilidade de uso mobile.
*   **PWA:** Instalável no celular como um app nativo.

## 🛠️ Tecnologias

*   **Frontend:** React (Vite), TypeScript
*   **Estilo:** Tailwind CSS, Framer Motion (Animações)
*   **Backend:** Firebase (Firestore)
*   **Deploy:** Vercel

## 🚀 Como Rodar Localmente

1.  Clone o projeto:
    ```bash
    git clone https://github.com/jrmarcello/boardscore.git
    cd boardscore
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

3.  Configure as variáveis de ambiente:
    *   Crie um arquivo `.env.local` na raiz.
    *   Adicione suas chaves do Firebase (veja `.env.example`).

4.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

## 📝 Licença

Este projeto está sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.
