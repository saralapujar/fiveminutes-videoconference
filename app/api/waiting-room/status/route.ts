import { NextRequest, NextResponse } from 'next/server';
import { waitingParticipants } from '../route';

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName');
  const participantName = request.nextUrl.searchParams.get('participantName');
  
  if (!roomName || !participantName) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  // Check if participant is still in waiting list
  const waitingList = waitingParticipants.get(roomName) || [];
  const isWaiting = waitingList.some(p => p.name === participantName);

  // If not in waiting list, they were approved
  if (!isWaiting) {
    return NextResponse.json({ approved: true });
  }

  return NextResponse.json({ approved: false });
} 