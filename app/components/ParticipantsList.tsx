import { useLocalParticipant, useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import React, { useEffect, useState } from 'react';
import { WaitingParticipant } from '@/lib/types';
import { useRouter } from 'next/navigation';
export function ParticipantsList() {
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const room = useRoomContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
  const [isFirstParticipant, setIsFirstParticipant] = useState(false);
  const [waitingParticipants, setWaitingParticipants] = useState<WaitingParticipant[]>([]);

  const router = useRouter();
  // Check if current participant is the first one
  useEffect(() => {
    const checkFirstParticipant = () => {
      // If there are no remote participants or all remote participants joined after the local participant
      const isFirst = remoteParticipants.every(participant => 
        participant.joinedAt && localParticipant.joinedAt && 
        participant.joinedAt > localParticipant.joinedAt
      );
      setIsFirstParticipant(isFirst);
    };

    checkFirstParticipant();
  }, [localParticipant, remoteParticipants]);

  useEffect(() => {
    if (!isFirstParticipant) return;

    const fetchWaitingParticipants = async () => {
      const response = await fetch(`/api/waiting-room?roomName=${room.name}`);
      const data = await response.json();
      setWaitingParticipants(data);
    };

    const interval = setInterval(fetchWaitingParticipants, 5000);
    fetchWaitingParticipants();

    return () => clearInterval(interval);
  }, [isFirstParticipant, room.name]);

  const handleRemoveClick = (participantIdentity: string) => {
    // Only allow removal if current participant is the first one
    if (!isFirstParticipant) {
      return;
    }
    setSelectedParticipant(participantIdentity);
    setShowModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!selectedParticipant) return;
    
    try {
      const response = await fetch('/api/participants/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName: room.name,
          participantIdentity: selectedParticipant,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove participant');
      }
      if (!response.ok) {
        router.push('/');
      }

    } catch (error) {
      console.error('Error removing participant:', error);
    }
    
    setShowModal(false);
    setSelectedParticipant(null);
  };

  const handleApproveParticipant = async (participantIdentity: string) => {
    try {
      // alert(`Approving participant ${participantIdentity}`);
      // First generate approval token
      const approveResponse = await fetch('/api/waiting-room/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
          participantIdentity
        })
      });

      if (!approveResponse.ok) {
        throw new Error('Failed to approve participant');
      }

      // Get the actual response data
      const responseData = await approveResponse.json();
      // alert(`Approving response: ${JSON.stringify(responseData)}`);

      // Then remove from waiting list
      await fetch('/api/waiting-room', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: room.name,
          participantIdentity
        })
      });

      // Update local state
      setWaitingParticipants(prev => 
        prev.filter(p => p.identity !== participantIdentity)
      );

    } catch (error) {
      console.error('Error approving participant:', error);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'absolute',
          left: '20px',
          bottom: '80px',
          zIndex: 100,
          padding: '8px 16px',
          borderRadius: '20px',
          background: '#000000',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
        </svg>
        Participants ({remoteParticipants.length + 1})
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          left: '20px',
          bottom: '140px',
          width: '320px',
          maxHeight: 'calc(100vh - 180px)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>
              Participants ({remoteParticipants.length + 1})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px',
                opacity: 0.7
              }}
            >
              ✕
            </button>
          </div>

          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Local participant */}
            <div style={{
              background: 'rgba(45, 140, 255, 0.2)',
              padding: '12px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <div style={{
                  background: '#2D8CFF',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 500
                }}>
                  {localParticipant.identity.charAt(0).toUpperCase()}
                </div>
                <span style={{ color: 'white' }}>
                  {localParticipant.identity.split('__')[0]} (You)
                </span>
              </div>
            </div>

            {/* Remote participants */}
            {remoteParticipants.map((participant) => (
              <div
                key={participant.identity}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    background: '#383838',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 500
                  }}>
                    {participant.identity.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ color: 'white' }}>
                    {participant.identity.split('__')[0]}
                  </span>
                </div>
                {isFirstParticipant && (
                  <button
                    onClick={() => handleRemoveClick(participant.identity)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      padding: '8px'
                    }}
                    title="Remove participant"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                      <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1z"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Waiting Participants */}
          {isFirstParticipant && waitingParticipants.length > 0 && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Waiting Room</h4>
              {waitingParticipants.map((participant) => (
                <div
                  key={participant.identity}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: 'rgba(255, 152, 0, 0.1)',
                    borderRadius: '4px',
                    marginBottom: '0.5rem'
                  }}
                >
                  <span style={{ color: 'white' }}>{participant.name}</span>
                  <button
                    onClick={() => handleApproveParticipant(participant.identity)}
                    style={{
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Approve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <div style={{
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '90%',
            width: '400px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <h3 style={{ color: '#fff', marginTop: 0 }}>Remove Participant</h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Are you sure you want to remove this participant?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              marginTop: '24px'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'transparent',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRemove}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: 'none',
                  background: '#FF3B30',
                  color: '#fff',
                  cursor: 'pointer'
                }}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
