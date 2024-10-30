import { useLocalParticipant, useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import React from 'react';

export function ParticipantsList() {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();

  const handleRemoveParticipant = async (participantIdentity: string) => {
    try {
      const response = await fetch('/api/participants/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: room.name,
          participantIdentity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      padding: '16px',
      borderRadius: '12px',
      minWidth: '300px',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1000
    }}>
      <h3 style={{ 
        margin: '0 0 12px 0',
        color: '#fff',
        fontSize: '1.1rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: '8px'
      }}>
        Participants ({remoteParticipants.length + 1})
      </h3>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Local participant */}
        <div style={{
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              background: '#2D8CFF',
              padding: '8px',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px'
            }}>
              {localParticipant.identity.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: '14px' }}>{localParticipant.identity.split('__')[0]} (You)</span>
          </div>
        </div>

        {/* Remote participants */}
        {remoteParticipants.map((participant) => (
          <div
            key={participant.identity}
            style={{
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              transition: 'background-color 0.2s ease'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                background: '#383838',
                padding: '8px',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}>
                {participant.identity.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '14px' }}>{participant.identity.split('__')[0]}</span>
            </div>
            <button
              onClick={() => handleRemoveParticipant(participant.identity)}
              style={{
                background: '#dc2626',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
