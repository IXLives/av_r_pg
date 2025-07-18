// Keyboard controls for desktop testing
import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import { PlayerCombatSystem } from '../systems/PlayerCombatSystem'

export default function KeyboardControls() {
  const { ecsWorld } = useGameStore()

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Get combat system
      const worldSystems = (ecsWorld as unknown as { systems: PlayerCombatSystem[] }).systems
      const combatSystem = worldSystems.find(s => s instanceof PlayerCombatSystem)
      
      if (!combatSystem) return

      switch (event.code) {
        case 'Space': {
          event.preventDefault()
          const success = combatSystem.tryAttack()
          if (success) {
            console.log('Spacebar attack!')
          } else {
            console.log('Attack on cooldown or no target!')
          }
          break
        }
        
        case 'KeyQ': {
          event.preventDefault()
          const success = combatSystem.castFireball()
          if (success) {
            console.log('Q - Fireball cast!')
          } else {
            console.log('Fireball failed - no target or on cooldown!')
          }
          break
        }

        case 'KeyW': {
          event.preventDefault()
          const success = combatSystem.castIceShard()
          if (success) {
            console.log('W - Ice Shard cast!')
          }
          break
        }

        case 'KeyE': {
          event.preventDefault()
          const success = combatSystem.castLightning()
          if (success) {
            console.log('E - Lightning cast!')
          }
          break
        }

        case 'KeyR': {
          event.preventDefault()
          const success = combatSystem.castHeal()
          if (success) {
            console.log('R - Heal cast!')
          }
          break
        }
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyPress)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [ecsWorld])

  // This component doesn't render anything
  return null
}
