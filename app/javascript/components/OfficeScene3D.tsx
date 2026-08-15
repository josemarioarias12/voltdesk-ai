import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, ContactShadows, OrbitControls, RoundedBox, Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { useActionCable } from '@/hooks/useActionCable'
import {
  computeSpaceFloorLayout,
  FLOOR_LAYOUT_RECT_H,
  FLOOR_LAYOUT_RECT_W,
  type SpaceLike,
} from '@/utils/spaceFloorLayout'

const SCENE_SCALE = 0.02
const WALL_HEIGHT = 0.5
const WALL_THICKNESS = 0.04
const ROOM_W = FLOOR_LAYOUT_RECT_W * SCENE_SCALE
const ROOM_H = FLOOR_LAYOUT_RECT_H * SCENE_SCALE

const NAVY = '#0F172A'
const TEAL = '#028090'
const MINT = '#02C39A'
const AMBER = '#f59e0b'
const SKIN = '#e8b48c'
const HAIR = '#3b3430'
const WARM_LIGHT = '#ffd9a0'

const SEAT_HEIGHT_CHAIR = 0.1
const SEAT_HEIGHT_SOFA = 0.15

const LABEL_REF_DISTANCE = 7
const LABEL_MIN_SCALE = 0.35
const LABEL_MAX_SCALE = 1.6

const FLY_DAMPING = 3.2
const FLY_CAMERA_OFFSET = new THREE.Vector3(1.7, 1.35, 1.7)
const FLY_DONE_EPSILON = 0.04

const SLAB_MARGIN = 0.9
const SLAB_THICKNESS = 0.08

const IDLE_ORBIT_DELAY_MS = 6000
const IDLE_ORBIT_SPEED = 0.5
const FLOOR_FADE_MS = 220

const LABEL_FONT_URL = '/fonts/inter-regular.woff'

interface SceneSpace extends SpaceLike {
  name: string
  status: string
  space_type: string
  reserved_soon?: boolean
}

interface Presence {
  spaceId: number
  userId: number
  userName: string
  avatarUrl: string | null
  endAt: string
}

interface PresenceInput {
  space_id: number
  user_id: number
  user_name: string
  avatar_url?: string | null
  end_at: string
}

interface OfficeScene3DProps {
  spaces: SceneSpace[]
  workspaceId: number
  initialPresences?: PresenceInput[]
  onSpaceClick?: (spaceId: number) => void
}

interface CablePayload {
  type: string
  space_id?: number
  user_id?: number
  reservation?: {
    space_id: number
    user_id: number
    user_name: string
    user_avatar_url: string | null
    end_at?: string
  }
}

interface SeatSpec {
  x: number
  z: number
  rotationY: number
  seatHeight: number
}

function gridToScene(rx: number, ry: number): [number, number, number] {
  return [rx * SCENE_SCALE, 0, ry * SCENE_SCALE]
}

function conferenceSeatLayout(chairs: number): { tableW: number; xs: number[] } {
  const maxTableW = ROOM_W * 0.55
  const perSide = Math.max(1, Math.ceil(chairs / 2))
  const tableW = Math.min(maxTableW, Math.max(0.55, perSide * 0.2))
  const fitPerSide = Math.max(1, Math.floor((tableW - 0.1) / 0.18))
  const seats = Math.min(perSide, fitPerSide)
  const xs = Array.from({ length: seats }, (_, i) =>
    seats === 1 ? 0 : -tableW / 2 + 0.12 + i * ((tableW - 0.24) / (seats - 1))
  )
  return { tableW, xs }
}

function seatsForSpace(spaceType: string, capacityHint: number): SeatSpec[] {
  switch (spaceType) {
    case 'meeting_room':
    case 'conference_room': {
      const { xs } = conferenceSeatLayout(Math.min(capacityHint, 10))
      const near = xs.map((x) => ({ x, z: 0.28, rotationY: Math.PI, seatHeight: SEAT_HEIGHT_CHAIR }))
      const far = xs.map((x) => ({ x, z: -0.28, rotationY: 0, seatHeight: SEAT_HEIGHT_CHAIR }))
      return [...near, ...far]
    }
    case 'open_desk':
      return [
        { x: 0, z: 0.4, rotationY: Math.PI, seatHeight: SEAT_HEIGHT_CHAIR },
        { x: 0, z: -0.4, rotationY: 0, seatHeight: SEAT_HEIGHT_CHAIR },
        { x: -0.5, z: 0.4, rotationY: Math.PI, seatHeight: SEAT_HEIGHT_CHAIR },
      ]
    case 'phone_booth':
      return [{ x: 0, z: 0.1, rotationY: Math.PI, seatHeight: SEAT_HEIGHT_CHAIR }]
    case 'lounge':
      return [
        { x: -0.32, z: 0, rotationY: 0, seatHeight: SEAT_HEIGHT_SOFA },
        { x: 0.32, z: 0, rotationY: 0, seatHeight: SEAT_HEIGHT_SOFA },
      ]
    case 'event_hall':
      return [
        { x: -0.44, z: -0.02, rotationY: 0, seatHeight: SEAT_HEIGHT_CHAIR },
        { x: -0.22, z: -0.02, rotationY: 0, seatHeight: SEAT_HEIGHT_CHAIR },
        { x: 0, z: -0.02, rotationY: 0, seatHeight: SEAT_HEIGHT_CHAIR },
      ]
    default: {
      const { xs } = conferenceSeatLayout(4)
      return [{ x: xs[0], z: 0.28, rotationY: Math.PI, seatHeight: SEAT_HEIGHT_CHAIR }]
    }
  }
}

function presencesToMap(inputs: PresenceInput[]): Map<number, Presence[]> {
  const map = new Map<number, Presence[]>()
  inputs.forEach((input) => {
    const presence: Presence = {
      spaceId: input.space_id,
      userId: input.user_id,
      userName: input.user_name,
      avatarUrl: input.avatar_url ?? null,
      endAt: input.end_at,
    }
    const list = map.get(presence.spaceId) ?? []
    if (!list.some((p) => p.userId === presence.userId)) {
      map.set(presence.spaceId, [...list, presence])
    }
  })
  return map
}

function pruneExpired(map: Map<number, Presence[]>): Map<number, Presence[]> {
  const now = Date.now()
  const next = new Map<number, Presence[]>()
  map.forEach((list, spaceId) => {
    const alive = list.filter((p) => new Date(p.endAt).getTime() > now)
    if (alive.length > 0) next.set(spaceId, alive)
  })
  return next
}

function nextExpiryMs(map: Map<number, Presence[]>): number | null {
  let min: number | null = null
  map.forEach((list) => {
    list.forEach((p) => {
      const t = new Date(p.endAt).getTime()
      if (min === null || t < min) min = t
    })
  })
  return min
}

function PillLabel({
  text, position, fontSize = 0.13, edgeAnchor, avatarUrl,
}: {
  text: string
  position: [number, number, number]
  fontSize?: number
  edgeAnchor?: { halfDepth: number }
  avatarUrl?: string | null
}) {
  const groupRef = useRef<THREE.Group>(null)
  const anchorRef = useRef<THREE.Group>(null)
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const textWidth = Math.max(0.5, text.length * fontSize * 0.58)
  const avatarDiameter = avatarUrl ? fontSize * 1.8 : 0
  const avatarGap = avatarUrl ? fontSize * 0.3 : 0
  const totalWidth = textWidth + avatarDiameter + avatarGap
  const textOffsetX = (avatarDiameter + avatarGap) / 2
  const avatarOffsetX = -totalWidth / 2 + avatarDiameter / 2

  useFrame(({ camera }) => {
    const group = groupRef.current
    if (!group) return

    const anchor = anchorRef.current
    if (edgeAnchor && anchor) {
      anchor.getWorldPosition(worldPos)
      anchor.position.z = camera.position.z >= worldPos.z
        ? -edgeAnchor.halfDepth
        : edgeAnchor.halfDepth
    }

    const distance = group.getWorldPosition(worldPos).distanceTo(camera.position)
    const scale = THREE.MathUtils.clamp(
      distance / LABEL_REF_DISTANCE, LABEL_MIN_SCALE, LABEL_MAX_SCALE
    )
    group.scale.setScalar(scale)
  })

  return (
    <group ref={anchorRef} position={position}>
      <Billboard>
        <group ref={groupRef}>
          <mesh position={[0, 0, -0.005]}>
            <planeGeometry args={[totalWidth + 0.16, fontSize + 0.14]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.92} />
          </mesh>
          <Text
            font={LABEL_FONT_URL}
            fontSize={fontSize}
            color={NAVY}
            anchorX="center"
            anchorY="middle"
            position={[textOffsetX, 0, 0]}
          >
            {text}
          </Text>
          {avatarUrl && (
            <group position={[avatarOffsetX, 0, 0.002]}>
              <PhotoErrorBoundary>
                <Suspense fallback={null}>
                  <PhotoDisc url={avatarUrl} radius={avatarDiameter / 2} />
                </Suspense>
              </PhotoErrorBoundary>
            </group>
          )}
        </group>
      </Billboard>
    </group>
  )
}

function Chair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.14, 0.02, 0.14]} radius={0.008} smoothness={3} position={[0, 0.09, 0]} castShadow>
        <meshStandardMaterial color={NAVY} roughness={0.7} />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.17, 0.02]} radius={0.008} smoothness={3} position={[0, 0.17, -0.065]} castShadow>
        <meshStandardMaterial color={NAVY} roughness={0.7} />
      </RoundedBox>
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 0.012, 12]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.35} />
      </mesh>
    </group>
  )
}

function Mug({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.016, 0.014, 0.032, 10]} />
      <meshStandardMaterial color={TEAL} roughness={0.5} />
    </mesh>
  )
}

function Laptop({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.004, 0]} castShadow>
        <boxGeometry args={[0.09, 0.008, 0.065]} />
        <meshStandardMaterial color="#334155" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.035, -0.03]} rotation={[-0.4, 0, 0]} castShadow>
        <boxGeometry args={[0.09, 0.062, 0.005]} />
        <meshStandardMaterial color={NAVY} roughness={0.3} emissive={TEAL} emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

function Desk({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <boxGeometry args={[0.4, 0.02, 0.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      {[-0.17, 0.17].map((dx) => (
        <mesh key={dx} position={[dx, 0.07, 0]}>
          <boxGeometry args={[0.02, 0.14, 0.18]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 0.19, -0.03]} castShadow>
        <boxGeometry args={[0.16, 0.09, 0.008]} />
        <meshStandardMaterial color={NAVY} roughness={0.3} emissive={TEAL} emissiveIntensity={0.18} />
      </mesh>
    </group>
  )
}

function HangingLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.18, 6]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      <mesh position={[0, -0.02, 0]} castShadow>
        <cylinderGeometry args={[0.02, 0.09, 0.08, 14, 1, true]} />
        <meshStandardMaterial color={NAVY} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color={WARM_LIGHT} emissive={WARM_LIGHT} emissiveIntensity={1.4} />
      </mesh>
    </group>
  )
}

function PottedPlant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.14, 12]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 0.1, 6]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.8} />
      </mesh>
      {[[0, 0.26, 0, 0.09], [-0.05, 0.22, 0.03, 0.06], [0.05, 0.23, -0.03, 0.065]].map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} castShadow>
          <sphereGeometry args={[r, 10, 10]} />
          <meshStandardMaterial color="#3f7d4e" roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function ConferenceTable({ chairs, roomIndex }: { chairs: number; roomIndex: number }) {
  const { tableW, xs } = conferenceSeatLayout(chairs)
  const tableTop = 0.165

  return (
    <group>
      <RoundedBox args={[tableW, 0.025, 0.34]} radius={0.01} smoothness={3} position={[0, 0.15, 0]} castShadow>
        <meshStandardMaterial color="#a97142" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[tableW * 0.55, 0.15, 0.16]} />
        <meshStandardMaterial color="#8a5a33" roughness={0.6} />
      </mesh>
      {xs.map((x, i) => (
        <group key={i}>
          <Chair position={[x, 0, 0.28]} rotation={Math.PI} />
          <Chair position={[x, 0, -0.28]} rotation={0} />
        </group>
      ))}
      <HangingLight position={[0, 0.62, 0]} />
      {roomIndex % 2 === 0 ? (
        <>
          <Laptop position={[-tableW * 0.22, tableTop, 0.05]} rotation={Math.PI} />
          <Mug position={[tableW * 0.2, tableTop + 0.016, -0.06]} />
        </>
      ) : (
        <>
          <Laptop position={[tableW * 0.2, tableTop, -0.05]} />
          <Mug position={[-tableW * 0.24, tableTop + 0.016, 0.07]} />
        </>
      )}
    </group>
  )
}

function OpenDeskArea({ occupiedSeats }: { occupiedSeats: number }) {
  return (
    <group>
      {[[-0.5, -0.22], [0, -0.22], [0.5, -0.22], [-0.5, 0.22], [0, 0.22], [0.5, 0.22]].map(([x, z], i) => (
        <group key={i}>
          <Desk position={[x, 0, z]} rotation={z > 0 ? 0 : Math.PI} />
          <Chair position={[x, 0, z > 0 ? z + 0.18 : z - 0.18]} rotation={z > 0 ? Math.PI : 0} />
        </group>
      ))}
      <Mug position={[-0.5, 0.166, -0.18]} />
      <Laptop position={[0.5, 0.15, 0.24]} rotation={Math.PI} />
    </group>
  )
}

function PhoneBoothInterior() {
  return (
    <group>
      <Desk position={[0, 0, -0.12]} rotation={Math.PI} />
      <Chair position={[0, 0, 0.1]} rotation={Math.PI} />
    </group>
  )
}

function LoungeInterior() {
  return (
    <group>
      {[[-0.32, 0], [0.32, 0]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <RoundedBox args={[0.36, 0.14, 0.2]} radius={0.015} smoothness={3} position={[0, 0.08, 0]} castShadow>
            <meshStandardMaterial color={TEAL} roughness={0.85} />
          </RoundedBox>
          <RoundedBox args={[0.36, 0.12, 0.04]} radius={0.012} smoothness={3} position={[0, 0.17, -0.08]} castShadow>
            <meshStandardMaterial color={TEAL} roughness={0.85} />
          </RoundedBox>
        </group>
      ))}
      <mesh position={[0, 0.05, 0.02]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.1, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>
      <PottedPlant position={[ROOM_W * 0.32, 0, -ROOM_H * 0.28]} scale={0.8} />
    </group>
  )
}

function EventHallInterior() {
  return (
    <group>
      <mesh position={[0, 0.04, -0.4]} receiveShadow>
        <boxGeometry args={[1.1, 0.08, 0.26]} />
        <meshStandardMaterial color={NAVY} roughness={0.6} />
      </mesh>
      {Array.from({ length: 3 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <Chair
            key={`${row}-${col}`}
            position={[-0.44 + col * 0.22, 0, -0.02 + row * 0.22]}
            rotation={0}
          />
        ))
      )}
    </group>
  )
}

function Furniture({
  spaceType, capacityHint, roomIndex, occupiedSeats,
}: { spaceType: string; capacityHint: number; roomIndex: number; occupiedSeats: number }) {
  switch (spaceType) {
    case 'meeting_room':
    case 'conference_room':
      return <ConferenceTable chairs={Math.min(capacityHint, 10)} roomIndex={roomIndex} />
    case 'open_desk':
      return <OpenDeskArea occupiedSeats={occupiedSeats} />
    case 'phone_booth':
      return <PhoneBoothInterior />
    case 'lounge':
      return <LoungeInterior />
    case 'event_hall':
      return <EventHallInterior />
    default:
      return <ConferenceTable chairs={4} roomIndex={roomIndex} />
  }
}

const SHIRT_TEAL = '#028090'
const SHIRT_SLATE = '#334155'

const AVATAR_VARIANTS = [
  { chestWidth: 0.135, waistWidth: 0.105, shirtColor: SHIRT_TEAL, heightScale: 1.0 },
  { chestWidth: 0.128, waistWidth: 0.1, shirtColor: SHIRT_SLATE, heightScale: 0.99 },
]

function variantForUser(userId: number) {
  return AVATAR_VARIANTS[Math.abs(userId) % AVATAR_VARIANTS.length]
}

function Hair({ hipY }: { hipY: number }) {
  return (
    <mesh position={[0, hipY + 0.298, -0.015]}>
      <sphereGeometry args={[0.047, 18, 18, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshStandardMaterial color={HAIR} roughness={0.85} />
    </mesh>
  )
}

class PhotoErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

function PhotoDisc({ url, radius = 0.05 }: { url: string; radius?: number }) {
  const texture = useTexture(url)

  return (
    <mesh>
      <circleGeometry args={[radius, 32]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}


function SeatedPerson({
  seatHeight = SEAT_HEIGHT_CHAIR, bodyColor, variant = AVATAR_VARIANTS[0],
}: {
  seatHeight?: number
  bodyColor?: string
  variant?: typeof AVATAR_VARIANTS[number]
}) {
  const shirtColor = bodyColor ?? variant.shirtColor
  const hipY = seatHeight + 0.022

  return (
    <group>
      {[-0.036, 0.036].map((dx) => (
        <mesh key={`thigh-${dx}`} position={[dx, hipY, 0.07]} castShadow>
          <boxGeometry args={[0.048, 0.045, 0.15]} />
          <meshStandardMaterial color={NAVY} roughness={0.7} />
        </mesh>
      ))}
      {[-0.036, 0.036].map((dx) => (
        <mesh key={`shin-${dx}`} position={[dx, hipY / 2, 0.135]} castShadow>
          <boxGeometry args={[0.042, hipY, 0.042]} />
          <meshStandardMaterial color={NAVY} roughness={0.7} />
        </mesh>
      ))}
      {[-0.036, 0.036].map((dx) => (
        <mesh key={`foot-${dx}`} position={[dx, 0.012, 0.165]}>
          <boxGeometry args={[0.046, 0.024, 0.09]} />
          <meshStandardMaterial color="#1e293b" roughness={0.5} />
        </mesh>
      ))}
      <RoundedBox
        args={[variant.waistWidth, 0.09, 0.075]} radius={0.018} smoothness={2}
        position={[0, hipY + 0.045, -0.005]} castShadow
      >
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[variant.chestWidth, 0.11, 0.08]} radius={0.018} smoothness={2}
        position={[0, hipY + 0.145, -0.005]} castShadow
      >
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </RoundedBox>
      <RoundedBox
        args={[variant.chestWidth + 0.02, 0.035, 0.07]} radius={0.012} smoothness={2}
        position={[0, hipY + 0.195, -0.005]} castShadow
      >
        <meshStandardMaterial color={bodyColor} roughness={0.7} />
      </RoundedBox>
      {[-0.085, 0.085].map((dx) => (
        <RoundedBox
          key={`uarm-${dx}`} args={[0.036, 0.115, 0.036]} radius={0.014} smoothness={2}
          position={[dx, hipY + 0.13, 0.012]} rotation={[0.38, 0, 0]} castShadow
        >
          <meshStandardMaterial color={bodyColor} roughness={0.7} />
        </RoundedBox>
      ))}
      {[-0.085, 0.085].map((dx) => (
        <RoundedBox
          key={`farm-${dx}`} args={[0.032, 0.095, 0.032]} radius={0.013} smoothness={2}
          position={[dx, hipY + 0.065, 0.075]} rotation={[1.25, 0, 0]}
        >
          <meshStandardMaterial color={SKIN} roughness={0.6} />
        </RoundedBox>
      ))}
      <mesh position={[0, hipY + 0.22, -0.005]}>
        <cylinderGeometry args={[0.02, 0.024, 0.035, 10]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <mesh position={[0, hipY + 0.285, -0.005]} castShadow>
        <sphereGeometry args={[0.048, 18, 18]} />
        <meshStandardMaterial color={SKIN} roughness={0.6} />
      </mesh>
      <Hair hipY={hipY} />
    </group>
  )
}

function AvatarMarker({
  seat, position, userName, userId, avatarUrl, baseScale,
}: {
  seat: SeatSpec
  position: [number, number, number]
  userName: string
  userId: number
  avatarUrl: string | null
  baseScale: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const scaleRef = useRef(0)
  const variant = useMemo(() => variantForUser(userId), [userId])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    scaleRef.current = Math.min(1, scaleRef.current + delta * 2.5)
    const eased = 1 - Math.pow(1 - scaleRef.current, 3)
    groupRef.current.scale.setScalar(eased * baseScale * variant.heightScale)
  })

  return (
    <group ref={groupRef} position={position} rotation={[0, seat.rotationY, 0]}>
      <SeatedPerson seatHeight={seat.seatHeight} variant={variant} />
      <PillLabel
        text={userName}
        position={[0, seat.seatHeight + 0.46, 0]}
        fontSize={0.11}
        avatarUrl={avatarUrl}
      />
    </group>
  )
}

function CameraRig({
  target, distance, controlsRef,
}: {
  target: [number, number, number]
  distance: number
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>
}) {
  const { camera, size } = useThree()

  useEffect(() => {
    // On narrow/tall viewports (mobile portrait), the fixed vertical FOV
    // yields a much narrower horizontal FOV than on desktop, clipping room
    // content at the screen edges. Pulling the camera back proportionally
    // to how narrow the aspect ratio is compensates for this without
    // changing anything for aspect >= 1 (desktop, unchanged behavior).
    const aspect = size.width / size.height
    const adjustedDistance = aspect < 1 ? distance / aspect : distance
    const [tx, ty, tz] = target
    camera.position.set(tx + adjustedDistance * 0.7, adjustedDistance * 0.55, tz + adjustedDistance * 0.7)
    camera.lookAt(tx, ty, tz)

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(tx, ty, tz)
      controls.update()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target[0], target[1], target[2], distance, camera, size.width, size.height])

  return null
}

function CameraFly({
  target, controlsRef, onDone,
}: {
  target: [number, number, number] | null
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>
  onDone: () => void
}) {
  const { camera } = useThree()
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const desiredCamera = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return undefined

    const cancel = () => onDone()
    controls.addEventListener('start', cancel)
    return () => controls.removeEventListener('start', cancel)
  }, [controlsRef, onDone])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!target || !controls) return

    desiredTarget.set(target[0], 0.2, target[2])
    desiredCamera.copy(desiredTarget).add(FLY_CAMERA_OFFSET)

    const t = 1 - Math.exp(-FLY_DAMPING * delta)
    camera.position.lerp(desiredCamera, t)
    controls.target.lerp(desiredTarget, t)
    controls.update()

    if (camera.position.distanceTo(desiredCamera) < FLY_DONE_EPSILON) {
      onDone()
    }
  })

  return null
}

function IdleOrbit({
  controlsRef, suspended,
}: {
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>
  suspended: boolean
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return undefined

    controls.autoRotate = false
    controls.autoRotateSpeed = IDLE_ORBIT_SPEED

    function arm() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const current = controlsRef.current
        if (current && !suspended) current.autoRotate = true
      }, IDLE_ORBIT_DELAY_MS)
    }

    function onInteract() {
      const current = controlsRef.current
      if (current) current.autoRotate = false
      arm()
    }

    controls.addEventListener('start', onInteract)
    arm()

    return () => {
      controls.removeEventListener('start', onInteract)
      if (timerRef.current) clearTimeout(timerRef.current)
      controls.autoRotate = false
    }
  }, [controlsRef, suspended])

  useEffect(() => {
    const controls = controlsRef.current
    if (suspended && controls) controls.autoRotate = false
  }, [controlsRef, suspended])

  return null
}

interface SlabRect {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

function FloorAmbience({ slab }: { slab: SlabRect }) {
  const slabW = slab.maxX - slab.minX
  const slabD = slab.maxZ - slab.minZ
  const centerX = (slab.minX + slab.maxX) / 2
  const centerZ = (slab.minZ + slab.maxZ) / 2
  const carpetAlongX = slabW >= slabD

  const windowCount = Math.max(3, Math.floor(slabD / 0.55))
  const windows = Array.from({ length: windowCount }, (_, i) => {
    const z = slab.minZ + 0.4 + (i * (slabD - 0.8)) / Math.max(1, windowCount - 1)
    return z
  })

  return (
    <group>
      <mesh position={[centerX, -SLAB_THICKNESS / 2, centerZ]} receiveShadow>
        <boxGeometry args={[slabW, SLAB_THICKNESS, slabD]} />
        <meshStandardMaterial color="#e6ebf2" roughness={0.75} />
      </mesh>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.004, centerZ]}
        receiveShadow
      >
        <planeGeometry args={carpetAlongX ? [slabW * 0.86, 0.5] : [0.5, slabD * 0.86]} />
        <meshStandardMaterial color="#c7d8db" roughness={0.9} />
      </mesh>
      <PottedPlant position={[slab.minX + 0.35, 0, slab.minZ + 0.35]} />
      <PottedPlant position={[slab.maxX - 0.35, 0, slab.maxZ - 0.35]} scale={1.15} />
      <PottedPlant position={[slab.maxX - 0.35, 0, slab.minZ + 0.35]} scale={0.85} />
      {windows.map((z, i) => (
        <mesh key={i} position={[slab.minX + 0.02, 0.55, z]}>
          <boxGeometry args={[0.03, 1.1, 0.42]} />
          <meshStandardMaterial color="#b8d4e8" transparent opacity={0.45} roughness={0.1} metalness={0.2} />
        </mesh>
      ))}
    </group>
  )
}

export default function OfficeScene3D({
  spaces, workspaceId, initialPresences = [], onSpaceClick,
}: OfficeScene3DProps) {
  const { t } = useTranslation(['facilities', 'common'])
  const layout = useMemo(() => computeSpaceFloorLayout(spaces), [spaces])
  const floors = useMemo(() => [...new Set(spaces.map((sp) => sp.floor))].sort(), [spaces])
  const [selectedFloor, setSelectedFloor] = useState(floors[0] ?? '')
  const [floorOpacity, setFloorOpacity] = useState(1)
  const [presences, setPresences] = useState<Map<number, Presence[]>>(
    () => pruneExpired(presencesToMap(initialPresences))
  )
  const [flyTarget, setFlyTarget] = useState<[number, number, number] | null>(null)
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null)
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expiryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (floors.length > 0 && !floors.includes(selectedFloor)) {
      setSelectedFloor(floors[0])
    }
  }, [floors, selectedFloor])

  useEffect(() => () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
  }, [])

  useEffect(() => {
    if (expiryTimerRef.current) clearTimeout(expiryTimerRef.current)
    const next = nextExpiryMs(presences)
    if (next === null) return

    const delay = Math.max(250, next - Date.now())
    expiryTimerRef.current = setTimeout(() => {
      setPresences((prev) => pruneExpired(prev))
    }, delay)
  }, [presences])

  const handleCableData = useCallback((data: Record<string, unknown>) => {
    const payload = data as unknown as CablePayload

    if (payload.type === 'avatar_positioned' && payload.reservation) {
      const res = payload.reservation
      setPresences((prev) => {
        const nextMap = new Map(prev)
        const list = (nextMap.get(res.space_id) ?? []).filter((p) => p.userId !== res.user_id)
        nextMap.set(res.space_id, [...list, {
          spaceId: res.space_id,
          userId: res.user_id,
          userName: res.user_name,
          avatarUrl: res.user_avatar_url ?? null,
          endAt: res.end_at ?? new Date(Date.now() + 3600000).toISOString(),
        }])
        return pruneExpired(nextMap)
      })
      return
    }

    if (payload.type === 'avatar_removed' && payload.space_id != null && payload.user_id != null) {
      setPresences((prev) => {
        const nextMap = new Map(prev)
        const list = (nextMap.get(payload.space_id as number) ?? []).filter(
          (p) => p.userId !== payload.user_id
        )
        if (list.length > 0) {
          nextMap.set(payload.space_id as number, list)
        } else {
          nextMap.delete(payload.space_id as number)
        }
        return nextMap
      })
    }
  }, [])

  useActionCable({ channel: 'SpacesChannel', workspaceId }, handleCableData)

  const stopFlight = useCallback(() => setFlyTarget(null), [])

  const visibleLayout = useMemo(
    () => layout.filter((pos) => pos.floor === selectedFloor),
    [layout, selectedFloor]
  )

  const bounds = useMemo(() => {
    if (visibleLayout.length === 0) {
      return {
        centerX: 0, centerZ: 0, distance: 6,
        slab: { minX: -2, maxX: 2, minZ: -2, maxZ: 2 },
      }
    }

    const xs = visibleLayout.map((pos) => pos.rx * SCENE_SCALE)
    const zs = visibleLayout.map((pos) => pos.ry * SCENE_SCALE)
    const minX = Math.min(...xs) - ROOM_W / 2 - SLAB_MARGIN
    const maxX = Math.max(...xs) + ROOM_W / 2 + SLAB_MARGIN
    const minZ = Math.min(...zs) - ROOM_H / 2 - SLAB_MARGIN
    const maxZ = Math.max(...zs) + ROOM_H / 2 + SLAB_MARGIN
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2
    const distance = Math.max(maxX - minX, maxZ - minZ, 3.5) * 1.1 + 2.5

    return { centerX, centerZ, distance, slab: { minX, maxX, minZ, maxZ } }
  }, [visibleLayout])

  const capacityById = useMemo(() => {
    const map = new Map<number, number>()
    spaces.forEach((sp) => {
      const withCapacity = sp as SceneSpace & { capacity?: number }
      map.set(sp.id, withCapacity.capacity ?? 6)
    })
    return map
  }, [spaces])

  function handleFloorChange(floor: string) {
    if (floor === selectedFloor) return
    setFlyTarget(null)
    setFloorOpacity(0)
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current)
    fadeTimerRef.current = setTimeout(() => {
      setSelectedFloor(floor)
      setFloorOpacity(1)
    }, FLOOR_FADE_MS)
  }

  function handleRoomClick(spaceId: number, position: [number, number, number]) {
    setFlyTarget(position)
    onSpaceClick?.(spaceId)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {floors.map((floor) => (
          <button
            key={floor}
            onClick={() => handleFloorChange(floor)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              border: '1px solid #E2E8F0',
              background: floor === selectedFloor ? TEAL : '#ffffff',
              color: floor === selectedFloor ? '#ffffff' : '#475569',
              cursor: 'pointer',
            }}
          >
            {t('index.list.floorLabel', { floor })}
          </button>
        ))}
      </div>

      <div
        className="h-[420px] sm:h-[600px]"
        style={{
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          opacity: floorOpacity,
          transition: `opacity ${FLOOR_FADE_MS}ms ease`,
        }}
      >
        <Canvas
          shadows
          camera={{ position: [6, 6, 6], fov: 50 }}
          onCreated={({ gl, scene }) => {
            gl.domElement.addEventListener('webglcontextlost', (event) => {
              event.preventDefault()
            })
            scene.fog = new THREE.Fog('#eef2f7', 14, 34)
            scene.background = new THREE.Color('#eef2f7')
          }}
        >
          <ambientLight intensity={0.55} />
          <directionalLight
            position={[6, 10, 4]}
            intensity={1.1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight position={[-4, 6, -4]} intensity={0.25} />

          <CameraRig
            target={[bounds.centerX, 0, bounds.centerZ]}
            distance={bounds.distance}
            controlsRef={controlsRef}
          />
          <CameraFly target={flyTarget} controlsRef={controlsRef} onDone={stopFlight} />
          <IdleOrbit controlsRef={controlsRef} suspended={flyTarget !== null} />
          <OrbitControls
            ref={controlsRef}
            minDistance={1.5}
            maxDistance={30}
            maxPolarAngle={Math.PI / 2.15}
          />

          <FloorAmbience slab={bounds.slab} />

          <ContactShadows
            position={[bounds.centerX, 0.001, bounds.centerZ]}
            opacity={0.35}
            scale={20}
            blur={2.2}
            far={4}
          />

          {visibleLayout.map((pos, roomIndex) => {
            const space = spaces.find((sp) => sp.id === pos.id)
            if (!space) return null
            const [x, , z] = gridToScene(pos.rx, pos.ry)
            const roomPresences = presences.get(space.id) ?? []
            const occupied = roomPresences.length > 0
            const reservedSoon = !occupied && space.reserved_soon === true
            const capacityHint = capacityById.get(space.id) ?? 6
            const furnitureScaleX = Math.min(ROOM_W / 1.4, 1.5)
            const furnitureScaleZ = Math.min(ROOM_H / 0.9, 1.5)
            const seats = seatsForSpace(space.space_type, capacityHint)
            const floorEmissive = occupied ? MINT : reservedSoon ? AMBER : '#000000'
            const floorEmissiveIntensity = occupied ? 0.22 : reservedSoon ? 0.16 : 0

            return (
              <group key={space.id} position={[x, 0, z]}>
                <mesh
                  position={[0, 0.02, 0]}
                  receiveShadow
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRoomClick(space.id, [x, 0, z])
                  }}
                  onPointerOver={() => { document.body.style.cursor = 'pointer' }}
                  onPointerOut={() => { document.body.style.cursor = 'default' }}
                >
                  <boxGeometry args={[ROOM_W, 0.04, ROOM_H]} />
                  <meshStandardMaterial
                    color={space.status !== 'available' ? '#cbd5e1' : '#f8fafc'}
                    roughness={0.6}
                    emissive={floorEmissive}
                    emissiveIntensity={floorEmissiveIntensity}
                  />
                </mesh>

                {[
                  { p: [0, WALL_HEIGHT / 2, -ROOM_H / 2] as const, s: [ROOM_W, WALL_HEIGHT, WALL_THICKNESS] as const },
                  { p: [0, WALL_HEIGHT / 2, ROOM_H / 2] as const, s: [ROOM_W, WALL_HEIGHT, WALL_THICKNESS] as const },
                  { p: [-ROOM_W / 2, WALL_HEIGHT / 2, 0] as const, s: [WALL_THICKNESS, WALL_HEIGHT, ROOM_H] as const },
                  { p: [ROOM_W / 2, WALL_HEIGHT / 2, 0] as const, s: [WALL_THICKNESS, WALL_HEIGHT, ROOM_H] as const },
                ].map((wall, wi) => (
                  <mesh key={wi} position={[...wall.p]} castShadow>
                    <boxGeometry args={[...wall.s]} />
                    <meshStandardMaterial color="#0D1B2A" transparent opacity={0.24} roughness={0.15} />
                  </mesh>
                ))}

                <group scale={[furnitureScaleX, furnitureScaleX, furnitureScaleZ]}>
                  <Furniture
                    spaceType={space.space_type}
                    capacityHint={capacityHint}
                    roomIndex={roomIndex}
                    occupiedSeats={roomPresences.length}
                  />
                </group>

                {roomPresences.map((presence, seatIndex) => {
                  const seat = seats[seatIndex]
                  if (!seat) return null
                  return (
                    <AvatarMarker
                        key={presence.userId}
                        seat={seat}
                        position={[seat.x * furnitureScaleX, 0, seat.z * furnitureScaleZ]}
                        userName={presence.userName}
                        userId={presence.userId}
                        avatarUrl={presence.avatarUrl}
                        baseScale={furnitureScaleX}
                      />
                  )
                })}

                <PillLabel
                  text={space.name}
                  position={[0, WALL_HEIGHT + 0.14, -ROOM_H / 2]}
                  edgeAnchor={{ halfDepth: ROOM_H / 2 }}
                />
              </group>
            )
          })}
        </Canvas>
      </div>

      <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 12, color: '#64748b' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: MINT, display: 'inline-block' }} />
          {t('threeD.legend.occupiedNow')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: AMBER, display: 'inline-block' }} />
          {t('threeD.legend.reservedSoon')}
        </span>
      </div>
    </div>
  )
}