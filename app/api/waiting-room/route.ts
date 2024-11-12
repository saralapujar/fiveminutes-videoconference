import { NextRequest, NextResponse } from 'next/server';
import { RoomServiceClient, Room } from 'livekit-server-sdk';
import { WaitingParticipant } from '@/lib/types';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

// In-memory store for waiting participants (replace with database in production)
export const waitingParticipants: Map<string, WaitingParticipant[]> = new Map();

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName');
  if (!roomName) {
    return new NextResponse('Room name is required', { status: 400 });
  }

  const participants = waitingParticipants.get(roomName) || [];
  return NextResponse.json(participants);
}

export async function POST(request: NextRequest) {
  const { roomName, participantName } = await request.json();
  
  if (!roomName || !participantName) {
    return new NextResponse('Room name and participant name are required', { status: 400 });
  }

  const roomService = new RoomServiceClient(LIVEKIT_URL!, API_KEY!, API_SECRET!);
  
  try {
    // Try to get room participants
    let participants;
    try {
      participants = await roomService.listParticipants(roomName);
    } catch (error) {
      // Room doesn't exist yet, create it
      await roomService.createRoom({
        name: roomName,
        emptyTimeout: 10 * 60, // 10 minutes
        maxParticipants: 20,
      });
      participants = [];
    }
    
    // If no participants, this person is first
    if (participants.length === 0) {
      return NextResponse.json({ isFirst: true });
    }

    // Add to waiting list
    const waitingList = waitingParticipants.get(roomName) || [];
    const newParticipant = {
      identity: `${participantName}__${Math.random().toString(36).slice(2, 7)}`,
      name: participantName,
      timestamp: Date.now()
    };
    
    waitingList.push(newParticipant);
    waitingParticipants.set(roomName, waitingList);

    return NextResponse.json({ 
      isFirst: false,
      identity: newParticipant.identity 
    });

  } catch (error) {
    console.error('Waiting room error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { roomName, participantIdentity } = await request.json();
    
    if (!roomName || !participantIdentity) {
      return new NextResponse('Room name and participant identity are required', { status: 400 });
    }

    const waitingList = waitingParticipants.get(roomName) || [];
    const updatedList = waitingList.filter(p => p.identity !== participantIdentity);
    waitingParticipants.set(roomName, updatedList);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error removing from waiting list:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 