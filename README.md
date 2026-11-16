# Word Frequency

App web que recebe um bloco de texto (até **10.000 caracteres**), conta a frequência de cada palavra e mostra uma tabela em **ordem decrescente de frequência**. Segue o modelo _Bag of Words_: a ordem das palavras é ignorada e só a contagem importa.

> O botão se chama "Translate" por exigência da especificação ([app.md](app.md)), mas ele só analisa o texto. Não traduz nada.

## Recursos

- Caixa de texto com contador de caracteres, validação de entrada vazia e acessibilidade (`label`, foco, `aria-live`).
- Tabela de frequência ordenável, com filtro, cópia e exportação em CSV.
- Gráficos em HTML/CSS/SVG puro: colunas, bolhas, nuvem de palavras, pizza e tamanho das palavras (com download em PNG).
- Opções: stopwords (pt/en/ambos), diferenciar maiúsculas e resumo (total, únicas, mais frequente).
- Abrir `.txt` (botão ou arrastar e soltar), `Ctrl+Enter`, "Colar exemplo" e "Limpar".
- Texto e opções salvos no `localStorage`; tema Sistema/Claro/Escuro.
- Análise por URL: o backend baixa a página e extrai só o texto visível, com proteção contra SSRF.
- Landing page com demonstração interativa.

## Regras de contagem

- Insensível a maiúsculas por padrão ("Casa" = "casa").
- Acentos preservados ("é" ≠ "e").
- Números contam como palavras; pontuação é descartada.
- Apóstrofos e hífens internos são mantidos ("d'água", "guarda-chuva").
- Ordenação: frequência decrescente e, no empate, ordem alfabética.

## Stack

React + Vite + TypeScript, CSS Modules, Vitest + React Testing Library, oxlint + Prettier. Backend em Node (`node:http`) com tsx e cheerio.

## Como rodar

Requer Node.js instalado.

```bash
npm install
npm run dev:all      # frontend (http://localhost:5173) + backend (porta 3001)
```

| Comando              | O que faz                                                  |
| -------------------- | ---------------------------------------------------------- |
| `npm run dev`        | Só o frontend (o recurso de URL mostrará "servidor fora do ar") |
| `npm run dev:server` | Só o backend                                               |
| `npm run build`      | Build de produção em `dist/`                               |
| `npm run preview`    | Serve o build localmente                                   |
| `npm test -- --run`  | Roda os testes uma vez                                     |
| `npm run lint`       | oxlint                                                     |
| `npm run format`     | Prettier                                                   |

## Estrutura

```
src/
├── components/   # componentes de UI
├── lib/          # lógica pura (countWords, stopwords, chartData)
├── landing/      # landing page
└── styles/
server/           # API /api/extract (extração de texto e proteção SSRF)
```

## Segurança do backend

`GET /api/extract?url=...` só aceita http/https nas portas 80/443, bloqueia IPs privados/locais, revalida cada redirecionamento (máx. 5), limita o prazo a 8 s e o corpo a 2 MB, e aceita só `text/html`/`text/plain`. O servidor escuta apenas em `127.0.0.1`.

Para publicar, o servidor precisa de hospedagem própria e de limite de requisições por IP (ainda não implementado).

## Documentação do projeto

Convenções e fases de desenvolvimento estão em [CLAUDE.md](CLAUDE.md).
