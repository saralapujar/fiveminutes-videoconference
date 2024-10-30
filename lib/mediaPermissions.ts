async function requestMediaPermission(mediaType: 'camera' | 'microphone'): Promise<boolean> {
  try {
    const constraints = {
      video: mediaType === 'camera',
      audio: mediaType === 'microphone'
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Stop all tracks after getting permission
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error(`Error requesting ${mediaType} permission:`, error);
    return false;
  }
}

export { requestMediaPermission };
