---
description: Roda os testes e confere se os casos de borda do Word Frequency estão cobertos
allowed-tools: Read, Grep, Glob
---

Verifique a cobertura dos casos de borda do projeto. **Não altere nenhum arquivo.**

## 1. Rode os testes

Execute `npm test -- --run` e resuma: quantos arquivos e testes passaram e, se houver falhas, qual teste falhou e por quê (cole a mensagem do erro).

## 2. Confira os casos de borda

Para cada caso abaixo, procure com Grep em `src/**/*.test.ts(x)` e `server/**/*.test.ts` um teste que o cubra. Não presuma: só marque ✅ se encontrar o teste e leia o nome dele.

**Contagem (`src/lib/countWords.ts`)**
- texto vazio e só com espaços/quebras de linha
- só pontuação
- maiúsculas e minúsculas contadas como a mesma palavra, e a opção de diferenciar
- acentos preservados (é ≠ e)
- hífen e apóstrofo internos (guarda-chuva, d'água) e soltos nas bordas
- números como palavras
- várias linhas e espaços repetidos
- desempate alfabético e ordem decrescente de frequência
- stopwords (português, inglês, ambos)

**Entrada e limite**
- limite `MAX_CHARS` ao colar texto maior e aviso "(limite atingido)"
- contador de caracteres
- erro de texto vazio (mensagem, foco, `aria-invalid`, erro some ao digitar)
- arquivo `.txt`: válido, maior que o limite, que não é texto, arrastar e soltar

**Resultados**
- tabela: estado vazio, filtro sem resultado, ordenação pelos cabeçalhos
- resumo (total, únicas, mais frequente)
- gráficos: colunas, bolhas, nuvem, pizza, tamanho
- CSV: separador `;`, aspas, BOM, botão desativado sem linhas

**Busca por URL (cliente)**
- campo vazio, URL sem `https://`, servidor fora do ar, erro devolvido pelo servidor, texto longo cortado, botão "Buscando..."

**Busca por URL (servidor, segurança)**
- bloqueio de `localhost`, IP privado, `169.254.169.254`, `file://`, porta diferente de 80/443, usuário e senha na URL
- redirecionamento para endereço interno, redirecionamentos infinitos
- tempo limite, tamanho máximo, tipo de conteúdo inválido, página sem texto
- extração: página com `<main>`, sem `<main>` (menus e listas de links ignorados), charset ISO-8859-1

**Landing e navegação**
- `#/app` abre o app, `#/` e âncoras abrem a landing, demonstração interativa

## 3. Relatório

Apresente uma tabela em português:

| Caso | Teste que cobre (arquivo › nome) | Status |
|---|---|---|

Depois liste só os casos ❌ e, para cada um, **sugira** o teste que falta (arquivo e nome sugeridos, e o que ele deve verificar). Não escreva os testes a menos que eu peça.
