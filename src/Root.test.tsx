import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_CHARS } from './lib/constants';
import Root from './Root';

function goTo(hash: string) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

describe('Root (landing page e navegação)', () => {
  beforeEach(() => {
    window.location.hash = '';
    window.scrollTo = vi.fn();
  });

  afterEach(() => {
    window.location.hash = '';
  });

  it('mostra a landing page por padrão', () => {
    render(<Root />);

    expect(
      screen.getByRole('heading', { level: 1, name: /quais palavras mais se repetem/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Texto para analisar')).not.toBeInTheDocument();
  });

  it('tem botões que levam ao aplicativo', () => {
    render(<Root />);

    const links = screen.getAllByRole('link', {
      name: /experimentar agora|abrir o app|abrir o word/i,
    });
    expect(links.length).toBeGreaterThanOrEqual(3);
    for (const link of links) expect(link).toHaveAttribute('href', '#/app');
  });

  it('oferece um link para pular a navegação que leva ao conteúdo principal', () => {
    render(<Root />);

    const skip = screen.getByRole('link', { name: 'Pular para o conteúdo' });
    expect(skip).toHaveAttribute('href', '#conteudo');
    expect(document.getElementById('conteudo')).toBe(screen.getByRole('main'));
  });

  it('usa ícones SVG decorativos, escondidos dos leitores de tela, e nenhum emoji', () => {
    const { container } = render(<Root />);

    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(8);
    for (const icon of icons) expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(container.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('explica a funcionalidade: passos, recursos, usos e limites', () => {
    render(<Root />);

    expect(screen.getByRole('heading', { name: 'Como funciona' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Traga seu texto' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Cinco tipos de gráfico' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Texto direto de uma página' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Para que serve' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Bom saber' })).toBeInTheDocument();
    expect(
      screen.getByText(`Cada análise aceita até ${MAX_CHARS} caracteres.`),
    ).toBeInTheDocument();
  });

  it('explica o saco de palavras com um exemplo calculado de verdade', () => {
    render(<Root />);

    // "O gato viu o gato" -> o 2, gato 2, viu 1
    const bag = screen.getByLabelText('Exemplo de contagem');
    const chips = within(bag)
      .getAllByRole('listitem')
      .map((item) => item.textContent?.replace(/\s+/g, ' ').trim());
    expect(chips).toEqual(['gato 2', 'o 2', 'viu 1']);
  });

  describe('demonstração interativa', () => {
    it('já mostra a frequência do texto de exemplo', () => {
      render(<Root />);
      const demo = screen.getByRole('region', { name: 'Demonstração interativa' });

      // "Quem conta um conto aumenta um ponto. Um conto puxa outro conto." -> conto 3, um 3, ...
      expect(within(demo).getByText('conto')).toBeInTheDocument();
      expect(within(demo).getByText('um')).toBeInTheDocument();
    });

    it('atualiza as barras enquanto o visitante digita', async () => {
      const user = userEvent.setup();
      render(<Root />);
      const demo = screen.getByRole('region', { name: 'Demonstração interativa' });
      const input = within(demo).getByLabelText('Experimente: edite o texto');

      await user.clear(input);
      await user.type(input, 'gato gato rato');

      expect(within(demo).getByText('gato')).toBeInTheDocument();
      expect(within(demo).getByText('rato')).toBeInTheDocument();
      expect(within(demo).queryByText('conto')).not.toBeInTheDocument();
      expect(within(demo).getByText('14 / 280')).toBeInTheDocument();
    });

    it('mostra uma dica e desativa o botão quando o texto está vazio', async () => {
      const user = userEvent.setup();
      render(<Root />);
      const demo = screen.getByRole('region', { name: 'Demonstração interativa' });

      await user.clear(within(demo).getByLabelText('Experimente: edite o texto'));

      expect(within(demo).getByText('Digite algo para ver as palavras.')).toBeInTheDocument();
      expect(within(demo).getByRole('button', { name: /analisar no app/i })).toBeDisabled();
    });

    it('limita o tamanho do texto da demonstração', () => {
      render(<Root />);

      expect(screen.getByLabelText('Experimente: edite o texto')).toHaveAttribute(
        'maxlength',
        '280',
      );
    });

    it('leva o texto da demonstração para o app', async () => {
      const user = userEvent.setup();
      render(<Root />);
      const input = screen.getByLabelText('Experimente: edite o texto');

      await user.clear(input);
      await user.type(input, 'sol sol lua');
      await user.click(screen.getByRole('button', { name: /analisar no app/i }));

      expect(window.location.hash).toBe('#/app');
      expect(await screen.findByLabelText('Texto para analisar')).toHaveValue('sol sol lua');
    });
  });

  it('abre o aplicativo quando o endereço é #/app e volta pela landing', async () => {
    const user = userEvent.setup();
    render(<Root />);

    goTo('#/app');
    expect(screen.getByLabelText('Texto para analisar')).toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    const back = screen.getByRole('link', { name: /sobre o projeto/i });
    expect(back).toHaveAttribute('href', '#/');

    // O clique no link já muda o endereço e dispara a navegação.
    await user.click(back);

    expect(
      await screen.findByRole('heading', { level: 1, name: /quais palavras/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Texto para analisar')).not.toBeInTheDocument();
  });

  it('abre o aplicativo direto quando a página já carrega em #/app', () => {
    window.location.hash = '#/app';
    render(<Root />);

    expect(screen.getByLabelText('Texto para analisar')).toBeInTheDocument();
  });

  it('trata âncoras de seção como landing page', () => {
    render(<Root />);

    goTo('#recursos');

    expect(screen.getByRole('heading', { name: 'Bom saber' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Texto para analisar')).not.toBeInTheDocument();
  });
});
