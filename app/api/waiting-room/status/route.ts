import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Create a function to get waiting participants
async function getWaitingParticipants(roomName: string) {
  const headersList = headers();
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const host = headersList.get('host') || 'localhost:3000';
  const baseUrl = `${protocol}://${host}`;
  
  const response = await fetch(`${baseUrl}/api/waiting-room?roomName=${roomName}`);
  if (!response.ok) {
    throw new Error('Failed to fetch waiting participants');
  }
  return response.json();
}

export async function GET(request: NextRequest) {
  const roomName = request.nextUrl.searchParams.get('roomName');
  const participantName = request.nextUrl.searchParams.get('participantName');
  
  if (!roomName || !participantName) {
    return new NextResponse('Missing required parameters', { status: 400 });
  }

  try {
    const waitingList = await getWaitingParticipants(roomName);
    const isWaiting = waitingList.some((p: any) => p.name === participantName);

    return NextResponse.json({ approved: !isWaiting });
  } catch (error) {
    console.error('Error checking waiting status:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
} 