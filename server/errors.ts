/** Erro com status HTTP e mensagem já pronta para o usuário (em português). */
export class ExtractError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ExtractError';
    this.status = status;
  }
}
