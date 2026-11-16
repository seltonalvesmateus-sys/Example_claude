# CLAUDE.md

Guia do projeto **Word Frequency** para o Claude Code. A especificação original está em [App.md](App.md).

## Descrição

App web que recebe um bloco de texto (até **10.000 caracteres**, `MAX_CHARS`; o App.md original pedia 2048 e o limite foi ampliado de propósito), conta a frequência de cada palavra e mostra uma tabela com cada palavra única e sua contagem, em **ordem decrescente de frequência**. Ele segue o modelo _Bag of Words_: a ordem das palavras no texto é ignorada e só a contagem importa.

Requisitos obrigatórios (ver App.md):

1. A tela mostra uma caixa de texto, o botão **"Translate"** e a tabela de frequência.
2. A caixa aceita textos digitados ou colados, com no máximo `MAX_CHARS` caracteres (10.000; a especificação diz 2048).
3. Clicar em "Translate" analisa o texto.
4. Texto vazio (ou só com espaços) mostra uma mensagem de erro.
5. A tabela tem uma linha por palavra: palavra + quantidade.
6. A tabela fica ordenada por frequência decrescente.

Bônus: gráfico de frequência e análise de uma página web a partir de uma URL.

> O botão se chama "Translate" por exigência da especificação, mas ele só analisa o texto. Não traduz nada.

## Stack

| Camada           | Tecnologia                                                                                   |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Frontend         | React 18 + Vite + TypeScript                                                                 |
| Estilo           | CSS Modules (ou Tailwind, se adotado na Fase 3)                                              |
| Gráfico (Fase 4) | HTML/CSS puro (sem biblioteca; testável no jsdom e sem dependência extra)                    |
| Testes           | Vitest + React Testing Library                                                               |
| Lint/format      | oxlint (padrão do template Vite atual) + Prettier                                            |
| Backend (Fase 6) | Node (`node:http` puro, sem Express) rodando com tsx, e cheerio para extrair o texto do HTML |

## Fases de desenvolvimento

Siga as fases em ordem e não adiante funcionalidades de fases futuras.

- [x] **Fase 1: Lógica de contagem.** Função pura `countWords(text)` em `src/lib/`: normaliza (minúsculas, remove pontuação, **preserva acentos**), separa as palavras, conta e ordena (frequência decrescente, desempate alfabético). Testes unitários cobrindo: vazio, pontuação, acentos, várias linhas, hífens e apóstrofos, repetições.
- [x] **Fase 2: Interface mínima (MVP).** Caixa de texto (`maxLength={MAX_CHARS}`), botão "Translate" e tabela preenchida ao clicar.
- [x] **Fase 3: Validação e UX.** Erro para entrada vazia, contador de caracteres (`n / MAX_CHARS`), estado vazio da tabela, layout responsivo e acessibilidade (`<label>`, foco, `aria-live` na mensagem de erro).
- [x] **Fase 4: Visualização (Bônus 1).** `FrequencyChart.tsx` alterna entre Colunas, Bolhas, Nuvem de palavras, Pizza (rosca SVG) e Tamanho das palavras, tudo em HTML/CSS/SVG puro (sem Chart.js). Os dados dos gráficos ficam em `src/lib/chartData.ts`.
- [x] **Fase 5: Opções de análise.** Stopwords (pt/en/ambos), diferenciar maiúsculas, resumo (total, únicas, mais frequente), filtro da tabela, copiar e exportar CSV. Extras de uso: `Ctrl+Enter`, "Colar exemplo" e "Limpar".
- [x] **Extras de uso (pós-Fase 5).** Abrir `.txt` (botão ou arrastar e soltar, máx. 5 MB, cortado em `MAX_CHARS`), texto e opções salvos no `localStorage` (hook `useLocalStorage`, chaves `wf:*`), tema Sistema/Claro/Escuro (`ThemeToggle`, via `data-theme` no `<html>`), tabela ordenável pelos cabeçalhos e download do gráfico em PNG (`html-to-image`, carregada sob demanda). Nos testes, o `setup.ts` limpa o `localStorage` e o tema a cada teste.
- [x] **Landing page.** `src/landing/Landing.tsx` explica o projeto (hero com demonstração calculada por `countWords`, como funciona, recursos, usos, "bom saber"). A navegação é por hash, sem biblioteca de rotas: `src/Root.tsx` + `useRoute` mostram o app em `#/app` e a landing em qualquer outro endereço (inclusive âncoras de seção como `#recursos`). O `App` continua independente da landing. Ao adicionar um recurso, atualize a lista de recursos da landing.
  - **Design (skill `ui-ux-pro-max`, perfil "Productivity Tool")**: estilo flat (cores sólidas, bordas finas, sem gradiente nem sombra, transições de 150 ms), demonstração interativa no topo (`LiveDemo`, que leva o texto ao app pela chave `TEXT_STORAGE_KEY`), fonte Plus Jakarta Sans self-hosted (`@fontsource-variable`), ícones SVG Phosphor (`@phosphor-icons/react`, sempre `aria-hidden` quando decorativos; **nada de emoji como ícone**), alvos de toque ≥ 44 px, link "Pular para o conteúdo", cabeçalho fixo com `scroll-margin-top` nas seções e `prefers-reduced-motion` respeitado. Mantém o índigo da marca (igual ao app); o laranja `--action` (#c2410c, 5,2:1 com texto branco) é só a cor de ação da landing.
  - A skill vem com um script Python de busca (`.claude/skills/ui-ux-pro-max/scripts/search.py`), mas o Python não está instalado nesta máquina; os dados em `.claude/skills/ui-ux-pro-max/data/*.csv` podem ser consultados direto.
- [x] **Fase 6: Análise por URL (Bônus 2).** `GET /api/extract?url=...` (em `server/`) baixa a página e devolve `{ title, text }` só com o texto visível; o campo "Buscar texto" (`UrlFetcher`) preenche a caixa de texto, cortando em `MAX_CHARS`. O backend é necessário por causa do CORS. Trata URL inválida, timeout, erro HTTP, tipo de conteúdo e página sem texto.
  - **Extração (`server/extractText.ts`)**, em ordem de preferência: `<main>`/`<article>` (se ≥ 200 caracteres) → bloco que concentra ≥ 60% dos parágrafos (`findContentRoot`, para páginas sem marcação semântica, onde o `<body>` traz menus e listas de links que ocupariam os `MAX_CHARS` caracteres) → `<body>` inteiro. Nunca use regras específicas de um site.
  - **Segurança (SSRF) é obrigatória em `server/safeFetch.ts`:** só http/https nas portas 80/443, sem usuário/senha, bloqueio de IPs privados/locais/reservados (incluindo `::ffff:` e nomes `.local`/`localhost`), checagem do IP **no momento da conexão** (anti DNS rebinding), cada redirecionamento revalidado (máx. 5), prazo único de 8 s, corpo limitado a 2 MB e só `text/html`/`text/plain`. O servidor escuta apenas em `127.0.0.1`. Não enfraqueça isso. A opção `trustedOrigins` existe só para testes e isenta apenas origens exatas (nunca um interruptor geral), então os destinos de redirecionamento continuam validados. O servidor HTTP fica em `server/app.ts` (`createApiServer`, com o extrator injetável) e `server/index.ts` só inicia a escuta.
  - **Para publicar (deploy):** o servidor precisa de hospedagem própria (ou virar função serverless) e de limite de requisições por IP, que ainda não existe.

## Estrutura de pastas

```
World_fre/
├── App.md                  # especificação original
├── CLAUDE.md
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── main.tsx            # ponto de entrada
│   ├── App.tsx             # composição da página
│   ├── components/         # componentes de UI (um por arquivo)
│   │   ├── TextInput.tsx
│   │   ├── FrequencyTable.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── FrequencyChart.tsx      # Fase 4
│   ├── lib/                # lógica pura, sem React
│   │   ├── countWords.ts
│   │   ├── countWords.test.ts
│   │   └── stopwords.ts            # Fase 5
│   ├── types/              # tipos compartilhados (ex.: WordCount)
│   └── styles/
└── server/                 # Fase 6
    ├── index.ts
    └── extractText.ts
```

## Comandos

> No Windows, se `node`/`npm` não forem reconhecidos no terminal, atualize o PATH da sessão:
> `$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')`
> (ou reinicie o VS Code).

```bash
npm install          # instala as dependências
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run build        # build de produção em dist/
npm run preview      # serve o build localmente
npm test             # roda os testes (Vitest, modo watch)
npm test -- --run    # roda os testes uma única vez (use em CI/verificações)
npm run lint         # oxlint
npm run format       # Prettier
```

Fase 6: o backend roda na porta 3001 (`npm run dev:server`) e o Vite redireciona `/api` para ele via `server.proxy`. Use **`npm run dev:all`** para subir frontend e backend juntos; só com `npm run dev` o recurso de URL mostra "servidor fora do ar". Os testes de `server/` usam `// @vitest-environment node` e um servidor HTTP local.

Antes de considerar uma tarefa concluída, rode `npm test -- --run`, `npm run lint` e `npm run build`.

## Convenções de código

**Geral**

- TypeScript em modo `strict`. Não use `any`. Prefira `type` para formatos de dados.
- Código (nomes de variáveis, funções e arquivos) em **inglês**. Textos da interface, comentários e documentação podem ser em português.
- Funções pequenas e puras sempre que possível. Componentes não contêm lógica de contagem.

**Nomes**

- Componentes: `PascalCase.tsx` (`FrequencyTable.tsx`).
- Funções e utilitários: `camelCase.ts` (`countWords.ts`).
- Constantes: `UPPER_SNAKE_CASE` (`MAX_CHARS = 10000`). Nunca escreva o limite solto no código nem nos testes: use `MAX_CHARS`.
- Testes ficam ao lado do arquivo: `nome.test.ts(x)`.

**React**

- Somente componentes funcionais e hooks.
- O estado fica em `App.tsx` e desce por props. Só use Context se a árvore crescer.
- Use `key` estável nas listas (a própria palavra).

**Regras de contagem** (fonte única: `src/lib/countWords.ts`)

- Insensível a maiúsculas por padrão ("Casa" = "casa").
- Acentos são preservados ("é" ≠ "e").
- Números contam como palavras. Pontuação é descartada. Apóstrofos e hífens internos são mantidos ("d'água", "guarda-chuva").
- Ordenação: frequência decrescente e, em caso de empate, ordem alfabética (`localeCompare`).
- Retorno: `Array<{ word: string; count: number }>`.

**Testes**

- Toda mudança em `src/lib/` precisa de teste.
- Componentes são testados pelo comportamento visível ao usuário (Testing Library), não pela implementação.

**Formatação**

- Prettier: 2 espaços, aspas simples, ponto e vírgula, largura de 100.
- Commits no formato Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`).
