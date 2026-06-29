'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

/**
 * Olho do Oráculo — fullscreen quad com fragment shader.
 * Desenha raios radiais dourados (íris/sol), glow pulsante e partículas
 * cintilantes, em blending aditivo sobre a foto do olho (oracle-eye.png).
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // fullscreen quad em clip-space, ignora a câmera
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec2  uMouse;
  uniform float uIntro;   // 0 -> 1 : o olho "abrindo"

  float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p){
    vec2 i = floor(p), f = fract(p);
    float a = hash(i), b = hash(i + vec2(1.0,0.0));
    float c = hash(i + vec2(0.0,1.0)), d = hash(i + vec2(1.0,1.0));
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }

  void main(){
    vec2 p = vUv - 0.5;
    float aspect = uRes.x / max(uRes.y, 1.0);
    p.x *= aspect;
    p -= uMouse * 0.045;          // parallax suave com o mouse

    float r = length(p);
    float a = atan(p.y, p.x);

    // raios radiais (espinhos da íris)
    float rays = 0.5 + 0.5 * sin(a*60.0 + sin(a*11.0)*1.4 - uTime*0.12);
    rays = pow(rays, 3.0);
    float band = smoothstep(0.46, 0.07, r) * smoothstep(0.03, 0.11, r);
    float iris = rays * band;

    // glow central pulsante (suave — o miolo escuro deixa o texto legível)
    float pulse = 0.82 + 0.18 * sin(uTime*1.15);
    float core  = exp(-r*7.5) * pulse * (1.0 - exp(-r*22.0)); // anel, não bola sólida
    float halo  = exp(-r*2.4) * 0.18;

    // partículas cintilantes
    vec2 gp = p * 9.0;
    float n = noise(gp + uTime*0.04);
    float spark = smoothstep(0.93, 1.0, n) * smoothstep(0.95, 0.20, r);

    // máscara de abertura do olho (lente vertical no intro)
    float lid = smoothstep(0.0, 0.5, uIntro);
    float eyeShape = smoothstep(0.5, 0.46, abs(p.y) / mix(0.06, 0.5, lid));
    float gate = mix(eyeShape, 1.0, smoothstep(0.6, 1.0, uIntro));

    float intensity = (core*0.6 + iris*0.62 + halo + spark*0.6) * gate;
    intensity = clamp(intensity, 0.0, 1.05);

    vec3 gold = mix(vec3(1.0,0.55,0.12), vec3(1.0,0.87,0.5), clamp(intensity,0.0,1.0));
    gl_FragColor = vec4(gold * intensity, intensity);
  }
`

function EyePlane({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { size, viewport } = useThree()

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uIntro: { value: 0 },
    }),
    [],
  )

  useFrame((_, delta) => {
    if (!mat.current) return
    const u = mat.current.uniforms
    u.uTime.value += delta
    u.uRes.value.set(size.width * viewport.dpr, size.height * viewport.dpr)
    // intro: 0 -> 1 nos primeiros ~1.6s
    u.uIntro.value = Math.min(1, u.uIntro.value + delta / 1.6)
    const m = mouse.current
    if (m) {
      // lerp suave do parallax
      u.uMouse.value.x += (m.x - u.uMouse.value.x) * 0.06
      u.uMouse.value.y += (m.y - u.uMouse.value.y) * 0.06
    }
  })

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

export default function EyeCanvas({ mouse }: { mouse: React.RefObject<{ x: number; y: number }> }) {
  return (
    <Canvas
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
      style={{ width: '100%', height: '100%' }}
      orthographic
      camera={{ position: [0, 0, 1] }}
    >
      <EyePlane mouse={mouse} />
    </Canvas>
  )
}
