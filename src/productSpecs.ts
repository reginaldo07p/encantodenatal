export type ProductSpecs = {
  size: string
  colors: string
  material: string
  contents: string
}

// Informações de catálogo dos produtos.
export const productSpecs: Record<string, ProductSpecs> = {
  'arvore-verde': { size: 'Altura: aprox. 1,80 m.', colors: 'Verde; decoração em vermelho e dourado como combinação.', material: 'Ramos de PVC e estrutura metálica.', contents: '1 árvore com base incluída.' },
  'arvore-nevada': { size: 'Altura: aprox. 1,80 m.', colors: 'Verde com efeito nevado branco.', material: 'Ramos de PVC com acabamento nevado e estrutura metálica.', contents: '1 árvore com base incluída.' },
  'mini-arvore': { size: 'Altura: aprox. 45 cm.', colors: 'Verde, com detalhes festivos em vermelho e dourado.', material: 'Ramos sintéticos e base.', contents: '1 mini árvore decorativa.' },
  'guirlanda-pinhas': { size: 'Diâmetro: aprox. 35 cm.', colors: 'Verde e tons naturais, com laço vermelho.', material: 'Folhagem artificial, pinhas e laço.', contents: '1 guirlanda decorativa.' },
  'guirlanda-frutas': { size: 'Diâmetro: aprox. 35 cm.', colors: 'Verde e vermelho, com frutas decorativas.', material: 'Folhagem e frutas artificiais.', contents: '1 guirlanda decorativa.' },
  'guirlanda-eucalipto': { size: 'Diâmetro: aprox. 35 cm.', colors: 'Verde eucalipto; detalhes neutros.', material: 'Folhagem artificial.', contents: '1 guirlanda decorativa.' },
  'guirlanda-lacos': { size: 'Diâmetro: aprox. 35 cm.', colors: 'Verde com laços vermelhos e dourados.', material: 'Folhagem e laços têxteis.', contents: '1 guirlanda decorativa.' },
  'bolas-douradas': { size: 'Bolas: aprox. 6–8 cm cada.', colors: 'Dourado em acabamentos variados.', material: 'Plástico decorativo.', contents: 'Conjunto com 6 bolas.' },
  'bolas-vermelhas': { size: 'Bolas: aprox. 6–8 cm cada.', colors: 'Vermelho em acabamentos variados.', material: 'Plástico decorativo.', contents: 'Conjunto com 6 bolas.' },
  'enfeites-xadrez': { size: 'Enfeites: aprox. 7–9 cm.', colors: 'Xadrez vermelho e verde.', material: 'Tecido ou plástico revestido.', contents: 'Conjunto com 4 enfeites.' },
  'sinos-dourados': { size: 'Altura: aprox. 7–9 cm por sino.', colors: 'Dourado metálico.', material: 'Metal ou liga metálica.', contents: 'Par com 2 sinos.' },
  'flocos-neve': { size: 'Diâmetro: aprox. 8–10 cm.', colors: 'Branco, prata ou translúcido.', material: 'Acrílico decorativo.', contents: 'Conjunto com 6 flocos.' },
  'estrela-topo': { size: 'Altura: aprox. 20–25 cm.', colors: 'Dourado; acabamento brilhante.', material: 'Plástico rígido ou metal leve.', contents: '1 ponteira decorativa.' },
  'biscoito-decor': { size: 'Altura: aprox. 8–10 cm por peça.', colors: 'Marrom, branco e vermelho.', material: 'Resina, feltro ou massa decorativa.', contents: 'Conjunto com 3 enfeites.' },
  'boneco-neve-pendente': { size: 'Altura: aprox. 10–12 cm.', colors: 'Branco com detalhes vermelhos e verdes.', material: 'Feltro ou resina.', contents: '1 enfeite pendente.' },
  'lacos-arvore': { size: 'Largura: aprox. 10–12 cm por laço.', colors: 'Vermelho natalino.', material: 'Fita têxtil.', contents: 'Conjunto com 6 laços.' },
  'nozes-pendentes': { size: 'Altura: aprox. 5–7 cm por peça.', colors: 'Dourado, cobre ou tons naturais.', material: 'Resina ou plástico decorativo.', contents: 'Conjunto com 6 enfeites.' },
  'pingentes-vidro': { size: 'Altura: aprox. 6–8 cm por peça.', colors: 'Vermelho translúcido.', material: 'Vidro.', contents: 'Conjunto com 4 pingentes.' },
  'cordao-luz-amarela': { size: 'Comprimento: aprox. 5 m.', colors: 'Luz amarela quente; fio transparente.', material: 'Fio elétrico e LEDs.', contents: '1 cordão de luzes LED.' },
  'luzes-coloridas': { size: 'Comprimento: aprox. 5 m.', colors: 'Lâmpadas multicoloridas; fio verde ou transparente.', material: 'Fio elétrico e LEDs.', contents: '1 cordão de luzes LED.' },
  'fio-led-cobre': { size: 'Comprimento: aprox. 2 m.', colors: 'Fio cor de cobre com luz quente.', material: 'Fio metálico flexível e micro LEDs.', contents: '1 fio luminoso com LEDs.' },
  'vela-led': { size: 'Altura: aprox. 12 cm por vela.', colors: 'Marfim ou branco quente.', material: 'Corpo de efeito cera e componente LED.', contents: 'Conjunto com 2 velas LED.' },
  'lanterna-natalina': { size: 'Altura: aprox. 25 cm.', colors: 'Preto ou dourado envelhecido com detalhes natalinos.', material: 'Estrutura metálica e painéis transparentes.', contents: '1 lanterna decorativa com iluminação LED.' },
  'quadro-personalizavel': { size: 'Formato: aprox. 20 × 30 cm.', colors: 'Fundo creme com detalhes vermelhos e dourados.', material: 'Moldura de madeira ou MDF e impressão.', contents: '1 quadro personalizado com nomes e mensagem.' },
  'quadro-floresta': { size: 'Formato: aprox. 20 × 30 cm.', colors: 'Verdes, branco nevado e tons de inverno.', material: 'Moldura de madeira ou MDF e impressão.', contents: '1 quadro decorativo.' },
  'porta-retrato-dourado': { size: 'Foto compatível: 10 × 15 cm.', colors: 'Dourado.', material: 'Moldura de resina ou metal.', contents: '1 porta-retrato; foto não incluída.' },
  'placa-porta': { size: 'Formato: aprox. 20 × 30 cm.', colors: 'Vermelho, verde e dourado.', material: 'MDF ou madeira decorada.', contents: '1 placa decorativa com suporte para pendurar.' },
  'caixa-presente': { size: 'Dimensões: aprox. 20 × 15 × 10 cm.', colors: 'Vermelho com detalhes dourados.', material: 'Papel-cartão rígido.', contents: '1 caixa vazia para presente.' },
  'meia-natalina': { size: 'Altura: aprox. 40 cm.', colors: 'Vermelho e verde.', material: 'Feltro ou tecido.', contents: '1 meia decorativa; itens de enchimento não incluídos.' },
  'caneca-natalina': { size: 'Capacidade: aprox. 300 ml.', colors: 'Creme com estampa natalina colorida.', material: 'Cerâmica.', contents: '1 caneca.' },
  'globo-neve': { size: 'Altura: aprox. 10–12 cm.', colors: 'Base em tons natalinos; interior com cena de inverno.', material: 'Globo transparente e base decorativa.', contents: '1 globo de neve.' },
  'quebra-nozes': { size: 'Altura: aprox. 30 cm.', colors: 'Vermelho, verde e dourado.', material: 'Madeira ou resina.', contents: '1 figura decorativa.' },
  'renas': { size: 'Altura: aprox. 15–20 cm por peça.', colors: 'Dourado ou madeira natural.', material: 'Resina, madeira ou metal.', contents: 'Par com 2 renas.' },
  'papai-noel': { size: 'Altura: aprox. 25 cm.', colors: 'Vermelho, branco e detalhes dourados.', material: 'Tecido e enchimento ou resina.', contents: '1 figura decorativa.' },
  'presepio': { size: 'Conjunto: figuras de aprox. 8–12 cm.', colors: 'Tons naturais, creme e dourado.', material: 'Resina, madeira ou cerâmica.', contents: 'Conjunto com 5 peças.' },
  'jogo-americano': { size: 'Diâmetro: aprox. 38 cm (modelo redondo).', colors: 'Verde e vermelho com estampa natalina.', material: 'Tecido ou material sintético lavável.', contents: 'Conjunto com 4 unidades.' },
  'centro-mesa': { size: 'Diâmetro: aprox. 25–30 cm.', colors: 'Verde com detalhes dourados e vermelhos.', material: 'Folhagem artificial e base decorativa.', contents: '1 arranjo de centro de mesa.' },
  'vela-aromatica': { size: 'Peso: aprox. 180–200 g.', colors: 'Cera em tom creme; recipiente transparente ou âmbar.', material: 'Cera e recipiente de vidro.', contents: '1 vela aromática.' },
  'almofada-xadrez': { size: 'Formato: aprox. 45 × 45 cm.', colors: 'Xadrez vermelho e verde.', material: 'Capa têxtil com composição e enchimento acolchoado.', contents: '1 almofada com enchimento.' },
  'calendario-advento': { size: 'Formato: aprox. 30 × 20 cm.', colors: 'Verde, vermelho e detalhes dourados.', material: 'Madeira, MDF ou cartão rígido.', contents: '1 calendário com compartimentos.' },
}
