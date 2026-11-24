export type CategoryId = 'all' | 'trees' | 'wreaths' | 'ornaments' | 'lights' | 'frames' | 'gifts'
export type Product = {
  id: string
  name: string
  category: Exclude<CategoryId, 'all'>
  categoryName: string
  description: string
  price: number
  image: string | null
  tone: string
}

export const products: Product[] = [
  { id: 'arvore-verde', name: 'Árvore de Natal Verde', category: 'trees', categoryName: 'Árvores', description: 'Clássica e cheia de presença para reunir a família.', price: 254.90, image: '/products/arvore-verde.webp', tone: 'pine' },
  { id: 'arvore-nevada', name: 'Árvore Nevada', category: 'trees', categoryName: 'Árvores', description: 'Ramos nevados para uma decoração de inverno encantadora.', price: 284.90, image: '/products/arvore-nevada.webp', tone: 'snow' },
  { id: 'mini-arvore', name: 'Mini Árvore de Mesa', category: 'trees', categoryName: 'Árvores', description: 'Um toque natalino para mesas, aparadores e escritórios.', price: 47.90, image: '/products/mini-arvore.webp', tone: 'pine' },
  { id: 'guirlanda-pinhas', name: 'Guirlanda com Pinhas', category: 'wreaths', categoryName: 'Guirlandas', description: 'Folhagens, pinhas e um laço em clima de festa.', price: 74.90, image: '/products/guirlanda-pinhas.webp', tone: 'cranberry' },
  { id: 'guirlanda-frutas', name: 'Guirlanda de Frutas Vermelhas', category: 'wreaths', categoryName: 'Guirlandas', description: 'Um clássico colorido para dar boas-vindas ao Natal.', price: 64.90, image: '/products/guirlanda-frutas.webp', tone: 'cranberry' },
  { id: 'guirlanda-eucalipto', name: 'Guirlanda de Eucalipto', category: 'wreaths', categoryName: 'Guirlandas', description: 'Verde delicado com acabamento elegante e natural.', price: 84.90, image: '/products/guirlanda-eucalipto.webp', tone: 'pine' },
  { id: 'guirlanda-lacos', name: 'Guirlanda de Laços', category: 'wreaths', categoryName: 'Guirlandas', description: 'Laços festivos em uma composição cheia de charme.', price: 69.90, image: '/products/guirlanda-lacos.webp', tone: 'cranberry' },
  { id: 'bolas-douradas', name: 'Bolas Douradas — Conjunto', category: 'ornaments', categoryName: 'Enfeites', description: 'Acabamentos variados para iluminar a árvore.', price: 19.90, image: '/products/bolas-douradas.webp', tone: 'gold' },
  { id: 'bolas-vermelhas', name: 'Bolas Vermelhas — Conjunto', category: 'ornaments', categoryName: 'Enfeites', description: 'Tons de vermelho para uma decoração tradicional.', price: 19.90, image: '/products/bolas-vermelhas.webp', tone: 'cranberry' },
  { id: 'enfeites-xadrez', name: 'Enfeites Xadrez — Conjunto', category: 'ornaments', categoryName: 'Enfeites', description: 'Textura clássica para compor sua árvore natalina.', price: 22.90, image: '/products/enfeites-xadrez.webp', tone: 'pine' },
  { id: 'sinos-dourados', name: 'Sinos Dourados', category: 'ornaments', categoryName: 'Enfeites', description: 'Detalhes metálicos para pendurar na árvore ou na porta.', price: 27.90, image: '/products/sinos-dourados.webp', tone: 'gold' },
  { id: 'flocos-neve', name: 'Flocos de Neve Decorativos', category: 'ornaments', categoryName: 'Enfeites', description: 'Formas delicadas para criar uma decoração de inverno.', price: 14.90, image: '/products/flocos-neve.webp', tone: 'snow' },
  { id: 'estrela-topo', name: 'Estrela para o Topo da Árvore', category: 'ornaments', categoryName: 'Enfeites', description: 'O acabamento especial para a estrela principal da festa.', price: 32.90, image: '/products/estrela-topo.webp', tone: 'gold' },
  { id: 'biscoito-decor', name: 'Biscoitos Decorativos', category: 'ornaments', categoryName: 'Enfeites', description: 'Enfeites com inspiração nos biscoitos de gengibre.', price: 9.90, image: '/products/biscoito-decor.webp', tone: 'cranberry' },
  { id: 'boneco-neve-pendente', name: 'Boneco de Neve Pendente', category: 'ornaments', categoryName: 'Enfeites', description: 'Um personagem simpático para enfeitar a árvore.', price: 12.90, image: '/products/boneco-neve-pendente.webp', tone: 'snow' },
  { id: 'lacos-arvore', name: 'Laços para Árvore', category: 'ornaments', categoryName: 'Enfeites', description: 'Laços decorativos para espalhar cor e textura.', price: 14.90, image: '/products/lacos-arvore.webp', tone: 'cranberry' },
  { id: 'nozes-pendentes', name: 'Nozes Decorativas', category: 'ornaments', categoryName: 'Enfeites', description: 'Enfeites inspirados nos clássicos detalhes de Natal.', price: 19.90, image: '/products/nozes-pendentes.webp', tone: 'gold' },
  { id: 'pingentes-vidro', name: 'Pingentes de Vidro Vermelho', category: 'ornaments', categoryName: 'Enfeites', description: 'Peças brilhantes para dar cor à composição da árvore.', price: 27.90, image: '/products/pingentes-vidro.webp', tone: 'cranberry' },
  { id: 'cordao-luz-amarela', name: 'Cordão de Luz Amarela', category: 'lights', categoryName: 'Luzes', description: 'Iluminação acolhedora para árvore, janela ou aparador.', price: 37.90, image: '/products/cordao-luz-amarela.webp', tone: 'honey' },
  { id: 'luzes-coloridas', name: 'Cordão de Luzes Coloridas', category: 'lights', categoryName: 'Luzes', description: 'Pontos de cor para um Natal alegre e luminoso.', price: 27.90, image: '/products/luzes-coloridas.webp', tone: 'honey' },
  { id: 'fio-led-cobre', name: 'Fio Micro LED Cobre', category: 'lights', categoryName: 'Luzes', description: 'Fio delicado para decorar arranjos e pequenos espaços.', price: 19.90, image: '/products/fio-led-cobre.webp', tone: 'gold' },
  { id: 'vela-led', name: 'Velas LED Decorativas', category: 'lights', categoryName: 'Luzes', description: 'Luz suave para compor a decoração com aconchego.', price: 20.90, image: '/products/vela-led.webp', tone: 'cream' },
  { id: 'lanterna-natalina', name: 'Lanterna Luminosa', category: 'lights', categoryName: 'Luzes', description: 'Um ponto de luz decorativo para a sala ou varanda.', price: 47.90, image: '/products/lanterna-natalina.webp', tone: 'cranberry' },
  { id: 'quadro-personalizavel', name: 'Quadro Personalizável de Natal', category: 'frames', categoryName: 'Quadros', description: 'Uma peça pensada para receber nomes e mensagens especiais.', price: 57.90, image: '/products/quadro-personalizavel.webp', tone: 'cream' },
  { id: 'quadro-floresta', name: 'Quadro Floresta de Inverno', category: 'frames', categoryName: 'Quadros', description: 'Paisagem natalina emoldurada para decorar sua casa.', price: 47.90, image: '/products/quadro-floresta.webp', tone: 'pine' },
  { id: 'porta-retrato-dourado', name: 'Porta-Retrato Dourado', category: 'frames', categoryName: 'Quadros', description: 'Uma moldura festiva para guardar uma lembrança querida.', price: 37.90, image: '/products/porta-retrato-dourado.webp', tone: 'gold' },
  { id: 'placa-porta', name: 'Placa Decorativa para Porta', category: 'frames', categoryName: 'Quadros', description: 'Um detalhe natalino para deixar a entrada mais acolhedora.', price: 27.90, image: '/products/placa-porta.webp', tone: 'cranberry' },
  { id: 'caixa-presente', name: 'Caixa Presenteável', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma apresentação especial para presentear com carinho.', price: 27.90, image: '/products/caixa-presente.webp', tone: 'cranberry' },
  { id: 'meia-natalina', name: 'Meia Natalina Decorativa', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Um clássico para pendurar e completar a decoração.', price: 22.90, image: '/products/meia-natalina.webp', tone: 'pine' },
  { id: 'caneca-natalina', name: 'Caneca Natalina', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma companhia charmosa para bebidas quentinhas.', price: 27.90, image: '/products/caneca-natalina.webp', tone: 'cream' },
  { id: 'globo-neve', name: 'Globo de Neve', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma cena natalina em miniatura para presentear ou decorar.', price: 64.90, image: '/products/globo-neve.webp', tone: 'snow' },
  { id: 'quebra-nozes', name: 'Soldadinho Quebra-Nozes', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Figura decorativa inspirada na tradição natalina.', price: 74.90, image: '/products/quebra-nozes.webp', tone: 'cranberry' },
  { id: 'renas', name: 'Renas Decorativas', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Silhuetas delicadas para aparadores e mesas de festa.', price: 57.90, image: '/products/renas.webp', tone: 'gold' },
  { id: 'papai-noel', name: 'Figura de Papai Noel', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Um personagem festivo para completar a decoração.', price: 64.90, image: '/products/papai-noel.webp', tone: 'cranberry' },
  { id: 'presepio', name: 'Presépio Decorativo', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma representação delicada da tradição natalina.', price: 94.90, image: '/products/presepio.webp', tone: 'cream' },
  { id: 'jogo-americano', name: 'Jogo Americano Natalino', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Um toque festivo para montar a mesa da ceia.', price: 27.90, image: '/products/jogo-americano.webp', tone: 'pine' },
  { id: 'centro-mesa', name: 'Centro de Mesa Natalino', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Um arranjo decorativo para reunir todos à mesa.', price: 57.90, image: '/products/centro-mesa.webp', tone: 'gold' },
  { id: 'vela-aromatica', name: 'Vela Aromática de Natal', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma vela perfumada para criar clima aconchegante.', price: 37.90, image: '/products/vela-aromatica.webp', tone: 'honey' },
  { id: 'almofada-xadrez', name: 'Almofada Xadrez', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Textura macia e estampa clássica para a sala.', price: 47.90, image: '/products/almofada-xadrez.webp', tone: 'cranberry' },
  { id: 'calendario-advento', name: 'Calendário do Advento', category: 'gifts', categoryName: 'Presentes & Casa', description: 'Uma contagem regressiva para celebrar cada dia de dezembro.', price: 84.90, image: '/products/calendario-advento.webp', tone: 'pine' },
]
