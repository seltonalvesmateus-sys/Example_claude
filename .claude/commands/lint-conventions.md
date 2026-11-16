---
description: Checa as convenções de código do CLAUDE.md (lint, tipos, formatação e regras do projeto)
allowed-tools: Read, Grep, Glob
---

Verifique se o código segue as convenções do `CLAUDE.md`. **Só relate: não corrija nada sem eu pedir.**

## 1. Ferramentas

Execute e resuma o resultado de cada uma (ok, ou os erros com arquivo e linha):

- `npm run lint` (oxlint)
- `npx tsc -b` (TypeScript em modo `strict`, incluindo `server/`)
- `npx prettier --check .` (formatação: 2 espaços, aspas simples, ponto e vírgula, largura 100)

## 2. Regras do projeto

Use Grep em `src/` e `server/` (ignore `node_modules`, `dist` e `.claude`).

1. **Sem `any`:** procure `: any`, `as any`, `<any>`. Erro.
2. **Limite de caracteres só em `MAX_CHARS`:** procure números soltos como `2048` ou `10000`/`10.000` fora de `src/lib/constants.ts`. Ignore `MAX_URL_LENGTH` e o `subarray(0, 2048)` do charset em `server/`, que são outra coisa. Erro.
3. **Nomes:** componentes e arquivos de `src/components/` e `src/landing/` em `PascalCase.tsx`; utilitários em `camelCase.ts`; constantes em `UPPER_SNAKE_CASE`. Aviso.
4. **Testes ao lado do arquivo:** todo `src/lib/*.ts` com lógica deve ter um `.test.ts` com o mesmo nome (exceto arquivos só de constantes, como `constants.ts` e `storageKeys.ts`). Aviso.
5. **Componentes sem lógica de contagem:** `src/components/` e `src/landing/` não devem implementar a contagem; devem chamar `countWords`. Aviso.
6. **CSS Modules:** todo componente com estilo importa um `*.module.css`. Procure `!important` e `style=` com cores fixas. Aviso.
7. **Cores:** em `.module.css`, avise sobre cores hexadecimais fora de declarações de variável (`--nome: #...`). Info (algumas, como `#fff` em texto de botão, são intencionais; diga quais parecem ser).
8. **Sem emoji como ícone** em `.tsx` (regra da landing): ícones são SVG do Phosphor com `aria-hidden` quando decorativos. Erro.
9. **Código comentado:** linhas como `// const`, `// import`, `// return`, `// if`. Aviso.
10. **Idioma:** identificadores em inglês; textos da interface e comentários podem ser em português. Aviso para nomes de variável, função ou arquivo em português.
11. **Segurança do servidor:** `server/` não deve chamar `fetch`, `http.get` ou `https.get` diretamente para URLs de usuário; só `fetchPage` de `safeFetch.ts`. Procure `trustedOrigins` fora de `safeFetch.ts` e dos arquivos de teste: ele nunca deve ser preenchido no código de produção. Erro.

## 3. Relatório

Em português, agrupe por severidade (**Erro**, **Aviso**, **Info**). Cada item com `arquivo:linha`, o que viola e qual regra do CLAUDE.md. Se uma regra não tiver nenhuma violação, diga "✅ sem violações" em vez de omitir.

Termine com um resumo (quantos erros, avisos e infos) e pergunte se quero que eu corrija os itens.
