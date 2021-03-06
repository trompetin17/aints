import * as Config from '../config/config'

interface Creep {
  _currentDepositPheromone?: string
  _currentSearchPheromone?: string
  _directionPriorities?: number[]
  _isCaryingEnergy?: boolean
  _isHarvesting?: boolean
  _isSearching?: boolean
  _isUpgrading?: boolean
  _lastDirection?: number
  _lastMoveWasSuccessful?: boolean
  _lastPheromoneDepositAmount?: number
  _nearbyController?: Controller
  _nearbySource?: Source
  _nearbySpawn?: Spawn
  _nearbyTiles?: Array<{ dir: number, tile: LookTile }>
  _stepsFromLastSite?: number
  readonly directionPriorities: number[]
  readonly isCarryingEnergy: boolean
  readonly isHarvesting: boolean
  readonly isUpgrading: boolean
  readonly nearbyController?: Controller
  readonly nearbySource?: Source
  readonly nearbySpawn?: Spawn
  readonly nearbyTiles: Array<{ dir: number, tile: LookTile }>
  currentDepositPheromone?: string
  currentSearchPheromone: string
  isSearching: boolean
  lastDirection?: number
  lastMoveWasSuccessful: boolean
  lastPheromoneDepositAmount: number
  stepsFromLastSite: number
  run(): void
  depositPheromone(): number
  getSearchPheromoneDirection(): number
  searchMove(): boolean
}

// --- Properties ---

Object.defineProperty(Creep.prototype, 'isCarryingEnergy', {
  configurable: true,
  get(this: Creep) {
    if (this._isCaryingEnergy === undefined) {
      this._isCaryingEnergy = (this.carry.energy || 0) > 0
    }
    return this._isCaryingEnergy
  }
})

Object.defineProperty(Creep.prototype, 'currentDepositPheromone', {
  configurable: true,
  get(this: Creep) {
    if (this._currentDepositPheromone === undefined && this.memory.currentDepositPheromone !== undefined) {
      this._currentDepositPheromone = this.memory.currentDepositPheromone
    }
    if (this._currentDepositPheromone === undefined) {
      this._currentDepositPheromone = this.isSearching ? 'home' : undefined
    }
    if (this.memory.currentDepositPheromone !== this._currentDepositPheromone) {
      this.memory.currentDepositPheromone = this._currentDepositPheromone
    }
    return this._currentDepositPheromone
  },
  set(this: Creep, value: string) {
    this._currentDepositPheromone = value
    this.memory.currentDepositPheromone = this._currentDepositPheromone
  }
})

Object.defineProperty(Creep.prototype, 'currentSearchPheromone', {
  configurable: true,
  get(this: Creep) {
    if (this._currentSearchPheromone === undefined && this.memory.currentSearchPheromone !== undefined) {
      this._currentSearchPheromone = this.memory.currentSearchPheromone
    }
    if (this._currentSearchPheromone === undefined) {
      this._currentSearchPheromone = this.isSearching ? 'energy' : 'home'
    }
    if (this.memory.currentSearchPheromone !== this._currentSearchPheromone) {
      this.memory.currentSearchPheromone = this._currentSearchPheromone
    }
    return this._currentSearchPheromone
  },
  set(this: Creep, value: string) {
    this._currentSearchPheromone = value
    this.memory.currentSearchPheromone = this._currentSearchPheromone
  }
})

Object.defineProperty(Creep.prototype, 'directionPriorities', {
  configurable: true,
  get(this: Creep) {
    if (this._directionPriorities === undefined) {
      switch (this.lastDirection) {
        case TOP:
          this._directionPriorities = (_.shuffle([TOP, TOP_LEFT, TOP_RIGHT]) as number[])
            .concat(_.shuffle([LEFT, RIGHT]), _.shuffle([BOTTOM_LEFT, BOTTOM_RIGHT]))
          break
        case TOP_LEFT:
          this._directionPriorities = (_.shuffle([TOP_LEFT, LEFT, TOP]) as number[])
            .concat(_.shuffle([BOTTOM_LEFT, TOP_RIGHT]), _.shuffle([BOTTOM, RIGHT]))
          break
        case LEFT:
          this._directionPriorities = (_.shuffle([LEFT, BOTTOM_LEFT, TOP_LEFT]) as number[])
            .concat(_.shuffle([BOTTOM, TOP]), _.shuffle([BOTTOM_RIGHT, TOP_RIGHT]))
          break
        case BOTTOM_LEFT:
          this._directionPriorities = (_.shuffle([BOTTOM_LEFT, BOTTOM, LEFT]) as number[])
            .concat(_.shuffle([BOTTOM_RIGHT, TOP_LEFT]), _.shuffle([RIGHT, TOP]))
          break
        case BOTTOM:
          this._directionPriorities = (_.shuffle([BOTTOM, BOTTOM_RIGHT, BOTTOM_LEFT]) as number[])
            .concat(_.shuffle([RIGHT, LEFT]), _.shuffle([TOP_RIGHT, TOP_LEFT]))
          break
        case BOTTOM_RIGHT:
          this._directionPriorities = (_.shuffle([BOTTOM_RIGHT, RIGHT, BOTTOM]) as number[])
            .concat(_.shuffle([TOP_RIGHT, BOTTOM_LEFT]), _.shuffle([TOP, LEFT]))
          break
        case RIGHT:
          this._directionPriorities = (_.shuffle([RIGHT, TOP_RIGHT, BOTTOM_RIGHT]) as number[])
            .concat(_.shuffle([TOP, BOTTOM]), _.shuffle([TOP_LEFT, BOTTOM_LEFT]))
          break
        case TOP_RIGHT:
          this._directionPriorities = (_.shuffle([TOP_RIGHT, TOP, RIGHT]) as number[])
            .concat(_.shuffle([TOP_LEFT, BOTTOM_RIGHT]), _.shuffle([LEFT, BOTTOM]))
          break
        default:
          this._directionPriorities =
            _.shuffle([TOP, TOP_LEFT, TOP_RIGHT, LEFT, RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT, BOTTOM])
      }
      if (this.lastDirection !== undefined && this._directionPriorities.length < 8) {
        this._directionPriorities.push(this.lastDirection)
      }
    }
    return this._directionPriorities
  }
})

Object.defineProperty(Creep.prototype, 'isHarvesting', {
  configurable: true,
  get(this: Creep) {
    if (this._isHarvesting === undefined) {
      this._isHarvesting =
        this.nearbySource !== undefined && this.nearbySource.energy > 0 && _.sum(this.carry) < this.carryCapacity
    }
    return this._isHarvesting
  }
})

Object.defineProperty(Creep.prototype, 'isUpgrading', {
  configurable: true,
  get(this: Creep) {
    if (this._isUpgrading === undefined) {
      this._isUpgrading = this.nearbyController !== undefined && this.nearbyController.my && this.isCarryingEnergy
    }
    return this._isUpgrading
  }
})

Object.defineProperty(Creep.prototype, 'nearbySource', {
  configurable: true,
  get(this: Creep) {
    if (this._nearbySource === undefined) {
      const sourceTile = _.find(
        this.nearbyTiles,
        ({ tile }) => (tile.sources || []).length > 0 && _.every(tile.sources, (source) => source.energy > 0)
      )
      if (sourceTile !== undefined) { this._nearbySource = _.first(sourceTile.tile.sources) }
    }
    return this._nearbySource
  }
})

Object.defineProperty(Creep.prototype, 'nearbySpawn', {
  configurable: true,
  get(this: Creep) {
    if (this._nearbySpawn === undefined) {
      const spawnTile = _.find(this.nearbyTiles, ({ tile }) => (tile.structures.spawn || []).length > 0)
      if (spawnTile !== undefined) { this._nearbySpawn = _.first(spawnTile.tile.structures.spawn) as Spawn }
    }
    return this._nearbySpawn
  }
})

Object.defineProperty(Creep.prototype, 'nearbyController', {
  configurable: true,
  get(this: Creep) {
    if (this._nearbyController === undefined) {
      const controllerTile = _.find(this.nearbyTiles, ({ tile }) => (tile.structures.controller || []).length > 0)
      if (controllerTile !== undefined) {
        this._nearbyController = _.first(controllerTile.tile.structures.controller) as Controller
      }
    }
    return this._nearbyController
  }
})

Object.defineProperty(Creep.prototype, 'nearbyTiles', {
  configurable: true,
  get(this: Creep) {
    if (this._nearbyTiles === undefined) {
      this._nearbyTiles = []
      const DIRECTION_COORDINATE_DELTAS: { [dir: number]: [number, number] } = {
        8: [-1, -1],  1: [0, -1],  2: [1, -1],
        7: [-1, 0],   /*Center*/   3: [1, 0],
        6: [-1, 1],   5: [0, 1],   4: [1, 1]
      }
      const {x, y} = this.pos
      for (const dir in DIRECTION_COORDINATE_DELTAS) {
        const [dx, dy] = DIRECTION_COORDINATE_DELTAS[dir]
        const nx = x + dx
        const ny = y + dy
        const tile = this.room.getLookTile(nx, ny)
        if (tile === undefined) { continue }
        this._nearbyTiles.push({ dir: parseInt(dir, 10), tile })
      }
    }
    return this._nearbyTiles
  }
})

Object.defineProperty(Creep.prototype, 'isSearching', {
  configurable: true,
  get(this: Creep) {
    if (this._isSearching === undefined && this.memory.isSearching !== undefined) {
      this._isSearching = this.memory.isSearching
    }
    if (this._isSearching === undefined) {
      this._isSearching = true
    }
    return this._isSearching
  },
  set(this: Creep, value: boolean) {
    this._isSearching = value
    this.memory.isSearching = this._isSearching
    this.stepsFromLastSite = 0
  }
})

Object.defineProperty(Creep.prototype, 'lastDirection', {
  configurable: true,
  get(this: Creep) {
    if (this._lastDirection === undefined && this.memory.lastDirection !== undefined) {
      this._lastDirection = this.memory.lastDirection
    }
    if (this.memory.lastDirection !== this._lastDirection) {
      this.memory.lastDirection = this._lastDirection
    }
    return this._lastDirection
  },
  set(this: Creep, value: number | undefined) {
    this._lastDirection = value
    this.memory.lastDirection = this._lastDirection
  }
})

Object.defineProperty(Creep.prototype, 'lastMoveWasSuccessful', {
  configurable: true,
  get(this: Creep) {
    if (this._lastMoveWasSuccessful === undefined && this.memory.lastMoveWasSuccessful !== undefined) {
      this._lastMoveWasSuccessful = this.memory.lastMoveWasSuccessful
    }
    if (this._lastMoveWasSuccessful === undefined) {
      this._lastMoveWasSuccessful = true
    }
    if (this.memory.lastMoveWasSuccessful !== this._lastMoveWasSuccessful) {
      this.memory.lastMoveWasSuccessful = this._lastMoveWasSuccessful
    }
    return this._lastMoveWasSuccessful
  },
  set(this: Creep, value: boolean) {
    this.memory.lastMoveWasSuccessful = value
    this.memory.lastMoveWasSuccessful = this._lastMoveWasSuccessful
  }
})

Object.defineProperty(Creep.prototype, 'lastPheromoneDepositAmount', {
  configurable: true,
  get(this: Creep) {
    if (this._lastPheromoneDepositAmount === undefined && this.memory.lastPheromoneDepositAmount !== undefined) {
      this._lastPheromoneDepositAmount = this.memory.lastPheromoneDepositAmount
    }
    if (this._lastPheromoneDepositAmount === undefined) {
      this._lastPheromoneDepositAmount = 0
    }
    if (this.memory.lastPheromoneDepositAmount !== this._lastPheromoneDepositAmount) {
      this.memory.lastPheromoneDepositAmount = this._lastPheromoneDepositAmount
    }
    return this._lastPheromoneDepositAmount
  },
  set(this: Creep, value: number) {
    this._lastPheromoneDepositAmount = value
    this.memory.lastPheromoneDepositAmount = this._lastPheromoneDepositAmount
  }
})

Object.defineProperty(Creep.prototype, 'stepsFromLastSite', {
  configurable: true,
  get(this: Creep) {
    if (this._stepsFromLastSite === undefined && this.memory.stepsFromLastSite !== undefined) {
      this._stepsFromLastSite = this.memory.stepsFromLastSite
    }
    if (this._stepsFromLastSite === undefined) {
      this._stepsFromLastSite = 0
    }
    if (this.memory.stepsFromLastSite !== this._stepsFromLastSite) {
      this.memory.stepsFromLastSite = this._stepsFromLastSite
    }
    return this._stepsFromLastSite
  },
  set(this: Creep, value: number) {
    this._stepsFromLastSite = value
    this.memory.stepsFromLastSite = this._stepsFromLastSite
  }
})

// --- Methods ---

Creep.prototype.run = function(this: Creep) {
  if (this.spawning) { return }

  if (this.fatigue > 0 && this.lastMoveWasSuccessful) { this.stepsFromLastSite++ }

  if (this.nearbySpawn !== undefined) {
    const spawnFull = (this.carry.energy || 0) + this.nearbySpawn.energy > this.nearbySpawn.energyCapacity
    this.currentSearchPheromone = spawnFull ? 'controller' : 'energy'
    this.currentDepositPheromone = 'home'
    this.lastDirection = undefined
    this.isSearching = true
  }

  if (this.isHarvesting) {
    this.currentDepositPheromone = 'energy'
    this.currentSearchPheromone = 'home'
    this.lastDirection = undefined
    this.isSearching = false
  }

  if (this.isUpgrading) {
    this.currentDepositPheromone = 'controller'
    this.currentSearchPheromone = 'home'
    this.lastDirection = undefined
    this.isSearching = false
  }

  // Deposit pheromone
  if (this.lastMoveWasSuccessful) { this.lastPheromoneDepositAmount = this.depositPheromone() }

  // Check for spawn to transfer to
  if (this.nearbySpawn !== undefined) { this.transfer(this.nearbySpawn, RESOURCE_ENERGY) }
  // Check for harvesting
  if (this.isHarvesting) { this.harvest(this.nearbySource!) }
  // Check for upgrading
  if (this.isUpgrading) { this.upgradeController(this.nearbyController!) }

  // Check for max search length
  if (this.isSearching && this.stepsFromLastSite >= Config.SEARCH_MAX_STEPS) {
    this.currentDepositPheromone = undefined
    this.currentSearchPheromone = 'home'
    this.lastDirection = undefined
    this.isSearching = false
  }

  // Move
  if (!this.isHarvesting && !this.isUpgrading && this.fatigue < 1) { this.lastMoveWasSuccessful = this.searchMove() }
}

Creep.prototype.depositPheromone = function(this: Creep): number {
  if (this.currentDepositPheromone === undefined) { return 0 }
  const currentDepositLevel = this.room.pheromoneNetwork
    .getTileLevel(this.currentDepositPheromone, this.pos.x, this.pos.y)
  const depositAmount = Config.PHEROMONE_MAX_TILE_AMOUNT -
    (this.stepsFromLastSite * Config.PHEROMONE_MIN_DEPOSIT_AMOUNT)
  if (depositAmount < currentDepositLevel) { return 0 }
  this.room.pheromoneNetwork.setTileLevel(this.currentDepositPheromone, this.pos.x, this.pos.y, depositAmount)
  return depositAmount
}

Creep.prototype.getSearchPheromoneDirection = function(this: Creep): number {
  const walkableTiles = _.filter(this.nearbyTiles, ({ dir, tile }) =>
    this.directionPriorities.indexOf(dir) !== -1 && tile.isWalkable(this.isSearching ? Math.random() < 0.33 : true)
  ).sort((a, b) => this.directionPriorities.indexOf(a.dir) - this.directionPriorities.indexOf(b.dir))
  const dirLevels = _.map(walkableTiles, ({ dir, tile }) => {
    const searchPheromoneLevel = tile.pheromones[this.currentSearchPheromone]
    const depositPheromoneLevel = this.currentDepositPheromone !== undefined ?
      tile.pheromones[this.currentDepositPheromone] : 0
    return { dir, level: depositPheromoneLevel - (searchPheromoneLevel * 2) }
  })
  const result = _.min(dirLevels, ({ level }) => level)
  return result.dir
}

Creep.prototype.searchMove = function(this: Creep): boolean {
  const mdir = this.getSearchPheromoneDirection()
  if (this.move(mdir) === OK) {
    this.lastDirection = mdir
    this.stepsFromLastSite++
    // exit check
    const tile = _.find(this.nearbyTiles, ({ dir }) => dir === mdir).tile
    if (
      this.currentDepositPheromone !== undefined &&
      (tile.x === 0 || tile.y === 0 || tile.x === 49 || tile.y === 49)
    ) {
      const currentDepositLevel = this.room.pheromoneNetwork.getTileLevel(this.currentDepositPheromone, tile.x, tile.y)
      const depositAmount = Config.PHEROMONE_MAX_TILE_AMOUNT -
        (this.stepsFromLastSite * Config.PHEROMONE_MIN_DEPOSIT_AMOUNT)
      if (depositAmount > currentDepositLevel) {
        this.room.pheromoneNetwork.setTileLevel(this.currentDepositPheromone, tile.x, tile.y, depositAmount)
      }
    }
    return true
  }
  this.lastDirection = undefined
  return false
}
