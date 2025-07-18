import { useState, useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'
import type { HealthComponent } from '../systems/CombatComponents'

export default function PlayerUI() {
  const { ecsWorld, respawnPlayer } = useGameStore()
  const [playerHealth, setPlayerHealth] = useState({ current: 100, maximum: 100 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Update player health every frame
    const updatePlayerHealth = () => {
      const playerEntity = ecsWorld.getEntity('player_entity')
      if (playerEntity) {
        const healthComponent = playerEntity.getComponent<HealthComponent>('health')
        if (healthComponent) {
          setPlayerHealth({
            current: healthComponent.current,
            maximum: healthComponent.maximum
          })
          setIsVisible(true)
        }
      }
    }

    // Update health display periodically
    const interval = setInterval(updatePlayerHealth, 100) // Update 10 times per second

    return () => clearInterval(interval)
  }, [ecsWorld])

  if (!isVisible) return null

  const healthPercent = (playerHealth.current / playerHealth.maximum) * 100
  const isLowHealth = healthPercent < 30

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      fontFamily: 'Arial, sans-serif',
      color: 'white',
      textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
    }}>
      {/* Health Bar */}
      <div style={{
        background: 'rgba(0,0,0,0.7)',
        padding: '10px',
        borderRadius: '8px',
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '5px', fontSize: '14px', fontWeight: 'bold' }}>
          Player Health
        </div>
        
        {/* Health Bar Background */}
        <div style={{
          width: '180px',
          height: '20px',
          background: '#330000',
          borderRadius: '10px',
          border: '2px solid #666',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Health Bar Fill */}
          <div style={{
            width: `${healthPercent}%`,
            height: '100%',
            background: isLowHealth ? 
              'linear-gradient(90deg, #cc0000, #ff3333)' : 
              'linear-gradient(90deg, #00cc00, #33ff33)',
            transition: 'width 0.3s ease',
            borderRadius: '8px'
          }} />
          
          {/* Health Text */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '1px 1px 1px rgba(0,0,0,0.8)'
          }}>
            {Math.ceil(playerHealth.current)} / {playerHealth.maximum}
          </div>
        </div>
        
        {/* Low Health Warning */}
        {isLowHealth && (
          <div style={{
            marginTop: '5px',
            fontSize: '12px',
            color: '#ff6666',
            fontWeight: 'bold',
            animation: 'blink 1s infinite'
          }}>
            ⚠️ LOW HEALTH!
          </div>
        )}
      </div>

      {/* Death Message */}
      {playerHealth.current <= 0 && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.9)',
          padding: '30px',
          borderRadius: '10px',
          textAlign: 'center',
          fontSize: '24px',
          color: '#ff3333',
          fontWeight: 'bold',
          border: '3px solid #cc0000'
        }}>
          <div>💀 YOU DIED 💀</div>
          <div style={{ fontSize: '14px', marginTop: '10px', color: '#cccccc' }}>
            Click below to respawn
          </div>
          <button
            onClick={respawnPlayer}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              color: 'white',
              background: '#4CAF50',
              border: '2px solid #45a049',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#45a049'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4CAF50'}
          >
            🔄 RESPAWN
          </button>
        </div>
      )}

      {/* CSS Animation for blinking */}
      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
