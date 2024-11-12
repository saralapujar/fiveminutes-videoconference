import React, { useEffect, useState } from 'react';

interface WaitingRoomProps {
  roomName: string;
  participantName: string;
  onApproved: (token: string) => void;
  onCheckStatus: (roomName: string, participantName: string) => Promise<boolean>;
  onGetToken: (roomName: string, participantName: string) => Promise<string>;
}

export function WaitingRoom({ 
  roomName, 
  participantName, 
  onApproved,
  onCheckStatus,
  onGetToken 
}: WaitingRoomProps) {
  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const isApproved = await onCheckStatus(roomName, participantName);
        
        if (isApproved) {
          const token = await onGetToken(roomName, participantName);
          if (token) {
            onApproved(token);
          }
        }
      } catch (error) {
        console.error('Error checking approval status:', error);
      }
    };

    const interval = setInterval(checkApprovalStatus, 3000);
    return () => clearInterval(interval);
  }, [roomName, participantName, onApproved, onCheckStatus, onGetToken]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#111'
    }}>
      <div style={{
        background: 'black',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h2>Waiting Room</h2>
        <p>Please wait while the host admits you to the meeting.</p>
        <div style={{
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <div className="loading-spinner"></div>
          Waiting for admission...
        </div>
      </div>
      
      <style jsx>{`
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
} 