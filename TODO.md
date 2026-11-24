# Encanto de Natal — catálogo e checkout

- [x] Remover o criativo promocional enviado pelo usuário; ele não é usado na página.
- [x] Preparar 40 produtos natalinos, categorias, busca e preços Black Friday de queima de estoque; reduzir R$ 10 nos itens abaixo de R$ 30, R$ 12 nos itens de R$ 30 a R$ 69,90 e R$ 15 nos itens de R$ 70 ou mais, sem exibir preço anterior ou percentual de desconto inventado.
- [x] Importar as 30 imagens enviadas em ZIPs para os produtos correspondentes. Dez já eram WebP; dez eram PNGs identificadas incorretamente com extensão `.jpg`, foram convertidas para WebP sem alterar os arquivos originais; as dez fotos restantes também chegaram em WebP. As imagens foram enviadas ao armazenamento do projeto.
- [x] Corrigir a área visual dos cartões de produto, que colapsava por falta de proporção/altura; o Preview agora exibe as imagens nos cartões que já têm foto real.
- [x] Completar imagens reais nos produtos Sinos Dourados, Flocos de Neve Decorativos, Estrela para o Topo da Árvore, Biscoitos Decorativos, Boneco de Neve Pendente, Laços para Árvore, Nozes Decorativas, Pingentes de Vidro Vermelho, Cordão de Luz Amarela e Cordão de Luzes Coloridas. Os WebPs enviados pelo usuário substituem os links assíncronos pendentes.
- [x] Abrir uma ficha de produto ao tocar na foto ou no nome, mostrando imagem/estado da foto, categoria, descrição, preço Black Friday e ação para adicionar à sacola; fechar pelo botão, pelo fundo ou pela tecla Esc.
- [x] Mostrar nas fichas de todos os 40 produtos tamanho, cores, material e conteúdo da embalagem, conforme confirmado pelo usuário.
- [x] Preparar a interface demonstrativa do checkout com formulário de contato e endereço, status de pagamento ainda não configurado e resumo do pedido; antes da integração real, não enviar nem salvar dados ou processar pedidos/pagamentos.
- [x] Aplicar a regra de frete informada: frete grátis para subtotal de produtos a partir de R$ 150,00; frete fixo de R$ 14,90 para subtotal abaixo desse limite. Mostrar subtotal, frete, total e o valor que falta para atingir a faixa grátis.
- [x] Copiar as 40 imagens WebP para `public/products/` e substituir referências ao armazenamento exclusivo da Manus por caminhos locais compatíveis com Vercel.
- [ ] Integrar a cobrança Pix pela BearPay.online com a chave mantida apenas no backend; não criar cobranças reais em testes.
- [ ] Armazenar com segurança os dados de contato/endereço do pedido e relacioná-los ao status de pagamento para permitir a separação e o envio; provedor de banco e autorização ainda pendentes.
- [ ] Publicar e verificar a loja na Vercel sem tirar a Manus do ar antes da confirmação; resolver o repositório Git ligado ao projeto Vercel existente e a proteção de acesso SSO antes da publicação pública.
