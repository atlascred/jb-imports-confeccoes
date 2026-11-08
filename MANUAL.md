# Uso da loja

Acesse `/admin` com as credenciais locais de `ACESSO-ADMIN.local.txt`. Esse arquivo é privado, não é enviado ao GitHub e não faz parte da publicação na Vercel.

O catálogo inicial tem oito produtos fictícios, pedido mínimo de dez peças no total e cupom `BEMVINDO10`. Produtos, fotos, estoque total, pedidos, clientes, cupons e dados da loja são administrados no painel.

Pedidos são solicitações para atendimento. Não são cobrados online; frete e pagamento são confirmados manualmente. Estoque é controlado manualmente por produto. Mercado Pago e Melhor Envio ainda não possuem integração ativa.

Os dados ficam no schema privado `jb_store` no Supabase. Fotos enviadas pelo painel também são armazenadas no PostgreSQL. As senhas e URLs de conexão ficam nas variáveis de ambiente locais e da Vercel, nunca no código público.

Para desenvolver, configurar o banco, testar ou publicar, consulte [README.md](README.md).
