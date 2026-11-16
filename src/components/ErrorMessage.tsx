import styles from './ErrorMessage.module.css';

type ErrorMessageProps = {
  id: string;
  message: string | null;
};

// O contêiner fica sempre no DOM para que leitores de tela anunciem a mensagem quando ela aparece.
export function ErrorMessage({ id, message }: ErrorMessageProps) {
  return (
    <div id={id} role="alert" aria-live="assertive" className={styles.error}>
      {message}
    </div>
  );
}
