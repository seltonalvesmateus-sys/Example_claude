import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { MAX_CHARS } from './lib/constants';

describe('App', () => {
  it('mostra a caixa de texto, o botão Translate e a tabela', () => {
    render(<App />);

    expect(screen.getByLabelText('Texto para analisar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Translate' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('limita a caixa de texto a MAX_CHARS caracteres', () => {
    render(<App />);

    expect(screen.getByLabelText('Texto para analisar')).toHaveAttribute(
      'maxlength',
      String(MAX_CHARS),
    );
  });

  it('preenche a tabela em ordem decrescente ao clicar em Translate', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol lua sol mar sol lua');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
    const content = rows.map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((c) => c.textContent),
    );

    expect(content).toEqual([
      ['sol', '3'],
      ['lua', '2'],
      ['mar', '1'],
    ]);
  });

  it('mostra erro quando o texto está vazio', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Digite ou cole um texto');
    expect(screen.getByLabelText('Texto para analisar')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Texto para analisar')).toHaveFocus();
  });

  it('mostra erro quando o texto tem só espaços e quebras de linha', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), '   {Enter}  ');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Digite ou cole um texto');
  });

  it('limpa o erro quando o usuário volta a digitar', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Translate' }));
    await user.type(screen.getByLabelText('Texto para analisar'), 'a');

    expect(screen.getByRole('alert')).toBeEmptyDOMElement();
    expect(screen.getByLabelText('Texto para analisar')).not.toHaveAttribute('aria-invalid');
  });

  it('esvazia a tabela quando uma nova análise falha por texto vazio', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('Texto para analisar');

    await user.type(input, 'sol');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    await user.clear(input);
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(within(screen.getByRole('table')).queryByText('sol')).not.toBeInTheDocument();
  });

  it('mostra o estado vazio antes da primeira análise', () => {
    render(<App />);

    expect(screen.getByText(/Nenhum resultado ainda/)).toBeInTheDocument();
  });

  it('avisa quando o texto não tem nenhuma palavra', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), '!!! ???');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(screen.getByText('Nenhuma palavra encontrada no texto.')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeEmptyDOMElement();
  });

  it('atualiza o contador de caracteres', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(`0 / ${MAX_CHARS}`)).toBeInTheDocument();

    await user.type(screen.getByLabelText('Texto para analisar'), 'abc');

    expect(screen.getByText(`3 / ${MAX_CHARS}`)).toBeInTheDocument();
  });

  it('avisa ao atingir o limite de caracteres e não aceita mais texto', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('Texto para analisar');

    await user.click(input);
    await user.paste('a'.repeat(MAX_CHARS + 100));

    expect(input).toHaveValue('a'.repeat(MAX_CHARS));
    expect(screen.getByText(`${MAX_CHARS} / ${MAX_CHARS} (limite atingido)`)).toBeInTheDocument();
  });

  it('analisa com Ctrl+Enter', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol lua');
    await user.keyboard('{Control>}{Enter}{/Control}');

    expect(within(screen.getByRole('table')).getByText('sol')).toBeInTheDocument();
  });

  it('cola o exemplo e limpa tudo com o botão Limpar', async () => {
    const user = userEvent.setup();
    render(<App />);
    const input = screen.getByLabelText('Texto para analisar');

    await user.click(screen.getByRole('button', { name: 'Colar exemplo' }));
    expect((input as HTMLTextAreaElement).value.length).toBeGreaterThan(100);
    expect((input as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(MAX_CHARS);

    await user.click(screen.getByRole('button', { name: 'Translate' }));
    expect(screen.getByText('Total de palavras')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar texto' }));
    expect(input).toHaveValue('');
    expect(screen.queryByText('Total de palavras')).not.toBeInTheDocument();
    expect(screen.getByText(/Nenhum resultado ainda/)).toBeInTheDocument();
  });

  it('mostra o resumo com total, únicas e mais frequente', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol sol lua mar');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(screen.getByText('Total de palavras').nextElementSibling).toHaveTextContent('5');
    expect(screen.getByText('Palavras únicas').nextElementSibling).toHaveTextContent('3');
    expect(screen.getByText('Mais frequente').nextElementSibling).toHaveTextContent('sol (3×)');
  });

  it('reprocessa ao ignorar stopwords, sem clicar de novo', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'o gato e o rato');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    const table = screen.getByRole('table');
    expect(within(table).getByText('o')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Ignorar palavras comuns'), 'pt');

    expect(within(table).queryByText('o')).not.toBeInTheDocument();
    expect(within(table).getByText('gato')).toBeInTheDocument();
  });

  it('diferencia maiúsculas de minúsculas quando a opção é marcada', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'Casa casa');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(2);

    await user.click(screen.getByLabelText('Diferenciar maiúsculas de minúsculas'));

    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(within(table).getByText('Casa')).toBeInTheDocument();
  });

  it('filtra a tabela pela busca', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'gato gata rato');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    const table = screen.getByRole('table');

    await user.type(screen.getByLabelText('Filtrar palavras'), 'gat');
    expect(within(table).queryByText('rato')).not.toBeInTheDocument();
    expect(within(table).getByText('gato')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Filtrar palavras'));
    await user.type(screen.getByLabelText('Filtrar palavras'), 'xyz');
    expect(screen.getByText('Nenhuma palavra corresponde ao filtro.')).toBeInTheDocument();
  });

  it('alterna o gráfico entre colunas e bolhas', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol lua');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    const chart = screen.getByRole('region', { name: 'Gráfico de frequência' });
    expect(within(chart).getByRole('button', { name: 'Colunas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(within(chart).getByRole('button', { name: 'Bolhas' }));

    expect(within(chart).getByRole('button', { name: 'Bolhas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(chart).getByText('sol')).toBeInTheDocument();
  });

  it('mostra nuvem, pizza e distribuição de tamanho no gráfico', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol lua mar mar mar');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    const chart = screen.getByRole('region', { name: 'Gráfico de frequência' });

    await user.click(within(chart).getByRole('button', { name: 'Nuvem' }));
    expect(within(chart).getByText('Nuvem de palavras')).toBeInTheDocument();
    expect(within(chart).getByText('mar')).toBeInTheDocument();

    await user.click(within(chart).getByRole('button', { name: 'Pizza' }));
    expect(within(chart).getByRole('img', { name: 'Gráfico de pizza' })).toBeInTheDocument();
    expect(within(chart).getByText('50.0%')).toBeInTheDocument();

    await user.click(within(chart).getByRole('button', { name: 'Tamanho' }));
    expect(within(chart).getByText('Palavras por número de letras')).toBeInTheDocument();
  });

  it('lembra o texto e as opções depois de recarregar', async () => {
    const user = userEvent.setup();
    const first = render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol e lua');
    await user.click(screen.getByLabelText('Diferenciar maiúsculas de minúsculas'));
    await user.selectOptions(screen.getByLabelText('Ignorar palavras comuns'), 'pt');
    first.unmount();

    render(<App />);

    expect(screen.getByLabelText('Texto para analisar')).toHaveValue('sol e lua');
    expect(screen.getByLabelText('Diferenciar maiúsculas de minúsculas')).toBeChecked();
    expect(screen.getByLabelText('Ignorar palavras comuns')).toHaveValue('pt');
  });

  it('ignora valores inválidos guardados no navegador', () => {
    localStorage.setItem('wf:stopwords', JSON.stringify('klingon'));
    localStorage.setItem('wf:text', JSON.stringify(42));

    render(<App />);

    expect(screen.getByLabelText('Ignorar palavras comuns')).toHaveValue('none');
    expect(screen.getByLabelText('Texto para analisar')).toHaveValue('');
  });

  it('alterna o tema entre sistema, claro e escuro', async () => {
    const user = userEvent.setup();
    render(<App />);
    const toggle = () => screen.getByRole('button', { name: /^Tema:/ });

    expect(toggle()).toHaveAccessibleName(/Sistema/);
    expect(document.documentElement.dataset.theme).toBeUndefined();

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName(/Claro/);
    expect(document.documentElement.dataset.theme).toBe('light');

    await user.click(toggle());
    expect(toggle()).toHaveAccessibleName(/Escuro/);
    expect(document.documentElement.dataset.theme).toBe('dark');

    await user.click(toggle());
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it('ordena a tabela ao clicar nos cabeçalhos', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(
      screen.getByLabelText('Texto para analisar'),
      'zebra zebra abelha macaco macaco macaco',
    );
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    const table = screen.getByRole('table');
    const words = () =>
      within(table)
        .getAllByRole('row')
        .slice(1)
        .map((row) => within(row).getAllByRole('cell')[0].textContent);

    expect(words()).toEqual(['macaco', 'zebra', 'abelha']);

    await user.click(within(table).getByRole('button', { name: /^Palavra/ }));
    expect(words()).toEqual(['abelha', 'macaco', 'zebra']);

    await user.click(within(table).getByRole('button', { name: /^Palavra/ }));
    expect(words()).toEqual(['zebra', 'macaco', 'abelha']);

    await user.click(within(table).getByRole('button', { name: /^Ocorrências/ }));
    expect(words()).toEqual(['macaco', 'zebra', 'abelha']);
    await user.click(within(table).getByRole('button', { name: /^Ocorrências/ }));
    expect(words()).toEqual(['abelha', 'zebra', 'macaco']);
  });

  it('carrega um arquivo .txt na caixa de texto', async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(['gato gato rato'], 'bichos.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText('Abrir arquivo de texto'), file);

    expect(await screen.findByText('Arquivo "bichos.txt" carregado.')).toBeInTheDocument();
    expect(screen.getByLabelText('Texto para analisar')).toHaveValue('gato gato rato');
  });

  it('corta arquivos maiores que o limite e avisa', async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(['a'.repeat(MAX_CHARS + 500)], 'grande.txt', { type: 'text/plain' });
    await user.upload(screen.getByLabelText('Abrir arquivo de texto'), file);

    expect(
      await screen.findByText(new RegExp(`usamos só os primeiros ${MAX_CHARS}`)),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Texto para analisar')).toHaveValue('a'.repeat(MAX_CHARS));
  });

  it('mostra erro ao receber um arquivo que não é texto', async () => {
    const user = userEvent.setup({ applyAccept: false });
    render(<App />);

    const file = new File(['x'], 'foto.png', { type: 'image/png' });
    await user.upload(screen.getByLabelText('Abrir arquivo de texto'), file);

    expect(await screen.findByRole('alert')).toHaveTextContent('Selecione um arquivo de texto');
  });

  it('carrega um arquivo solto sobre a caixa de texto', async () => {
    render(<App />);
    const input = screen.getByLabelText('Texto para analisar');
    const file = new File(['sol lua'], 'dia.txt', { type: 'text/plain' });

    fireEvent.drop(input, { dataTransfer: { files: [file] } });

    expect(await screen.findByText('Arquivo "dia.txt" carregado.')).toBeInTheDocument();
    expect(input).toHaveValue('sol lua');
  });

  describe('buscar texto por URL', () => {
    function stubApi(status: number, body: unknown) {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(body),
      });
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('preenche a caixa de texto com o conteúdo da página', async () => {
      const user = userEvent.setup();
      const fetchMock = stubApi(200, { title: 'Meu Artigo', text: 'gato gato rato' });
      render(<App />);

      await user.type(
        screen.getByLabelText(/busque o texto de uma página/),
        'https://exemplo.com/a',
      );
      await user.click(screen.getByRole('button', { name: 'Buscar texto' }));

      expect(await screen.findByText('Texto de "Meu Artigo" carregado.')).toBeInTheDocument();
      expect(screen.getByLabelText('Texto para analisar')).toHaveValue('gato gato rato');
      expect(fetchMock).toHaveBeenCalledWith('/api/extract?url=https%3A%2F%2Fexemplo.com%2Fa');
    });

    it('busca ao apertar Enter e acrescenta https:// quando falta', async () => {
      const user = userEvent.setup();
      const fetchMock = stubApi(200, { title: 'X', text: 'oi' });
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'exemplo.com{Enter}');

      expect(await screen.findByText('Texto de "X" carregado.')).toBeInTheDocument();
      expect(fetchMock).toHaveBeenCalledWith('/api/extract?url=https%3A%2F%2Fexemplo.com%2F');
    });

    it('corta páginas longas no limite e avisa', async () => {
      const user = userEvent.setup();
      stubApi(200, { title: 'Longa', text: 'a'.repeat(MAX_CHARS + 50) });
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'exemplo.com{Enter}');

      expect(
        await screen.findByText(new RegExp(`usamos só os primeiros ${MAX_CHARS}`)),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Texto para analisar')).toHaveValue('a'.repeat(MAX_CHARS));
    });

    it('mostra erro sem chamar a API quando o campo está vazio', async () => {
      const user = userEvent.setup();
      const fetchMock = stubApi(200, { title: '', text: 'x' });
      render(<App />);

      await user.click(screen.getByRole('button', { name: 'Buscar texto' }));

      // O erro da URL é anunciado como alerta; busca pelo texto porque o erro do campo de
      // texto também tem role="alert" (vazio) e ficaria ambíguo.
      const message = await screen.findByText('Digite o endereço de uma página.');
      expect(message).toHaveAttribute('role', 'alert');
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('mostra a mensagem de erro devolvida pelo servidor', async () => {
      const user = userEvent.setup();
      stubApi(400, { error: 'Esse endereço não é permitido.' });
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'localhost{Enter}');

      expect(await screen.findByText('Esse endereço não é permitido.')).toHaveAttribute(
        'role',
        'alert',
      );
      expect(screen.getByLabelText('Texto para analisar')).toHaveValue('');
    });

    it('avisa quando o servidor de busca está fora do ar', async () => {
      const user = userEvent.setup();
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'exemplo.com{Enter}');

      expect(await screen.findByText(/npm run dev:all/)).toHaveAttribute('role', 'alert');
    });

    it('desativa o botão enquanto busca', async () => {
      const user = userEvent.setup();
      vi.stubGlobal(
        'fetch',
        vi.fn(() => new Promise(() => {})),
      );
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'exemplo.com{Enter}');

      expect(await screen.findByRole('button', { name: 'Buscando...' })).toBeDisabled();
    });

    it('permite analisar o texto buscado', async () => {
      const user = userEvent.setup();
      stubApi(200, { title: 'T', text: 'sol sol lua' });
      render(<App />);

      await user.type(screen.getByLabelText(/busque o texto de uma página/), 'exemplo.com{Enter}');
      await screen.findByText('Texto de "T" carregado.');
      await user.click(screen.getByRole('button', { name: 'Translate' }));

      expect(within(screen.getByRole('table')).getByText('sol')).toBeInTheDocument();
    });
  });

  it('oferece o botão de salvar em CSV, desativado quando o filtro não acha nada', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol lua');
    await user.click(screen.getByRole('button', { name: 'Translate' }));
    expect(screen.getByRole('button', { name: 'Salvar em CSV' })).toBeEnabled();

    await user.type(screen.getByLabelText('Filtrar palavras'), 'xyz');
    expect(screen.getByRole('button', { name: 'Salvar em CSV' })).toBeDisabled();
  });

  it('oferece o botão de baixar o gráfico em PNG', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol lua');
    await user.click(screen.getByRole('button', { name: 'Translate' }));

    expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeEnabled();
  });

  it('não atualiza a tabela antes de clicar no botão', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Texto para analisar'), 'sol sol');

    expect(within(screen.getByRole('table')).queryByText('sol')).not.toBeInTheDocument();
  });
});
