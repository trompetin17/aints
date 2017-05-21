import Profile from '../lib/screeps-profiler/Profile'

@Profile
export default class PheromoneNetwork {
  public static deserialize(memObj: { layers: { [type: string]: number[] }, roomName: string }): PheromoneNetwork {
    const pn = new PheromoneNetwork(Game.rooms[memObj.roomName])
    for (const type in memObj.layers) { pn.layers[type] = PathFinder.CostMatrix.deserialize(memObj.layers[type]) }
    return pn
  }

  public readonly layers: { [type: string]: CostMatrix }

  private room: Room

  constructor(room: Room) {
    this.room = room
    this.layers = {
      controller: new PathFinder.CostMatrix(),
      energy: new PathFinder.CostMatrix(),
      home: new PathFinder.CostMatrix()
    }
  }

  public diffuse() {
    const rate = 0.01
    const min = 4
    let x: number
    let y: number
    for (const type in this.layers) {
      for (x = 0; x < 50; x++) {
        for (y = 0; y < 50; y++) {
          const curr = this.layers[type].get(x, y)
          if (curr < min) { continue }
          const amt = Math.max(Math.floor(curr * rate), 1)
          const DIRECTION_COORDINATE_DELTAS: { [dir: number]: [number, number] } = {
            8: [-1, -1],  1: [0, -1],  2: [1, -1],
            7: [-1, 0],   /*Center*/   3: [1, 0],
            6: [-1, 1],   5: [0, 1],   4: [1, 1]
          }
          const nearbyTiles: Array<{ amount: number, x: number, y: number}> = []
          for (const dir in DIRECTION_COORDINATE_DELTAS) {
            const [dx, dy] = DIRECTION_COORDINATE_DELTAS[dir]
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx > 49 || ny > 49) { continue }
            const nearbyCurr = this.layers[type].get(nx, ny)
            if (nearbyCurr >= curr) { continue }
            nearbyTiles.push({ amount: nearbyCurr, x: nx, y: ny })
          }
          if (nearbyTiles.length < 1) { continue }
          const lowestNearby = _(nearbyTiles).shuffle().min(({ amount }) => amount)
          this.layers[type].set(lowestNearby.x, lowestNearby.y, Math.min(lowestNearby.amount + amt, 255))
          this.layers[type].set(x, y, Math.max(curr - amt, 0))
        }
      }
      this.room.memory.pheromoneNetwork.layers[type] = this.layers[type].serialize()
    }
  }

  public dissipate() {
    const rate = 0.01
    let x: number
    let y: number
    for (const type in this.layers) {
      for (x = 0; x < 50; x++) {
        for (y = 0; y < 50; y++) {
          const curr = this.layers[type].get(x, y)
          if (curr === 0) { continue }
          const amt = Math.max(Math.floor(curr * rate), 1)
          this.layers[type].set(x, y, Math.max(curr - amt, 0))
        }
      }
      this.room.memory.pheromoneNetwork.layers[type] = this.layers[type].serialize()
    }
  }

  public draw(layer: string, color: string = '#CCCCCC') {
    const cm = this.layers[layer]
    const vis = new RoomVisual(this.room.name)
    let x: number
    let y: number
    let size: number
    let max = 0
    for (y = 0; y < 50; ++y) {
      for (x = 0; x < 50; ++x) {
        max = Math.max(max, cm.get(x, y))
      }
    }
    for (y = 0; y < 50; ++y) {
      for (x = 0; x < 50; ++x) {
        size = cm.get(x, y)
        if (size > 0) { vis.circle(x, y, { fill: color, opacity: 0.2, radius: (size / max) / 2 }) }
      }
    }
  }

  public getLevel(type: string, x: number, y: number): number { return this.layers[type].get(x, y) }

  public increaseLevel(type: string, x: number, y: number, amount: number) {
    const current = this.getLevel(type, x, y)
    this.layers[type].set(x, y, current + amount)
    this.room.memory.pheromoneNetwork.layers[type] = this.layers[type].serialize()
  }

  public serialize(): { layers: { [type: string]: number[] }, roomName: string } {
    const resultLayers: { [type: string]: number[] } = {}
    for (const type in this.layers) { resultLayers[type] = this.layers[type].serialize() }
    return { layers: resultLayers, roomName: this.room.name }
  }
}
