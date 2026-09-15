/**
 * Telas de conta: têm layout próprio, de tela cheia, com a marca dentro do
 * painel. A barra do topo, o rodapé e a faixa de aviso da loja ficam de fora
 * delas para não duplicar identidade nem empurrar o formulário para baixo.
 */
export const ROTAS_DE_CONTA = [
  "/entrar",
  "/cadastro",
  "/esqueci-senha",
  "/redefinir-senha",
  "/confirmar-email",
];

export function eRotaDeConta(pathname: string): boolean {
  return ROTAS_DE_CONTA.includes(pathname);
}
