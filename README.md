# JB Imports Confecções

Loja de roupas dry fit para atacado, com foco em dispositivos móveis. Next.js, React, PostgreSQL (Supabase) e publicação na Vercel.

## Funcionalidades

- Catálogo, busca, categorias, ordenação, favoritos e carrinho.
- Variações de tamanho/cor, pedido mínimo e cupons.
- Cadastro, login e histórico de pedidos do cliente.
- Administração de produtos, fotos, estoque total, pedidos, clientes, cupons e informações da loja em `/admin`.
- Banco e fotos persistidos no schema privado `jb_store` do Supabase. As fotos enviadas são armazenadas no PostgreSQL; não é necessária uma chave de serviço do Supabase.
- Senhas de clientes com PBKDF2/salt, cookies HttpOnly e controle de acesso administrativo no servidor.

## Desenvolvimento

Node.js 22 ou superior:

```sh
npm ci
cp .env.example .env.local
# Preencha .env.local com credenciais reais.
npm run db:migrate
npm run dev
```

Vitrine: `http://localhost:5173`. Administração: `http://localhost:5173/admin`.

```sh
npm run typecheck
npm run build
npm start
```

`DATABASE_URL` usa o pooler de transações. `DIRECT_URL` usa o pooler de sessões para as migrações. Configure `ADMIN_EMAIL` e `ADMIN_PASSWORD` somente no servidor. Não use prefixo `NEXT_PUBLIC_` para credenciais.

A migração é não destrutiva e trabalha exclusivamente no schema `jb_store`. Não modifica tabelas de outros projetos ou schemas. O catálogo inicial contém oito produtos fictícios e o cupom demonstrativo `BEMVINDO10`. O catálogo é criado na primeira consulta após a migração.

## Vercel

Importe o repositório como um projeto Next.js. Cadastre `DATABASE_URL`, `DIRECT_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` nas variáveis de ambiente. Aplique a migração pelo ambiente autorizado antes da primeira publicação. `vercel.json` define a região próxima ao banco e o tempo máximo das rotas de API.

As credenciais e os arquivos de acesso local estão excluídos do Git e do pacote da Vercel. Novos commits na branch `main` publicam pela integração GitHub/Vercel quando conectada.

## Operação atual

Os produtos, preços e algumas imagens são demonstrativos. O estoque é total por produto e gerenciado manualmente. Pedidos são solicitações para atendimento, sem reserva automática de peças ou cobrança. A loja confirma a disponibilidade, frete e pagamento antes da conclusão.

Mercado Pago e Melhor Envio ainda não têm integração ativa. A seção Integrações do painel apresenta os próximos passos. Apenas preencher tokens não ativa esses serviços; os fluxos e webhooks ainda precisam ser implementados e testados.

Não há recuperação de senha por e-mail nesta versão. Imagens JPG, PNG e WebP são aceitas até 4 MB por envio. Substitua os contatos e textos da loja antes da operação comercial.
