import { NextRequest, NextResponse } from 'next/server';
import { AccessToken, VideoGrant } from 'livekit-server-sdk';

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    const { roomName, participantIdentity } = await request.json();
    
    // Validate required parameters
    if (!roomName || !participantIdentity) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Validate API credentials
    if (!API_KEY || !API_SECRET) {
      console.error('Missing API credentials');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Create access token
    const at = new AccessToken(API_KEY, API_SECRET, {
      identity: participantIdentity,
      name: participantIdentity.split('__')[0], // Get original name
      ttl: 3600 * 24, // Optional: token valid for 24 hours
    });

    // Define participant permissions
    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    // Add permissions to token
    at.addGrant(grant);

    // Generate JWT token
    const token = await at.toJwt();

    // Debug log (remove in production)
    console.log('Token generated for:', {
      room: roomName,
      identity: participantIdentity,
      tokenLength: token.length
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error generating token:', error);
    return new NextResponse(
      `Failed to generate token: ${error instanceof Error ? error.message : 'Unknown error'}`, 
      { status: 500 }
    );
  }
} 