export const FLOOR_LAYOUT_COLS = 4
export const FLOOR_LAYOUT_RECT_W = 160
export const FLOOR_LAYOUT_RECT_H = 90
export const FLOOR_LAYOUT_GAP_X = 40
export const FLOOR_LAYOUT_GAP_Y = 40
export const FLOOR_LAYOUT_PADDING = 32

export interface SpaceLike {
  id: number
  floor: string
}

export interface SpaceGridPosition {
  id: number
  floor: string
  col: number
  row: number
  rx: number
  ry: number
}

export function computeSpaceFloorLayout(spaces: SpaceLike[]): SpaceGridPosition[] {
  const floors = [...new Set(spaces.map((sp) => sp.floor))].sort()
  const positions: SpaceGridPosition[] = []
  let totalHeight = FLOOR_LAYOUT_PADDING

  floors.forEach((floor) => {
    const floorSpaces = spaces.filter((sp) => sp.floor === floor)
    const rows = Math.ceil(floorSpaces.length / FLOOR_LAYOUT_COLS)
    const floorY = totalHeight

    floorSpaces.forEach((space, idx) => {
      const col = idx % FLOOR_LAYOUT_COLS
      const row = Math.floor(idx / FLOOR_LAYOUT_COLS)
      positions.push({
        id: space.id,
        floor: space.floor,
        col,
        row,
        rx: FLOOR_LAYOUT_PADDING + col * (FLOOR_LAYOUT_RECT_W + FLOOR_LAYOUT_GAP_X),
        ry: floorY + 28 + row * (FLOOR_LAYOUT_RECT_H + FLOOR_LAYOUT_GAP_Y),
      })
    })

    totalHeight += 28 + rows * (FLOOR_LAYOUT_RECT_H + FLOOR_LAYOUT_GAP_Y) + FLOOR_LAYOUT_GAP_Y
  })

  return positions
}
