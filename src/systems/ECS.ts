// Entity-Component-System (ECS) Architecture
// Inspired by Path of Exile's modular game systems

// Unique entity identifier
export type EntityId = string

// Base component interface
export interface Component {
  type: string
}

// Entity class - just a container for components
export class Entity {
  public id: EntityId
  private components = new Map<string, Component>()

  constructor(id?: EntityId) {
    this.id = id || `entity_${Math.random().toString(36).substr(2, 9)}`
  }

  // Add a component to this entity
  addComponent<T extends Component>(component: T): this {
    this.components.set(component.type, component)
    return this
  }

  // Get a component by type
  getComponent<T extends Component>(type: string): T | undefined {
    return this.components.get(type) as T | undefined
  }

  // Check if entity has a component
  hasComponent(type: string): boolean {
    return this.components.has(type)
  }

  // Remove a component
  removeComponent(type: string): boolean {
    return this.components.delete(type)
  }

  // Get all components
  getAllComponents(): Component[] {
    return Array.from(this.components.values())
  }

  // Destroy entity (remove all components)
  destroy(): void {
    this.components.clear()
  }
}

// Base system interface
export abstract class System {
  abstract update(entities: Entity[], deltaTime: number): void
}

// ECS World - manages all entities and systems
export class ECSWorld {
  private entities = new Map<EntityId, Entity>()
  private systems: System[] = []

  // Entity management
  createEntity(id?: EntityId): Entity {
    const entity = new Entity(id)
    this.entities.set(entity.id, entity)
    return entity
  }

  getEntity(id: EntityId): Entity | undefined {
    return this.entities.get(id)
  }

  removeEntity(id: EntityId): boolean {
    const entity = this.entities.get(id)
    if (entity) {
      entity.destroy()
      return this.entities.delete(id)
    }
    return false
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values())
  }

  // Get entities that have specific components
  getEntitiesWithComponents(...componentTypes: string[]): Entity[] {
    return this.getAllEntities().filter(entity =>
      componentTypes.every(type => entity.hasComponent(type))
    )
  }

  // System management
  addSystem(system: System): void {
    this.systems.push(system)
  }

  removeSystem(system: System): boolean {
    const index = this.systems.indexOf(system)
    if (index !== -1) {
      this.systems.splice(index, 1)
      return true
    }
    return false
  }

  // Update all systems
  update(deltaTime: number): void {
    const entities = this.getAllEntities()
    this.systems.forEach(system => {
      system.update(entities, deltaTime)
    })
  }

  // Clear everything
  clear(): void {
    this.entities.clear()
    this.systems.length = 0
  }
}
