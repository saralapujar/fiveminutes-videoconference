import { useLocalParticipant, useRemoteParticipants, useRoomContext } from '@livekit/components-react';
import { DataPacket_Kind, ConnectionState } from 'livekit-client';
import React, { useCallback, useEffect, useState, useRef } from 'react';

interface ChatMessage {
  message: string;
  senderIdentity: string;
  timestamp: number;
  type: 'USER' | 'SYSTEM';
}

export function Chat() {
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { localParticipant } = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const room = useRoomContext();

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Subscribe to incoming messages
  useEffect(() => {
    const handleData = (payload: Uint8Array, participant: any) => {
      try {
        const decoder = new TextDecoder();
        const message = decoder.decode(payload);
        const messageData: ChatMessage = JSON.parse(message);
        setMessages((prev) => [...prev, messageData]);
        if (!isOpen) {
          setUnreadCount((prev) => prev + 1);
        }
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    room.on('dataReceived', handleData);
    return () => {
      room.off('dataReceived', handleData);
    };
  }, [room, isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim()) return;

    const messageData: ChatMessage = {
      message: inputMessage.trim(),
      senderIdentity: localParticipant.identity,
      timestamp: Date.now(),
      type: 'USER'
    };

    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(messageData));
    room.localParticipant.publishData(data, {
      reliable: true  // This is the only valid option in DataPublishOptions
    });
    // room.localParticipant.publishData(data, DataPacket_Kind.RELIABLE);
    setMessages((prev) => [...prev, messageData]);
    setInputMessage('');
  }, [inputMessage, localParticipant, room]);

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="chat-toggle"
        style={{
          position: 'absolute',
          right: '20px',
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
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="currentColor"/>
        </svg>
        {unreadCount > 0 && (
          <span className="unread-badge" style={{
            background: '#FF3B30',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '12px',
            fontWeight: 'bold',
            minWidth: '20px',
            textAlign: 'center'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="chat-container" style={{
          position: 'absolute',
          right: '20px',
          bottom: '140px', // Changed from top: '70px' to bottom: '140px'
          width: '320px',
          maxHeight: 'calc(100vh - 180px)',
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          zIndex: 100,
          animation: 'slideIn 0.3s ease-out',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="chat-header" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Chat</h3>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                padding: '4px',
                opacity: 0.7,
                transition: 'opacity 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '0.7'}
            >
              ✕
            </button>
          </div>

          <div className="messages" style={{
            flex: 1,
            overflowY: 'auto',
            marginBottom: '16px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.senderIdentity === localParticipant.identity ? 'flex-end' : 'flex-start',
                  maxWidth: '100%'
                }}
              >
                <div style={{
                  background: msg.senderIdentity === localParticipant.identity ? '#2D8CFF' : '#383838',
                  padding: '8px 12px',
                  borderRadius: msg.senderIdentity === localParticipant.identity ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  maxWidth: '85%',
                  wordBreak: 'break-word',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}>
                  <div style={{
                    fontSize: '0.8em',
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '4px',
                    fontWeight: 500
                  }}>
                    {msg.senderIdentity.split('__')[0]}
                  </div>
                  <div style={{ color: '#fff' }}>{msg.message}</div>
                </div>
                <div style={{
                  fontSize: '0.7em',
                  color: 'rgba(255,255,255,0.5)',
                  marginTop: '4px',
                  padding: '0 4px'
                }}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            position: 'relative'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.2)',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                fontSize: '0.95rem'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                background: '#2D8CFF',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                opacity: inputMessage.trim() ? 1 : 0.5,
                transition: 'all 0.2s ease',
                fontWeight: 500
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .messages::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        
        .messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        
        input:focus {
          border-color: #2D8CFF !important;
        }
        
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        }
      `}</style>
    </>
  );
}
