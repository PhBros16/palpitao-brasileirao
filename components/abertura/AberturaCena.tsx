'use client'

// AberturaCena — conteúdo 3D (React Three Fiber) da abertura cinematográfica.
// Importado dinamicamente por AberturaScreen com ssr=false.
//
// Beat state machine:
//   capa      → álbum fechado (Book3D + luzes quentes)
//   virada    → capa gira em Y (0 → -π) revelando o verso verde
//   refletores→ 3 spotlights acendem em sequência sobre o campo escuro
//   gramado   → campo portrait iluminado + marcadores de jogadores

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Beat, JogadorAbertura } from './tipos'

// ─── PALETA (hex dos tokens reais) ───────────────────────────────────────────
const C = {
  couro300:     '#6e3b1f',
  couro100:     '#a86a3e',
  couro400:     '#552c16',
  couro500:     '#4a2614',
  campoNoturno: '#06180f',
  campo50:      '#0d5a30',
  campo100:     '#0f5a30',
  campo200:     '#0d4f2a',
  dourado300:   '#d4af37',
  dourado400:   '#c89b54',
  papel50:      '#fdfaf0',
  tinta300:     '#3a2e18',
  branco:       '#ffffff',
} as const

// ─── CÂMERA: suavemente se move entre beats ───────────────────────────────────
function CameraRig({ beat }: { beat: Beat }) {
  const { camera } = useThree()
  const target = useRef(new THREE.Vector3(0, 0.5, 5))
  const lookAt = useRef(new THREE.Vector3(0, 0, 0))

  useEffect(() => {
    if (beat === 'capa' || beat === 'virada') {
      target.current.set(0, 0.5, 5)
      lookAt.current.set(0, 0, 0)
    } else if (beat === 'refletores') {
      target.current.set(0, 5, 9)
      lookAt.current.set(0, 0, 0)
    } else {
      // gramado — câmera bem acima olhando para baixo em ângulo
      target.current.set(0, 9, 4.5)
      lookAt.current.set(0, 0, 0)
    }
  }, [beat])

  useFrame((_, delta) => {
    const t = 1 - Math.pow(0.04, delta)
    camera.position.lerp(target.current, t)
    camera.lookAt(lookAt.current)
  })

  return null
}

// ─── BEAT 1 & 2: CAPA ────────────────────────────────────────────────────────
function Capa({
  isFlipping,
  onFlipComplete,
}: {
  isFlipping: boolean
  onFlipComplete: () => void
}) {
  const groupRef = useRef<THREE.Group>(null!)
  const progress = useRef(0)
  const done = useRef(false)

  useFrame((_, delta) => {
    if (!isFlipping || done.current) return
    progress.current = Math.min(progress.current + delta / 0.85, 1)
    // ease-in-out-cubic
    const t = progress.current
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    groupRef.current.rotation.y = -Math.PI * e
    if (progress.current >= 1) {
      done.current = true
      onFlipComplete()
    }
  })

  return (
    <group ref={groupRef}>
      {/* Frente — couro */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.8, 3.8]} />
        <meshStandardMaterial color={C.couro300} roughness={0.82} metalness={0.12} />
      </mesh>

      {/* Corpo do álbum */}
      <mesh>
        <boxGeometry args={[2.8, 3.8, 0.14]} />
        <meshStandardMaterial color={C.couro400} roughness={0.9} />
      </mesh>

      {/* Lombada (esquerda) */}
      <mesh position={[-1.47, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[0.14, 3.8, 0.04]} />
        <meshStandardMaterial color={C.couro500} roughness={0.95} />
      </mesh>

      {/* Verso — gramado */}
      <mesh position={[0, 0, -0.07]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[2.8, 3.8]} />
        <meshStandardMaterial color={C.campo100} roughness={0.85} />
      </mesh>

      {/* Textos da capa */}
      <Suspense fallback={null}>
        {/* Título */}
        <Text
          position={[0, 0.7, 0.09]}
          fontSize={0.24}
          color={C.dourado300}
          anchorX="center"
          anchorY="middle"
          maxWidth={2.3}
          textAlign="center"
          outlineWidth={0.006}
          outlineColor={C.couro500}
        >
          {'PALPITÃO\nBRASILEIRÃO'}
        </Text>
        {/* Edição */}
        <Text
          position={[0, -0.2, 0.09]}
          fontSize={0.11}
          color={C.dourado400}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
        >
          EDIÇÃO 2026
        </Text>
        {/* Linha decorativa */}
        <Text
          position={[0, -0.55, 0.09]}
          fontSize={0.065}
          color={C.couro100}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
        >
          ────────────────────
        </Text>
        {/* Sub */}
        <Text
          position={[0, -0.82, 0.09]}
          fontSize={0.075}
          color={C.couro100}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          BOLÃO OFICIAL DO GRUPO
        </Text>
        {/* Número no canto inferior */}
        <Text
          position={[1.1, -1.6, 0.09]}
          fontSize={0.07}
          color={C.dourado400}
          anchorX="right"
          anchorY="bottom"
          letterSpacing={0.05}
        >
          #1
        </Text>
      </Suspense>
    </group>
  )
}

// ─── BEAT 3: REFLETORES ───────────────────────────────────────────────────────
function CenaRefletores({ onComplete }: { onComplete: () => void }) {
  const [int, setInt] = useState<[number, number, number]>([0, 0, 0])
  const lightsRef = useRef<THREE.SpotLight[]>([])
  const targets = useRef([0, 0, 0])

  // Animação suave de intensidade
  useFrame((_, delta) => {
    for (let i = 0; i < 3; i++) {
      if (!lightsRef.current[i]) continue
      const t = 1 - Math.pow(0.01, delta)
      lightsRef.current[i].intensity += (targets.current[i] - lightsRef.current[i].intensity) * t
    }
  })

  useEffect(() => {
    const t1 = setTimeout(() => { targets.current[0] = 2.0 }, 200)
    const t2 = setTimeout(() => { targets.current[1] = 2.0 }, 500)
    const t3 = setTimeout(() => { targets.current[2] = 2.0 }, 800)
    const t4 = setTimeout(() => onComplete(), 1700)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [onComplete])

  function setRef(i: number) {
    return (el: THREE.SpotLight | null) => {
      if (el) lightsRef.current[i] = el
    }
  }

  return (
    <>
      {/* Campo escuro revelado pelos refletores */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]}>
        <planeGeometry args={[10, 16]} />
        <meshStandardMaterial color={C.campoNoturno} />
      </mesh>

      {/* Ambient muito fraca para não apagar o efeito de drama */}
      <ambientLight intensity={0.03} />

      {/* Refletor 1 — esquerda */}
      <spotLight
        ref={setRef(0)}
        position={[-5, 11, 5]}
        intensity={0}
        angle={0.42}
        penumbra={0.45}
        color="#f5ecd0"
        decay={0.8}
      />
      {/* Refletor 2 — direita */}
      <spotLight
        ref={setRef(1)}
        position={[5, 11, 5]}
        intensity={0}
        angle={0.42}
        penumbra={0.45}
        color="#f5ecd0"
        decay={0.8}
      />
      {/* Refletor 3 — centro-fundo */}
      <spotLight
        ref={setRef(2)}
        position={[0, 13, -5]}
        intensity={0}
        angle={0.38}
        penumbra={0.55}
        color="#f5ecd0"
        decay={0.8}
      />
    </>
  )
}

// ─── BEAT 4: GRAMADO ──────────────────────────────────────────────────────────

// Dimensões do campo: portrait 3.5 × 5.5 world units.
const W = 1.75  // meia-largura
const H = 2.75  // meia-altura

// Linha fina usando BoxGeometry (evita dependência de drei Line).
function Linha({
  x1, z1, x2, z2, espessura = 0.025,
}: { x1: number; z1: number; x2: number; z2: number; espessura?: number }) {
  const cx = (x1 + x2) / 2
  const cz = (z1 + z2) / 2
  const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
  const angle = Math.atan2(x2 - x1, z2 - z1)
  return (
    <mesh position={[cx, 0.015, cz]} rotation={[0, angle, 0]}>
      <boxGeometry args={[espessura, 0.01, len]} />
      <meshBasicMaterial color={C.branco} />
    </mesh>
  )
}

function LinhasCampo() {
  const pe = 0.9  // meia-largura área penalty
  const pa = 0.3  // profundidade área penalty

  return (
    <>
      {/* Contorno do campo */}
      <Linha x1={-W} z1={-H} x2={W}  z2={-H} />
      <Linha x1={W}  z1={-H} x2={W}  z2={H}  />
      <Linha x1={W}  z1={H}  x2={-W} z2={H}  />
      <Linha x1={-W} z1={H}  x2={-W} z2={-H} />
      {/* Linha do meio */}
      <Linha x1={-W} z1={0} x2={W} z2={0} />
      {/* Área de penalty (defesa — z positivo, perto do GK) */}
      <Linha x1={-pe} z1={H - pa} x2={pe} z2={H - pa} />
      <Linha x1={-pe} z1={H - pa} x2={-pe} z2={H} />
      <Linha x1={pe}  z1={H - pa} x2={pe}  z2={H} />
      {/* Área de penalty (ataque — z negativo) */}
      <Linha x1={-pe} z1={-(H - pa)} x2={pe} z2={-(H - pa)} />
      <Linha x1={-pe} z1={-(H - pa)} x2={-pe} z2={-H} />
      <Linha x1={pe}  z1={-(H - pa)} x2={pe}  z2={-H}  />
      {/* Círculo central */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.55, 0.60, 48]} />
        <meshBasicMaterial color={C.branco} />
      </mesh>
      {/* Ponto central */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial color={C.branco} />
      </mesh>
    </>
  )
}

// Marcador de jogador: cilindro achatado + iniciais em Text.
function MarcadorJogador({
  position, iniciais, ehVoce = false, onClick,
}: {
  position: [number, number, number]
  iniciais: string
  ehVoce?: boolean
  onClick: () => void
}) {
  const [hover, setHover] = useState(false)
  const meshRef = useRef<THREE.Mesh>(null!)

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const targetScale = hover ? 1.15 : 1.0
    meshRef.current.scale.x += (targetScale - meshRef.current.scale.x) * (1 - Math.pow(0.02, delta))
    meshRef.current.scale.z += (targetScale - meshRef.current.scale.z) * (1 - Math.pow(0.02, delta))
  })

  const corBase = ehVoce ? C.dourado300 : C.campo50
  const corHover = ehVoce ? '#e8c840' : C.campo100

  return (
    <group
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <mesh ref={meshRef} rotation-x={-Math.PI / 2} position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.1, 28]} />
        <meshStandardMaterial color={hover ? corHover : corBase} roughness={0.5} metalness={ehVoce ? 0.3 : 0.0} />
      </mesh>
      {/* Anel de destaque para "você" */}
      {ehVoce && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.12, 0]}>
          <ringGeometry args={[0.23, 0.28, 28]} />
          <meshBasicMaterial color={C.dourado300} />
        </mesh>
      )}
      <Suspense fallback={null}>
        <Text
          position={[0, 0.14, 0]}
          rotation-x={-Math.PI / 2}
          fontSize={0.13}
          color={ehVoce ? C.tinta300 : C.papel50}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.003}
          outlineColor={ehVoce ? C.dourado400 : C.campo200}
        >
          {iniciais}
        </Text>
      </Suspense>
    </group>
  )
}

// Formação 4-3-3 (GK, 4 DEF, 3 MID, 3 FWD).
// Campo: z positivo = defesa (baixo na tela), z negativo = ataque (cima na tela).
const POS_TITULARES: [number, number, number][] = [
  // GK
  [ 0.00, 0, 2.15],
  // DEF (4)
  [-1.35, 0, 1.55], [-0.45, 0, 1.68], [0.45, 0, 1.68], [1.35, 0, 1.55],
  // MID (3)
  [-0.85, 0, 0.55], [0.00, 0, 0.70], [0.85, 0, 0.55],
  // FWD (3)
  [-1.10, 0, -0.65], [0.00, 0, -0.55], [1.10, 0, -0.65],
]

const POS_BANCO: [number, number, number][] = [
  [-1.50, 0, 3.3], [-0.75, 0, 3.4], [0.00, 0, 3.4], [0.75, 0, 3.4], [1.50, 0, 3.3],
]

function CenaGramado({
  players,
  onLogin,
}: {
  players: JogadorAbertura[]
  onLogin: (nome: string) => void
}) {
  const titulares = players.slice(0, 11)
  const banco = players.slice(11)

  return (
    <>
      {/* Iluminação: 3 refletores já acesos */}
      <ambientLight intensity={0.25} />
      <spotLight position={[-5, 11, 5]}  intensity={1.6} angle={0.42} penumbra={0.4} color="#f5ecd0" decay={0.8} />
      <spotLight position={[5,  11, 5]}  intensity={1.6} angle={0.42} penumbra={0.4} color="#f5ecd0" decay={0.8} />
      <spotLight position={[0,  13, -5]} intensity={1.3} angle={0.38} penumbra={0.5} color="#f5ecd0" decay={0.8} />

      {/* Gramado */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[3.5, 5.5]} />
        <meshStandardMaterial color={C.campo50} roughness={0.92} />
      </mesh>

      {/* Faixas alternadas (look de estádio) */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={[0, 0.003, i * 1.0]}>
          <planeGeometry args={[3.5, 1.0]} />
          <meshBasicMaterial color={i % 2 === 0 ? C.campo100 : C.campo50} transparent opacity={0.5} />
        </mesh>
      ))}

      {/* Linhas do campo */}
      <LinhasCampo />

      {/* Área do banco (fundo, além do GK) */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 3.55]}>
        <planeGeometry args={[3.5, 0.5]} />
        <meshStandardMaterial color={C.campo200} roughness={0.95} />
      </mesh>

      {/* Titulares */}
      {titulares.map((j, i) => (
        <MarcadorJogador
          key={j.nome}
          position={POS_TITULARES[i] ?? [0, 0, 0]}
          iniciais={j.iniciais}
          ehVoce={j.ehVoce}
          onClick={() => onLogin(j.nome)}
        />
      ))}

      {/* Banco */}
      {banco.slice(0, 5).map((j, i) => (
        <MarcadorJogador
          key={j.nome}
          position={POS_BANCO[i] ?? [0, 0, 3.4]}
          iniciais={j.iniciais}
          ehVoce={j.ehVoce}
          onClick={() => onLogin(j.nome)}
        />
      ))}

      {/* Label "BANCO" */}
      <Suspense fallback={null}>
        <Text
          position={[-1.9, 0.02, 3.55]}
          rotation-x={-Math.PI / 2}
          fontSize={0.1}
          color={C.dourado300}
          anchorX="left"
          anchorY="middle"
          letterSpacing={0.12}
        >
          BANCO
        </Text>
      </Suspense>
    </>
  )
}

// ─── CENA PRINCIPAL (dentro do Canvas) ───────────────────────────────────────
function Cena({
  beat,
  onViradaComplete,
  onRefletoresComplete,
  players,
  onLogin,
}: {
  beat: Beat
  onViradaComplete: () => void
  onRefletoresComplete: () => void
  players: JogadorAbertura[]
  onLogin: (nome: string) => void
}) {
  const bgCapa = new THREE.Color('#2a1508')
  const bgCampo = new THREE.Color(C.campoNoturno)

  return (
    <>
      <color attach="background" args={[beat === 'capa' || beat === 'virada' ? '#2a1508' : C.campoNoturno]} />

      <CameraRig beat={beat} />

      {/* Beats 1 & 2 — Capa fechada + Virada */}
      {(beat === 'capa' || beat === 'virada') && (
        <>
          <ambientLight intensity={0.55} />
          <directionalLight position={[3, 5, 5]} intensity={0.9} color="#f5e8c0" />
          <pointLight position={[-3, 2, 3]} intensity={0.35} color={C.dourado300} />
          <Capa isFlipping={beat === 'virada'} onFlipComplete={onViradaComplete} />
        </>
      )}

      {/* Beat 3 — Refletores ligam */}
      {beat === 'refletores' && (
        <CenaRefletores onComplete={onRefletoresComplete} />
      )}

      {/* Beat 4 — Gramado + Escalação */}
      {beat === 'gramado' && (
        <CenaGramado players={players} onLogin={onLogin} />
      )}
    </>
  )
}

// ─── EXPORT DEFAULT — Canvas wrapper (importado com ssr=false) ────────────────
export default function AberturaCena({
  beat,
  onViradaComplete,
  onRefletoresComplete,
  players,
  onLogin,
}: {
  beat: Beat
  onViradaComplete: () => void
  onRefletoresComplete: () => void
  players: JogadorAbertura[]
  onLogin: (nome: string) => void
}) {
  return (
    <Canvas
      camera={{ position: [0, 0.5, 5], fov: 50 }}
      style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        <Cena
          beat={beat}
          onViradaComplete={onViradaComplete}
          onRefletoresComplete={onRefletoresComplete}
          players={players}
          onLogin={onLogin}
        />
      </Suspense>
    </Canvas>
  )
}
