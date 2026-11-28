const supportedIds = new Set([
  'arvore-verde', 'arvore-nevada', 'mini-arvore',
  'guirlanda-pinhas', 'guirlanda-frutas', 'guirlanda-eucalipto', 'guirlanda-lacos',
  'globo-neve',
])

export function supports3DPreview(productId: string): boolean {
  return supportedIds.has(productId)
}
