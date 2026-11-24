# Configuração do checkout BearPay

O frontend nunca recebe a chave BearPay. O endpoint `/api/checkout` usa a chave apenas no runtime server-side Vercel. O endpoint `/api/bearpay-webhook` confirma pagamentos por HMAC-SHA256 do corpo bruto e atualiza o pedido; eventos repetidos são tratados de forma idempotente.

## Variáveis de ambiente

O checkout de produção requer:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BEARPAY_API_KEY` — chave de produção BearPay guardada apenas no ambiente **Production** da Vercel.
- `BEARPAY_WEBHOOK_SECRET` — segredo de assinatura do webhook BearPay, também apenas em **Production**.

A Preview usa os nomes Supabase existentes, mas o código não acessa o banco nem a BearPay fora de `VERCEL_ENV=production`. A simulação valida produtos e frete e descarta dados pessoais. Não coloque as chaves BearPay em Preview, Vite, `VITE_*`, arquivos `.env`, Git ou no navegador.

## BearPay

Cadastre no painel BearPay um webhook HTTPS `POST` para `https://encantonatal.vercel.app/api/bearpay-webhook` e habilite os eventos `charge.paid` e `charge.expired`. Guarde o segredo de assinatura fornecido pelo painel em `BEARPAY_WEBHOOK_SECRET`. A resposta do site valida `X-BearPay-Signature` sobre o corpo bruto, com o prefixo `sha256=`.

A implementação envia `amount` em reais, `method: "pix"`, `external_id` idempotente, nome/e-mail/telefone do cliente e `metadata.order_id`. O site exibe QR Code e código copia-e-cola localmente.

## Dados e segurança

A migração em `supabase/migrations/20261124_checkout_orders.sql` cria `store_orders` e `bearpay_events`. RLS está habilitado, não há políticas públicas e o acesso é feito somente pelo backend com `SUPABASE_SERVICE_ROLE_KEY`. Os eventos armazenam metadados mínimos, nunca o payload bruto nem dados de cliente.

Não execute cobranças de teste. Para verificar webhooks, use o recurso oficial BearPay de envio fictício `charge.paid` com `test: true`; o endpoint valida a assinatura e responde sem alterar pedidos. A Preview sempre descarta esse evento e os dados enviados.
