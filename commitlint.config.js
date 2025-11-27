export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação (não afeta código)
        'refactor', // Refatoração
        'perf',     // Performance
        'test',     // Testes
        'chore',    // Manutenção (deps, configs)
        'ci',       // CI/CD
        'build',    // Build
        'revert',   // Reverter commit
      ],
    ],
    'subject-case': [0], // Desabilita regra de case no subject
  },
}
