'use client';

import { decodePassphrase } from '@/lib/client-utils';
import { DebugMode } from '@/lib/Debug';
import { RecordingIndicator } from '@/lib/RecordingIndicator';
import { SettingsMenu } from '@/lib/SettingsMenu';
import { ConnectionDetails } from '@/lib/types';
import {
  formatChatMessageLinks,
  LiveKitRoom,
  LocalUserChoices,
  PreJoin,
  GridLayout,
  ParticipantTile,
  ControlBar,
  useTracks,
  RoomAudioRenderer,
  TrackReference,
  VideoTrack,
  useRemoteParticipants,
} from '@livekit/components-react';
import {
  ExternalE2EEKeyProvider,
  RoomOptions,
  VideoCodec,
  VideoPresets,
  Room,
  DeviceUnsupportedError,
  RoomConnectOptions,
  Track
} from 'livekit-client';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Chat } from '@/app/components/Chat';
import { ParticipantsList } from '@/app/components/ParticipantsList';
import { WaitingRoom } from '@/app/components/WaitingRoom';


const CONN_DETAILS_ENDPOINT =
  process.env.NEXT_PUBLIC_CONN_DETAILS_ENDPOINT ?? '/api/connection-details';
const SHOW_SETTINGS_MENU = process.env.NEXT_PUBLIC_SHOW_SETTINGS_MENU == 'true';

export function PageClientImpl(props: {
  roomName: string;
  region?: string;
  hq: boolean;
  codec: VideoCodec;
}) {
  const [preJoinChoices, setPreJoinChoices] = React.useState<LocalUserChoices | undefined>(
    undefined,
  );
  const preJoinDefaults = React.useMemo(() => {
    return {
      username: '',
      videoEnabled: true,
      audioEnabled: true,
    };
  }, []);
  const [connectionDetails, setConnectionDetails] = React.useState<ConnectionDetails | undefined>(
    undefined,
  );
  const [isWaiting, setIsWaiting] = React.useState(false);
  const [room, setRoom] = React.useState<Room | undefined>();

  const handlePreJoinSubmit = React.useCallback(async (values: LocalUserChoices) => {
    setPreJoinChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append('roomName', props.roomName);
    url.searchParams.append('participantName', values.username);
    if (props.region) {
      url.searchParams.append('region', props.region);
    }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    
    if (connectionDetailsData.isWaiting) {
      setIsWaiting(true);
    }
    setConnectionDetails(connectionDetailsData);
  }, []);
  const handlePreJoinError = React.useCallback((e: any) => console.error(e), []);

  const handleApproval = async (token: string) => {
    if (connectionDetails) {
      // Disconnect existing room connection if any
      if (room) {
        await room.disconnect();
      }
      
      // Update connection details with new token
      const newConnectionDetails = {
        ...connectionDetails,
        participantToken: token,
        isWaiting: false  // Important to mark as not waiting
      };
      
      setConnectionDetails(newConnectionDetails);
      setIsWaiting(false);
    }
  };

  const checkWaitingStatus = async (roomName: string, participantName: string) => {
    try {
      const response = await fetch(
        `/api/waiting-room/status?roomName=${roomName}&participantName=${participantName}`
      );
      if (!response.ok) throw new Error('Failed to check status');
      const data = await response.json();
      return data.approved;
    } catch (error) {
      console.error('Error checking waiting status:', error);
      return false;
    }
  };

  const getParticipantToken = async (roomName: string, participantName: string) => {
    try {
      const response = await fetch('/api/waiting-room/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
          participantIdentity: participantName,
        }),
      });
      if (!response.ok) throw new Error('Failed to get token');
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error getting participant token:', error);
      throw error;
    }
  };

  return (
    <div style={{ height: '100%' }}>
      {connectionDetails === undefined || preJoinChoices === undefined ? (
        <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
          <PreJoin
            defaults={preJoinDefaults}
            onSubmit={handlePreJoinSubmit}
            onError={handlePreJoinError}
          />
        </div>
      ) : isWaiting ? (
        <WaitingRoom 
          roomName={props.roomName} 
          participantName={preJoinChoices.username}
          onApproved={handleApproval}
          onCheckStatus={checkWaitingStatus}
          onGetToken={getParticipantToken}
        />
      ) : (
        <VideoConferenceComponent
          connectionDetails={connectionDetails}
          userChoices={preJoinChoices}
          options={{ codec: props.codec, hq: props.hq }}
        />
      )}
    </div>
  );
}

const CustomVideoConference = () => {
  const tracks = useTracks([
    Track.Source.Camera,
    Track.Source.ScreenShare,
    Track.Source.ScreenShareAudio
  ]);
  const remoteParticipants = useRemoteParticipants();
  const [isMobile, setIsMobile] = React.useState(false);

  // Add debug logging
  React.useEffect(() => {
    console.log('Participants updated in CustomVideoConference:', remoteParticipants);
  }, [remoteParticipants]);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <GridLayout
          tracks={tracks}
          style={{
            height: '100%',
          }}
        >
          <ParticipantTile />
        </GridLayout>
        <ParticipantsList />
        {process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true' && <Chat />}
      </div>
      <ControlBar 
        variation={isMobile ? "minimal" : "verbose"}
        controls={{ screenShare: process.env.NEXT_PUBLIC_SHARESCREEN_ENABLED === 'true' }}
        className="control-bar"
      />
    </div>
  );
};

function VideoConferenceComponent(props: {
  userChoices: LocalUserChoices;
  connectionDetails: ConnectionDetails;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}) {
  const e2eePassphrase =
    typeof window !== 'undefined' && decodePassphrase(location.hash.substring(1));

  const worker =
    typeof window !== 'undefined' &&
    e2eePassphrase &&
    new Worker(new URL('livekit-client/e2ee-worker', import.meta.url));
  const e2eeEnabled = !!(e2eePassphrase && worker);
  const keyProvider = new ExternalE2EEKeyProvider();
  const [e2eeSetupComplete, setE2eeSetupComplete] = React.useState(false);

  const roomOptions = React.useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec ? props.options.codec : 'vp9';
    if (e2eeEnabled && (videoCodec === 'av1' || videoCodec === 'vp9')) {
      videoCodec = undefined;
    }
    return {
      videoCaptureDefaults: {
        deviceId: props.userChoices.videoDeviceId ?? undefined,
        resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
      },
      publishDefaults: {
        dtx: false,
        videoSimulcastLayers: props.options.hq
          ? [VideoPresets.h1080, VideoPresets.h720]
          : [VideoPresets.h540, VideoPresets.h216],
        red: !e2eeEnabled,
        videoCodec,
      },
      audioCaptureDefaults: {
        deviceId: props.userChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: { pixelDensity: 'screen' },
      dynacast: true,
      e2ee: e2eeEnabled
        ? {
            keyProvider,
            worker,
          }
        : undefined,
    };
  }, [props.userChoices, props.options.hq, props.options.codec]);

  const room = React.useMemo(() => new Room(roomOptions), []);

  React.useEffect(() => {
    if (e2eeEnabled) {
      keyProvider
        .setKey(decodePassphrase(e2eePassphrase))
        .then(() => {
          room.setE2EEEnabled(true).catch((e) => {
            if (e instanceof DeviceUnsupportedError) {
              alert(
                `You're trying to join an encrypted meeting, but your browser does not support it. Please update it to the latest version and try again.`,
              );
              console.error(e);
            } else {
              throw e;
            }
          });
        })
        .then(() => setE2eeSetupComplete(true));
    } else {
      setE2eeSetupComplete(true);
    }
  }, [e2eeEnabled, room, e2eePassphrase]);

  const connectOptions = React.useMemo((): RoomConnectOptions => {
    return {
      autoSubscribe: true,
    };
  }, []);

  const router = useRouter();
  const handleOnLeave = React.useCallback(() => router.push('/'), [router]);
  const handleError = React.useCallback((error: Error) => {
    console.error(error);
    alert(`Encountered an unexpected error, check the console logs for details herw: ${error.message}`);
  }, []);
  const handleEncryptionError = React.useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected encryption error, check the console logs for details: ${error.message}`,
    );
  }, []);

  const handleDisconnected = React.useCallback(() => {
    // Try to reconnect once before redirecting
    if (props.connectionDetails?.participantToken && props.connectionDetails?.serverUrl) {
      router.push('/')
      room?.connect(
        props.connectionDetails.serverUrl,
        props.connectionDetails.participantToken.toString()
      ).catch((error) => {
        console.error('Reconnection failed:', error);
        router.push('/');
      });
    }
  }, [room, props.connectionDetails, router]);

  React.useEffect(() => {
    return () => {
      // Cleanup room connection on unmount
      if (room.state !== 'disconnected') {
        room.disconnect();
      }
    };
  }, [room]);

  return (
    <LiveKitRoom
      connect={e2eeSetupComplete}
      room={room}
      token={props.connectionDetails.participantToken}
      serverUrl={props.connectionDetails.serverUrl}
      connectOptions={connectOptions}
      video={props.userChoices.videoEnabled}
      audio={props.userChoices.audioEnabled}
      onDisconnected={handleDisconnected}
      onEncryptionError={handleEncryptionError}
      onError={(error) => {
        // Add retry logic for connection errors
        if (error.message.includes('signal connection')) {
          console.log('Retrying connection...');
          setTimeout(() => {
            room.connect(
              props.connectionDetails.serverUrl, 
              props.connectionDetails.participantToken,
              connectOptions
            ).catch(handleError);
          }, 1000);
        } else {
          handleError(error);
        }
      }}
    >
      <CustomVideoConference />
      <RoomAudioRenderer />
      <DebugMode />
      <RecordingIndicator />
    </LiveKitRoom>
  );
}
