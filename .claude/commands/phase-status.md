---
description: Mostra o status das fases de desenvolvimento do Word Frequency, com evidências nos arquivos
allowed-tools: Read, Grep, Glob
---

Reporte em que ponto o projeto está. Serve para retomar o trabalho depois de uma pausa. **Não altere nenhum arquivo.**

## 1. O que o CLAUDE.md diz

Leia a seção "Fases de desenvolvimento" de `CLAUDE.md` e anote quais itens estão marcados `[x]` e quais `[ ]`.

## 2. O que os arquivos provam

Para cada fase, verifique com Glob/Grep se os arquivos existem e têm o conteúdo esperado (não basta o arquivo existir: confira, por exemplo, que a função ou o componente principal está lá).

| Fase | Evidências esperadas |
|---|---|
| 1. Lógica de contagem | `src/lib/countWords.ts` (função `countWords`) e `src/lib/countWords.test.ts` |
| 2. Interface mínima | `src/App.tsx`, `src/components/TextInput.tsx`, `src/components/FrequencyTable.tsx` |
| 3. Validação e UX | `src/components/ErrorMessage.tsx`, contador e `aria-describedby` em `TextInput.tsx`, mensagem de estado vazio em `FrequencyTable`/`Results` |
| 4. Visualização | `src/components/FrequencyChart.tsx`, `WordCloud.tsx`, `DonutChart.tsx`, `LengthChart.tsx`, `src/lib/chartData.ts` |
| 5. Opções de análise | `src/lib/stopwords.ts`, `src/components/Options.tsx`, `Results.tsx`, `Summary.tsx`, `src/lib/export.ts` |
| Extras de uso | `src/hooks/useLocalStorage.ts`, `ThemeToggle.tsx`, `src/lib/readTextFile.ts`, `src/lib/sortRows.ts`, download PNG em `FrequencyChart.tsx` |
| 6. Análise por URL | `server/index.ts`, `server/safeFetch.ts`, `server/extractText.ts`, `server/extractFromUrl.ts`, `src/components/UrlFetcher.tsx`, `src/lib/fetchUrlText.ts` |
| Landing page | `src/landing/Landing.tsx`, `src/landing/LiveDemo.tsx`, `src/Root.tsx`, `src/hooks/useRoute.ts` |

## 3. Saúde do projeto

Execute `npm test -- --run` e `npm run build`. Informe se passaram (números de testes) ou o erro exato.

## 4. Relatório

Mostre uma tabela em português: **Fase | CLAUDE.md diz | Evidência nos arquivos | Situação** (✅ completa, 🟡 parcial, ❌ pendente).

Destaque **divergências**: fase marcada como feita sem os arquivos, ou arquivos existentes numa fase não marcada. Se houver, sugira o ajuste no CLAUDE.md (sem aplicar).

Termine com **"Próximo passo sugerido"**: o que ainda não foi feito e vale fazer. Não invente: considere apenas o que as fases e o CLAUDE.md mostram (por exemplo, a falta de `git`, de README, de deploy e de limite de requisições por IP no servidor, se de fato ainda não existirem).
