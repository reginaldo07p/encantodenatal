import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

function standard(color: number, roughness = 0.68, metalness = 0): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}

function addTree(group: THREE.Group, snowy: boolean, mini: boolean) {
  const scale = mini ? 0.55 : 1
  const tree = new THREE.Group()
  tree.scale.setScalar(scale)
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.1, 0.28, 12), standard(0x6d432d))
  trunk.position.y = 0.14
  tree.add(trunk)
  const foliage = standard(snowy ? 0x42644b : 0x174d35)
  const gold = standard(0xd8ad61, 0.32, 0.4)
  const red = standard(0xa9342c, 0.32, 0.15)
  const white = standard(0xf4eee2, 0.48)
  const tiers = [
    { y: 0.47, h: 0.82, r: 0.61 },
    { y: 0.89, h: 0.79, r: 0.51 },
    { y: 1.28, h: 0.72, r: 0.4 },
    { y: 1.63, h: 0.64, r: 0.29 },
    { y: 1.94, h: 0.56, r: 0.18 },
  ]
  tiers.forEach((tier, tierIndex) => {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(tier.r, tier.h, 16), foliage)
    cone.position.y = tier.y
    tree.add(cone)
    if (snowy) {
      const snowCap = new THREE.Mesh(new THREE.ConeGeometry(tier.r * 0.96, tier.h * 0.45, 16), white)
      snowCap.position.y = tier.y + tier.h * 0.12
      snowCap.scale.set(1, 0.48, 1)
      tree.add(snowCap)
    }
    const count = 5 + tierIndex
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2 + tierIndex * 0.55
      const radius = tier.r * 0.74
      const ornament = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), (i + tierIndex) % 2 ? red : gold)
      ornament.position.set(Math.cos(angle) * radius, tier.y - tier.h * 0.2 + ((i % 3) * 0.1), Math.sin(angle) * radius)
      tree.add(ornament)
    }
  })
  const starShape = new THREE.Shape()
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.PI / 2 + i * Math.PI / 5
    const radius = i % 2 === 0 ? 0.16 : 0.07
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) starShape.moveTo(x, y)
    else starShape.lineTo(x, y)
  }
  starShape.closePath()
  const star = new THREE.Mesh(new THREE.ExtrudeGeometry(starShape, { depth: 0.04, bevelEnabled: false }), gold)
  star.position.set(0, 2.18, 0)
  tree.add(star)
  group.add(tree)
}

function addWreath(group: THREE.Group, fruit: boolean, eucalyptus: boolean, bows: boolean) {
  const wreath = new THREE.Group()
  const green = standard(eucalyptus ? 0x719071 : 0x315e3e)
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.13, 10, 56), green)
  wreath.add(torus)
  const leafMaterial = standard(eucalyptus ? 0x9aad8d : 0x426d49)
  for (let i = 0; i < 30; i += 1) {
    const angle = (i / 30) * Math.PI * 2
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), leafMaterial)
    leaf.scale.set(1.4, 0.48, 0.55)
    leaf.position.set(Math.cos(angle) * 0.63, Math.sin(angle) * 0.63, 0.02)
    leaf.rotation.z = angle
    wreath.add(leaf)
  }
  if (fruit || bows) {
    const accent = standard(fruit ? 0xb22f32 : 0xc84236, 0.36)
    for (let i = 0; i < 9; i += 1) {
      const angle = (i / 9) * Math.PI * 2 + 0.25
      const berry = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), accent)
      berry.position.set(Math.cos(angle) * 0.63, Math.sin(angle) * 0.63, 0.13)
      wreath.add(berry)
    }
  }
  if (bows) {
    const bowMat = standard(0xa82f2d, 0.65)
    const left = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), bowMat)
    left.scale.set(1.2, 0.55, 0.3)
    left.position.set(-0.14, -0.82, 0.16)
    const right = left.clone()
    right.position.x = 0.14
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), standard(0xd4ad69))
    knot.position.set(0, -0.82, 0.2)
    wreath.add(left, right, knot)
  }
  group.add(wreath)
}

function addSnowGlobe(group: THREE.Group) {
  const baseMat = standard(0x9b3934, 0.42, 0.12)
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.24, 32), baseMat)
  base.position.y = 0.12
  group.add(base)
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.055, 32), standard(0xd1a75e, 0.3, 0.55))
  rim.position.y = 0.27
  group.add(rim)
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.52, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xe7f0f0, roughness: 0.08, metalness: 0, transmission: 0.65, transparent: true, opacity: 0.35, thickness: 0.12 }))
  glass.position.y = 0.77
  group.add(glass)
  const mini = new THREE.Group()
  addTree(mini, false, true)
  mini.scale.setScalar(0.36)
  mini.position.y = 0.38
  group.add(mini)
  const snow = standard(0xfffdf5, 0.32)
  for (let i = 0; i < 18; i += 1) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.025 + (i % 3) * 0.008, 8, 6), snow)
    const angle = i * 2.4
    dot.position.set(Math.cos(angle) * (0.12 + (i % 4) * 0.07), 0.48 + (i % 6) * 0.13, Math.sin(angle) * (0.1 + (i % 5) * 0.06))
    group.add(dot)
  }
}

function addLantern(group: THREE.Group) {
  const dark = standard(0x443a30, 0.46, 0.28)
  const glass = new THREE.MeshStandardMaterial({ color: 0xffd78a, transparent: true, opacity: 0.16, roughness: 0.22, metalness: 0.06, side: THREE.DoubleSide })
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.12, 0.72), dark)
  base.position.y = 0.06
  group.add(base)
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.1, 0.72), dark)
  top.position.y = 1.1
  group.add(top)
  const pane = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.91, 0.018), glass)
  pane.position.set(0, 0.57, 0.35)
  group.add(pane)
  const paneBack = pane.clone()
  paneBack.position.z = -0.35
  group.add(paneBack)
  for (const x of [-0.4, 0.4]) for (const z of [-0.29, 0.29]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.96, 0.055), dark)
    post.position.set(x, 0.58, z)
    group.add(post)
  }
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.66, 0.34, 4), dark)
  roof.position.y = 1.32
  roof.rotation.y = Math.PI / 4
  group.add(roof)
  const flame = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc45c }))
  flame.scale.y = 1.5
  flame.position.y = 0.43
  group.add(flame)
}

function makeModel(id: string): { model: THREE.Group; targetY: number; cameraDistance: number } {
  const model = new THREE.Group()
  if (id.startsWith('arvore-') || id === 'mini-arvore') {
    addTree(model, id === 'arvore-nevada', id === 'mini-arvore')
    return { model, targetY: id === 'mini-arvore' ? 0.62 : 1.1, cameraDistance: id === 'mini-arvore' ? 3.7 : 4.8 }
  }
  if (id.startsWith('guirlanda-')) {
    addWreath(model, id === 'guirlanda-frutas', id === 'guirlanda-eucalipto', id === 'guirlanda-lacos')
    model.rotation.x = 0
    return { model, targetY: 0, cameraDistance: 3.4 }
  }
  if (id === 'globo-neve') {
    addSnowGlobe(model)
    return { model, targetY: 0.7, cameraDistance: 3.2 }
  }
  addLantern(model)
  return { model, targetY: 0.65, cameraDistance: 3.8 }
}

export default function Product3DPreview({ productId, productName }: { productId: string; productName: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    } catch {
      setUnavailable(true)
      return
    }
    setUnavailable(false)
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf2eee5)
    scene.add(new THREE.HemisphereLight(0xfff4dc, 0x637260, 2.2))
    const keyLight = new THREE.DirectionalLight(0xffedcf, 3.1)
    keyLight.position.set(-3, 5, 4)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xe0e8ff, 1.15)
    fillLight.position.set(3, 2, -3)
    scene.add(fillLight)
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.45, 48), new THREE.MeshStandardMaterial({ color: 0xe6dece, roughness: 0.94 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.015
    scene.add(floor)
    const { model, targetY, cameraDistance } = makeModel(productId)
    scene.add(model)
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(cameraDistance * 0.62, targetY + cameraDistance * 0.45, cameraDistance * 0.82)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
    renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.domElement.setAttribute('aria-label', `Prévia 3D ilustrativa: ${productName}`)
    host.replaceChildren(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.target.set(0, targetY, 0)
    controls.enableDamping = true
    controls.dampingFactor = 0.07
    controls.enablePan = false
    controls.minDistance = cameraDistance * 0.58
    controls.maxDistance = cameraDistance * 1.7
    controls.maxPolarAngle = Math.PI / 2 + 0.03
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.55
    controls.update()
    let frame = 0
    let disposed = false
    const draw = () => {
      if (disposed) return
      frame = window.requestAnimationFrame(draw)
      controls.update()
      renderer.render(scene, camera)
    }
    draw()
    const resize = new ResizeObserver(() => {
      if (!host.clientWidth || !host.clientHeight) return
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight, false)
    })
    resize.observe(host)
    return () => {
      disposed = true
      window.cancelAnimationFrame(frame)
      resize.disconnect()
      controls.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          materials.forEach((material) => material.dispose())
        }
      })
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [productId, productName])

  return <div className="product-3d-preview" ref={hostRef} role="img" aria-label={`Prévia 3D ilustrativa de ${productName}`}>
    {unavailable && <div className="product-3d-unavailable">A prévia 3D não está disponível neste navegador.</div>}
  </div>
}
