import { useEffect } from 'react'
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  VideoOff,
} from 'lucide-react'
import { useRemoteCameraSender } from '../hooks/useRemoteCameraSender'

export default function RemoteCameraPhoneScreen({ sessionId }) {
  const {
    localStream,
    connectionStatus,
    flashActive,
    isSessionEnded,
    cameraError,
    desktopStatus,
    videoRef,
    switchCamera,
    triggerShutter,
  } = useRemoteCameraSender({ sessionId })

  useEffect(() => {
    if (videoRef.current && localStream) {
      videoRef.current.srcObject = localStream
    }
  }, [localStream, videoRef])

  // Session Ended Screen
  if (isSessionEnded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900 text-white text-center select-none">
        <div className="max-w-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4 border border-blue-200">
            <CheckCircle2 className="w-7 h-7 text-blue-600" />
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Session ended</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            The remote photography session was closed by the desktop dealer. You may now close this tab.
          </p>
        </div>
      </div>
    )
  }

  // Camera Errors Screens
  if (cameraError) {
    const isPermission = cameraError === 'permission-denied'
    const isInsecure = cameraError === 'insecure-context'
    const isNoCamera = cameraError === 'no-camera'

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900 text-white text-center select-none">
        <div className="max-w-xs flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-200">
            {isInsecure ? (
              <ShieldAlert className="w-7 h-7 text-red-600" />
            ) : isNoCamera ? (
              <VideoOff className="w-7 h-7 text-red-600" />
            ) : (
              <AlertCircle className="w-7 h-7 text-red-600" />
            )}
          </div>

          <h2 className="text-base font-bold text-white mb-1">
            {isInsecure
              ? 'HTTPS connection required'
              : isPermission
              ? 'Camera permission denied'
              : isNoCamera
              ? 'No camera found'
              : 'Camera error'}
          </h2>

          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            {isInsecure
              ? 'Mobile camera access requires a secure HTTPS connection. Please access this application via HTTPS or through an HTTPS tunnel (e.g. ngrok or cloudflared).'
              : isPermission
              ? 'Camera permission was denied. Please allow camera permissions in your mobile browser settings and reload this page.'
              : isNoCamera
              ? 'No camera device could be found on this phone.'
              : cameraError}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }

  const isCategoryFull =
    desktopStatus.max > 0 && desktopStatus.count >= desktopStatus.max

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between overflow-hidden select-none">
      {/* Viewfinder Video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Viewfinder Framing Guide */}
      <div className="absolute inset-8 sm:inset-12 border border-white/30 border-dashed rounded-xl pointer-events-none flex items-start justify-start p-2">
        <span className="text-[10px] text-white/50 tracking-wider font-mono uppercase">
          Vehicle Guide
        </span>
      </div>

      {/* Shutter Flash Animation */}
      {flashActive && (
        <div className="absolute inset-0 bg-white pointer-events-none transition-opacity duration-150" />
      )}

      {/* Top Bar: Connection & Category Status */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'live'
                ? 'bg-blue-600 animate-pulse'
                : 'bg-slate-400'
            }`}
          />
          <span>
            {connectionStatus === 'live' ? 'Live' : 'Connecting'}
          </span>
        </div>

        {/* Desktop Category & Count Pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
          <span>{desktopStatus.categoryLabel}</span>
          <span className="text-white/60">•</span>
          <span className={isCategoryFull ? 'text-red-400 font-semibold' : 'text-white'}>
            {desktopStatus.count}/{desktopStatus.max}
          </span>
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="relative z-20 flex items-center justify-between px-8 pb-8 pt-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {/* Flip Camera Button */}
        <button
          type="button"
          onClick={switchCamera}
          className="w-12 h-12 rounded-full bg-white/20 border border-white/30 backdrop-blur-md text-white flex items-center justify-center active:scale-95 transition-transform"
          title="Flip camera"
          aria-label="Flip camera"
        >
          <RotateCcw className="w-5 h-5 text-white" />
        </button>

        {/* Large Shutter Button */}
        <button
          type="button"
          onClick={triggerShutter}
          disabled={isCategoryFull || connectionStatus !== 'live'}
          className={`w-18 h-18 rounded-full border-4 border-white shadow-xl flex items-center justify-center active:scale-90 transition-transform ${
            isCategoryFull || connectionStatus !== 'live'
              ? 'bg-slate-500 opacity-60 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title={isCategoryFull ? 'Category full' : 'Capture photo'}
          aria-label="Capture photo"
        >
          <Camera className="w-7 h-7 text-white" />
        </button>

        {/* Empty placeholder to center the shutter button */}
        <div className="w-12 h-12" />
      </div>
    </div>
  )
}
