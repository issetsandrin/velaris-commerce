# Velaris

Loja de velas artesanais. Front-end em Next.js 16 (App Router), React 19 e TypeScript. Estilos em CSS Modules sobre tokens globais em `src/app/globals.css` (paleta do cliente: `#f5f0e8`, `#d2b673`, `#b9994d`, `#9a7935`, `#7a5d29`). Ícones de traço fino via `lucide-react`, sempre pelo componente `Icon`. Uma única família tipográfica sem serifa, Manrope, em todo o site, inclusive títulos e logotipo. Os cards da vitrine adicionam sempre o tamanho Média; os três tamanhos ficam na página do produto.

Depende da API Laravel em `../velaris-api` (`NEXT_PUBLIC_API_URL`). Se for acessar pelo IP da rede, use o IP também na URL da API e em `ALLOWED_DEV_ORIGINS`, ver `.env.example`.

## Rodar

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run lint
```

## Estrutura

```
src/
├── app/
│   ├── page.tsx                 # home: hero, destaques, coleções, como fazemos
│   ├── colecao/                 # vitrine com filtros por coleção e família olfativa (query string)
│   ├── produto/[slug]/          # detalhe, seletor de tamanho, adicionar ao carrinho
│   ├── checkout/                # checkout: contatos e endereços em cards, formas de pagamento e parcelas da API, cupom
│   ├── entrar/, cadastro/       # login e criação de conta, com botão do Google (token Sanctum no localStorage)
│   ├── conta/                   # Perfil: dados e catálogo de endereços
│   ├── conta/pedidos/           # Meus pedidos
│   └── layout.tsx               # fontes, AuthProvider, CartProvider, Header, Footer, CartDrawer
├── components/
│   ├── auth/AuthContext.tsx     # usuário autenticado; login, cadastro, Google, saída
│   ├── auth/AuthLayout.tsx      # tela de conta em duas colunas (vela acesa + formulário)
│   ├── auth/GoogleSignInButton  # botão do Google Identity Services (desativado sem Client ID)
│   ├── account/                 # AccountShell (barra lateral), Profile, Orders
│   ├── address/, contact/       # cards e campos de endereço e de contato (nome, telefone, WhatsApp, CPF)
│   ├── config/StoreConfigContext # frete, limites e formas de pagamento vindos de GET /api/config
│   ├── AccountMenu.tsx          # dropdown do cabeçalho: Perfil, Meus pedidos, Sair
│   ├── cart/CartContext.tsx     # carrinho vindo da API; recarrega ao entrar/sair
│   ├── form/Field.tsx           # campo de formulário com erro por campo
│   ├── Icon.tsx                 # wrapper dos ícones Lucide (traço 1,5, cor bronze)
│   ├── cart/CartDrawer.tsx      # gaveta lateral
│   ├── CandleArt.tsx            # ilustração SVG da vela (formato por coleção, cor por aroma)
│   ├── Flame.tsx                # chama animada do hero
│   ├── Header.tsx, Footer.tsx, ProductCard.tsx
└── lib/
    ├── products.ts              # catálogo, coleções, famílias, tamanhos, frete
    └── format.ts                # formatação de moeda pt-BR
```

## Catálogo e carrinho

Produtos, carrinho, contas e pedidos vêm da API (`src/lib/api.ts`). `src/lib/products.ts` guarda apenas tipos e constantes (coleções, famílias, frete). A cor da cera e a coleção definem a ilustração SVG; nenhuma imagem externa é usada.

## Estoque, promoções e cupons

Os tamanhos vêm da API com `price` (preço cobrado agora), `listPrice`, `onSale`, `stock`, `inStock` e `lowStock`. Os cards mostram selo de Promoção, Últimas unidades ou Esgotado; a página do produto marca tamanhos esgotados e limita a quantidade ao estoque. No checkout, o campo de cupom consulta `POST /api/checkout/totais` e o resumo passa a usar os valores do servidor. Frete, máximo por item e formas de pagamento (com desconto e parcelas) vêm de `GET /api/config`, carregado no layout e disponível pelo `StoreConfigProvider`; não há mais valores comerciais fixos no código. Tudo isso é administrado no painel da API em `/admin`.

## Login com Google

Defina `NEXT_PUBLIC_GOOGLE_CLIENT_ID` no `.env.local` com o mesmo Client ID configurado em `GOOGLE_CLIENT_ID` na API. O passo a passo para criar a credencial está no README da `velaris-api`. Sem o Client ID, o botão fica desativado com a explicação.

## Próximos passos para produção

- Ligar o checkout a um gateway de pagamento (Pix e cartão) e a um cálculo real de frete por CEP.
- Recuperação de senha.
- Substituir ou complementar as ilustrações por fotografia dos produtos.
