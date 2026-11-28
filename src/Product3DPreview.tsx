import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

type ModelAsset = { src: string; fit: number; target: number }

function getAsset(productId: string): ModelAsset {
  if (productId.startsWith('arvore-') || productId === 'mini-arvore') {
    return { src: '/models/christmas-tree.glb', fit: productId === 'mini-arvore' ? 0.78 : 1, target: 0.48 }
  }
  if (productId.startsWith('guirlanda-')) return { src: '/models/christmas-wreath.glb', fit: 1.05, target: 0.5 }
  if (productId === 'globo-neve') return { src: '/models/snow-globe.glb', fit: 1.2, target: 0.48 }
  return { src: '/models/star-lantern.glb', fit: 1.05, target: 0.5 }
}

export default function Product3DPreview({ productId, productName }: { productId: string; productName: string }) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    } catch {
      setUnavailable(true)
      setLoading(false)
      return
    }

    let disposed = false
    let frame = 0
    let model: THREE.Group | null = null
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#f2eee6')
    scene.add(new THREE.HemisphereLight(0xfff8e9, 0x586b5b, 2.1))

    const keyLight = new THREE.DirectionalLight(0xffedce, 3.2)
    keyLight.position.set(-3.5, 5, 4)
    scene.add(keyLight)
    const fillLight = new THREE.DirectionalLight(0xe1eaff, 1.35)
    fillLight.position.set(4, 2.5, -3)
    scene.add(fillLight)
    const rimLight = new THREE.DirectionalLight(0xffd58b, 1.15)
    rimLight.position.set(1, 3, 4)
    scene.add(rimLight)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(1.8, 64),
      new THREE.MeshStandardMaterial({ color: '#e8dfcf', roughness: 0.94 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.012
    scene.add(floor)

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100)
    const rendererPixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
    renderer.setPixelRatio(rendererPixelRatio)
    renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight), false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    renderer.domElement.setAttribute('aria-label', `Prévia 3D ilustrativa: ${productName}`)
    host.replaceChildren(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.enablePan = false
    controls.minDistance = 1.35
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI / 2 + 0.07
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.42

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

    const asset = getAsset(productId)
    setUnavailable(false)
    setLoading(true)
    new GLTFLoader().load(asset.src, (gltf) => {
      if (disposed) {
        gltf.scene.traverse((node) => {
          if (node instanceof THREE.Mesh) {
            node.geometry.dispose()
            const materials = Array.isArray(node.material) ? node.material : [node.material]
            materials.forEach((material) => material.dispose())
          }
        })
        return
      }
      model = gltf.scene
      const bounds = new THREE.Box3().setFromObject(model)
      const size = bounds.getSize(new THREE.Vector3())
      const center = bounds.getCenter(new THREE.Vector3())
      const maxDimension = Math.max(size.x, size.y, size.z, 0.01)
      const scale = (2.25 / maxDimension) * asset.fit
      model.scale.setScalar(scale)
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale)
      scene.add(model)

      const height = size.y * scale
      const targetY = Math.max(0.2, Math.min(height * asset.target, height * 0.64))
      controls.target.set(0, targetY, 0)
      const distance = (Math.max(size.x, size.y, size.z) * scale * 0.56) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.17
      camera.position.set(distance * 0.74, targetY + distance * 0.34, distance * 1.05)
      controls.minDistance = distance * 0.58
      controls.maxDistance = distance * 1.7
      controls.update()
      setLoading(false)
    }, undefined, () => {
      if (disposed) return
      setUnavailable(true)
      setLoading(false)
    })

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

  return <div className="product-3d-preview">
    <div className="product-3d-canvas" ref={hostRef} role="img" aria-label={`Prévia 3D ilustrativa de ${productName}`} />
    <div className="product-3d-badge">MODELO 3D ILUSTRATIVO</div>
    {loading && !unavailable && <div className="product-3d-status">Preparando o modelo…</div>}
    {unavailable && <div className="product-3d-unavailable">A prévia 3D não está disponível neste navegador.</div>}
    <div className="product-3d-hint">Arraste para girar · pinça para aproximar</div>
  </div>
}
