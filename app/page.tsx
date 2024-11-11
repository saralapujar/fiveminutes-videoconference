'use client';
import createGlobe from "cobe";

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState, useEffect, useRef } from 'react';
import { encodePassphrase, generateRoomId, randomString } from '@/lib/client-utils';
import styles from '../styles/Home.module.css';
import { Navbar } from './components/Navbar';
import { BackgroundBeams } from './components/ui/background-beams';

function Tabs(props: React.PropsWithChildren<{}>) {
  const searchParams = useSearchParams();
  const [tabIndex, setTabIndex] = useState(searchParams?.get('tab') === 'custom' ? 1 : 0);
  const router = useRouter();

  useEffect(() => {
    setTabIndex(searchParams?.get('tab') === 'custom' ? 1 : 0);
  }, [searchParams]);

  function onTabSelected(index: number) {
    const tab = index === 1 ? 'custom' : 'demo';
    router.push(`/?tab=${tab}`);
  }

  const tabs = React.Children.map(props.children, (child, index) => {
    if (!React.isValidElement(child)) return null;
    
    return (
      <button
        className="lk-button"
        onClick={() => onTabSelected(index)}
        aria-pressed={tabIndex === index}
      >
        {child.props.label}
      </button>
    );
  });

  return (
    <div className={styles.tabContainer}>
      <div className={styles.tabSelect}>{tabs}</div>
      {React.Children.toArray(props.children)[tabIndex]}
    </div>
  );
}

function DemoMeetingTab(props: { label: string }) {
  const router = useRouter();
  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));
  const startMeeting = () => {
    if (e2ee) {
      router.push(`/rooms/${generateRoomId()}#${encodePassphrase(sharedPassphrase)}`);
    } else {
      router.push(`/rooms/${generateRoomId()}`);
    }
  };
  return (
    
    <div className={styles.tabContent}>
      {/* <p style={{ margin: 0 }}>Try LiveKit Meet for free with our live demo project.</p> */}
      <button style={{ marginTop: '1rem' }} className="lk-button" onClick={startMeeting}>
        Start Meeting
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function CustomConnectionTab(props: { label: string }) {
  const router = useRouter();

  const [e2ee, setE2ee] = useState(false);
  const [sharedPassphrase, setSharedPassphrase] = useState(randomString(64));

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    const serverUrl = formData.get('serverUrl');
    const token = formData.get('token');
    if (e2ee) {
      router.push(
        `/custom/?liveKitUrl=${serverUrl}&token=${token}#${encodePassphrase(sharedPassphrase)}`,
      );
    } else {
      router.push(`/custom/?liveKitUrl=${serverUrl}&token=${token}`);
    }
  };
  return (
    
    <form className={styles.tabContent} onSubmit={onSubmit}>
      {/* <p style={{ marginTop: 0 }}>
      Connect LiveKit Meet with a custom server using LiveKit Cloud or LiveKit Server.
    </p> */}
      <input
        id="serverUrl"
        name="serverUrl"
        type="url"
        placeholder="LiveKit Server URL: wss://*.livekit.cloud"
        required />
      <textarea
        id="token"
        name="token"
        placeholder="Token"
        required
        rows={5}
        style={{ padding: '1px 2px', fontSize: 'inherit', lineHeight: 'inherit' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
          <input
            id="use-e2ee"
            type="checkbox"
            checked={e2ee}
            onChange={(ev) => setE2ee(ev.target.checked)}
          ></input>
          <label htmlFor="use-e2ee">Enable end-to-end encryption</label>
        </div>
        {e2ee && (
          <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem' }}>
            <label htmlFor="passphrase">Passphrase</label>
            <input
              id="passphrase"
              type="password"
              value={sharedPassphrase}
              onChange={(ev) => setSharedPassphrase(ev.target.value)} />
          </div>
        )}
      </div>

      <hr
        style={{ width: '100%', borderColor: 'rgba(255, 255, 255, 0.15)', marginBlock: '1rem' }} />
      <button
        style={{ paddingInline: '1.25rem', width: '100%' }}
        className="lk-button"
        type="submit"
      >
        Connect
      </button>
    </form>
  );
}

export const Globe = ({ className }: { className?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
 
  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;
 
    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: window.devicePixelRatio || 2,
      width: 600 ,
      height: 600 ,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [0.1, 0.8, 1],
      glowColor: [1, 1, 1],
      markers: [
        { location: [37.7595, -122.4367], size: 0.03 },
        { location: [40.7128, -74.006], size: 0.1 },
      ],
      onRender: (state) => {
        state.phi = phi;
        phi += 0.01;
      },
    });
 
    return () => globe.destroy();
  }, []);
 
  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '600px',
        height: '600px',
        maxWidth: '100%',
        aspectRatio: '1',
      }}
      aria-hidden="true"
      className={className}
    />
  );
};

export default function Page() {
  return (
    <>
      <Navbar />
      <main 
        className={styles.main} 
        data-lk-theme="default"
      >
        <div style={{ position: 'absolute', width: '100%', height: '100%', top: 0, left: 0, zIndex: 0 }}>
          <BackgroundBeams />
        </div>
        
        <div className={`${styles.contentWrapper} relative z-10 flex flex-col items-center w-full max-w-2xl mx-auto px-4`}>
          <div className="w-full max-w-[360px]">
            <Globe className="transform scale-75 sm:scale-100" />
          </div>
          
          <div className="w-full">
            <Suspense fallback="Loading">
              <Tabs>
                <DemoMeetingTab label="Demo" />
                <CustomConnectionTab label="Custom" />
              </Tabs>
            </Suspense>
          </div>
        </div>
      </main>
      <footer 
        className="text-center py-4" 
        data-lk-theme="default"
      >
        Developed by Five Minutes
      </footer>
    </>
  );
}
