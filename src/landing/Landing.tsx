import '@fontsource-variable/plus-jakarta-sans';
import {
  ArrowRight,
  ChartBar,
  CheckCircle,
  DownloadSimple,
  FileText,
  Funnel,
  Globe,
  MagnifyingGlass,
  Moon,
  TextAa,
  type Icon,
} from '@phosphor-icons/react';
import { ThemeToggle } from '../components/ThemeToggle';
import { APP_HASH } from '../hooks/useRoute';
import { MAX_CHARS } from '../lib/constants';
import { countWords } from '../lib/countWords';
import styles from './Landing.module.css';
import { LiveDemo } from './LiveDemo';

const BAG_TEXT = 'O gato viu o gato';
const BAG_ROWS = countWords(BAG_TEXT);

const STEPS = [
  {
    title: 'Traga seu texto',
    text: 'Digite, cole, arraste um arquivo .txt ou informe o endereço de uma página da web.',
  },
  {
    title: 'Clique em Translate',
    text: 'O app conta cada palavra na hora. Se preferir o teclado, use Ctrl + Enter.',
  },
  {
    title: 'Explore o resultado',
    text: 'Veja o resumo, os gráficos e a tabela. Depois copie, baixe o CSV ou salve o gráfico em PNG.',
  },
];

const FEATURES: { icon: Icon; title: string; text: string }[] = [
  {
    icon: TextAa,
    title: 'Contagem que entende português',
    text: 'Ignora a pontuação, mantém acentos e hífens (guarda-chuva) e trata "Casa" e "casa" como a mesma palavra, se você quiser.',
  },
  {
    icon: ChartBar,
    title: 'Cinco tipos de gráfico',
    text: 'Colunas, bolhas, nuvem de palavras, pizza e distribuição por tamanho. Baixe qualquer um como imagem.',
  },
  {
    icon: Globe,
    title: 'Texto direto de uma página',
    text: 'Cole um endereço e o app traz só o conteúdo principal, sem menus, anúncios e listas de links.',
  },
  {
    icon: FileText,
    title: 'Abra arquivos .txt',
    text: 'Escolha um arquivo ou arraste-o para a caixa de texto. Textos maiores que o limite são cortados com aviso.',
  },
  {
    icon: Funnel,
    title: 'Ignore as palavras comuns',
    text: 'Esconda "de", "que", "the" e outras palavras muito frequentes para ver o que realmente importa.',
  },
  {
    icon: DownloadSimple,
    title: 'Exporte do seu jeito',
    text: 'CSV pronto para abrir no Excel em português, cópia para planilhas e gráficos em PNG.',
  },
  {
    icon: MagnifyingGlass,
    title: 'Tabela interativa',
    text: 'Ordene pelas colunas, filtre por trecho da palavra e enxergue o peso de cada uma pela barra de fundo.',
  },
  {
    icon: Moon,
    title: 'Tema e memória',
    text: 'Modo claro, escuro ou automático. Seu texto e suas opções ficam salvos no navegador.',
  },
];

const USE_CASES = [
  {
    title: 'Estudar idiomas',
    text: 'Descubra o vocabulário mais usado em um texto antes de lê-lo e comece pelas palavras que mais aparecem.',
  },
  {
    title: 'Escrever melhor',
    text: 'Encontre vícios de linguagem e palavras repetidas demais no seu próprio texto.',
  },
  {
    title: 'Analisar conteúdo',
    text: 'Compare os temas de artigos, discursos ou letras de música olhando para as palavras que dominam cada um.',
  },
];

const GOOD_TO_KNOW = [
  `Cada análise aceita até ${MAX_CHARS} caracteres.`,
  'O texto que você digita é processado no seu navegador. Só o endereço de uma página, quando você usa a busca por URL, passa pelo servidor.',
  'A busca por URL funciona só com sites públicos. Endereços internos e da sua rede são bloqueados por segurança.',
  'Páginas que montam o conteúdo com JavaScript podem voltar vazias, porque o servidor lê apenas o HTML.',
];

export function Landing() {
  return (
    <div className={styles.page}>
      <a href="#conteudo" className={styles.skip}>
        Pular para o conteúdo
      </a>

      <div className={styles.headerBar}>
        <header className={styles.header}>
          <a href="#/" className={styles.brand}>
            Word Frequency
          </a>
          <nav className={styles.nav} aria-label="Seções da página">
            <a href="#como-funciona">Como funciona</a>
            <a href="#recursos">Recursos</a>
            <a href="#bom-saber">Bom saber</a>
          </nav>
          <div className={styles.headerActions}>
            <ThemeToggle />
            <a href={APP_HASH} className={styles.headerCta}>
              Abrir o app
            </a>
          </div>
        </header>
      </div>

      <main id="conteudo" tabIndex={-1} className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>Análise de frequência de palavras</p>
            <h1 className={styles.headline}>
              Descubra quais palavras mais se repetem em <span>qualquer texto</span>
            </h1>
            <p className={styles.lead}>
              Cole um texto, abra um arquivo ou busque uma página da web. Em um clique você vê a
              tabela de frequência, uma nuvem de palavras e outros gráficos prontos para
              compartilhar.
            </p>
            <div className={styles.actions}>
              <a href={APP_HASH} className={styles.primary}>
                Experimentar agora
                <ArrowRight size={18} weight="bold" aria-hidden="true" />
              </a>
              <a href="#como-funciona" className={styles.secondary}>
                Ver como funciona
              </a>
            </div>
            <p className={styles.note}>Grátis, sem cadastro e sem instalar nada.</p>
          </div>

          <LiveDemo />
        </section>

        <section id="como-funciona" className={styles.section}>
          <h2 className={styles.title}>Como funciona</h2>
          <p className={styles.subtitle}>Três passos, do texto ao resultado.</p>
          <ol className={styles.steps}>
            {STEPS.map(({ title, text }, index) => (
              <li key={title} className={styles.step}>
                <span className={styles.stepNumber} aria-hidden="true">
                  {index + 1}
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>

          <div className={styles.bag}>
            <div>
              <h3>O que é contar palavras?</h3>
              <p>
                O app usa a ideia de <strong>"saco de palavras"</strong> (bag of words): o texto é
                separado em palavras soltas e cada uma ganha uma contagem. A ordem em que elas
                aparecem não importa, só quantas vezes se repetem. É a base de buscadores,
                classificadores de texto e análises de linguagem.
              </p>
            </div>
            <div className={styles.bagExample} aria-label="Exemplo de contagem">
              <p className={styles.bagText}>“{BAG_TEXT}”</p>
              <ul className={styles.chips}>
                {BAG_ROWS.map(({ word, count }) => (
                  <li key={word}>
                    {word} <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="recursos" className={styles.section}>
          <h2 className={styles.title}>Tudo o que você precisa para analisar um texto</h2>
          <p className={styles.subtitle}>Do básico ao detalhe, sem sair da mesma tela.</p>
          <ul className={styles.features}>
            {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
              <li key={title} className={styles.card}>
                <span className={styles.icon}>
                  <FeatureIcon size={24} weight="duotone" aria-hidden="true" />
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.title}>Para que serve</h2>
          <ul className={styles.cases}>
            {USE_CASES.map(({ title, text }) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section id="bom-saber" className={styles.section}>
          <h2 className={styles.title}>Bom saber</h2>
          <ul className={styles.notes}>
            {GOOD_TO_KNOW.map((item) => (
              <li key={item}>
                <CheckCircle size={20} weight="fill" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.final}>
          <h2>Pronto para ver as palavras do seu texto?</h2>
          <p>Leva menos de um minuto.</p>
          <a href={APP_HASH} className={styles.primaryLight}>
            Abrir o Word Frequency
            <ArrowRight size={18} weight="bold" aria-hidden="true" />
          </a>
        </section>
      </main>

      <footer className={styles.footer}>Word Frequency · feito com React, TypeScript e Vite</footer>
    </div>
  );
}
