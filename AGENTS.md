# Agent Guidelines

Este arquivo contém instruções para agentes de IA que trabalham neste repositório.

## Visão Geral do Projeto

**BoardScore** é um placar digital em tempo real para jogos de tabuleiro e cartas. Desenvolvido em React + TypeScript com Firebase como backend.

## Stack Técnica

- **Frontend:** React 19, Vite 7, TypeScript
- **Estilização:** Tailwind CSS v4, Framer Motion
- **Backend:** Firebase (Firestore, Auth)
- **Deploy:** Vercel

## Estrutura do Projeto

```text
src/
├── components/     # Componentes React reutilizáveis
├── contexts/       # Contextos React (Auth, Theme)
├── hooks/          # Custom hooks (useScoreboard)
├── lib/            # Utilitários (firebase, sounds, history)
├── pages/          # Páginas da aplicação
├── services/       # Serviços de acesso ao Firestore
└── types/          # Definições TypeScript
```

## Convenções de Código

### Commits

Usar Conventional Commits:

- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração sem mudança de comportamento
- `chore:` tarefas de manutenção

### TypeScript

- Preferir `interface` sobre `type` para objetos
- Usar tipos explícitos em funções públicas
- Evitar `any`, usar `unknown` quando necessário

### React

- Componentes funcionais com hooks
- Custom hooks para lógica reutilizável
- Lazy loading para páginas (já configurado em App.tsx)

### Tailwind CSS

- Dark mode usa `@custom-variant dark (&:where(.dark, .dark *))`
- Preferir classes utilitárias sobre CSS customizado

## Firebase/Firestore

### Coleções

- `users/{userId}` - Perfil do usuário, salas recentes
- `rooms/{roomId}` - Dados da sala (nome, owner, senha)
- `rooms/{roomId}/players/{playerId}` - Jogadores e pontuações

### Regras de Segurança

As regras estão em `firestore.rules`. Após alterações:

```bash
npx firebase-tools deploy --only firestore:rules
```

### Otimização de Leituras

- Usar `onSnapshot` para dados real-time (evita polling)
- Cache offline habilitado via `persistentLocalCache`
- Evitar `getDoc` + `onSnapshot` duplicados

## Testes

Ainda não implementados. Ao adicionar:

- Usar Vitest para unit tests
- React Testing Library para componentes

## Padrões Importantes

### Senhas de Sala

- Hashear com SHA-256 + salt único
- Formato armazenado: `salt:hash`
- Compatibilidade com formato legado (só hash)

### Nickname vs DisplayName

- `displayName`: nome do Google (não editável)
- `nickname`: apelido customizado pelo usuário
- Nunca sobrescrever nickname existente no login

### Histórico de Ações

- In-memory por sala (não persistido)
- Registrar: pontuação, entrada/saída, zerar, esvaziar
