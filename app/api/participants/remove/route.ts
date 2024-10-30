import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantIdentity } = await request.json();

    if (!roomName || !participantIdentity) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    const roomService = new RoomServiceClient(
      LIVEKIT_URL!,
      API_KEY!,
      API_SECRET!
    );

    await roomService.removeParticipant(roomName, participantIdentity);
    
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error removing participant:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 