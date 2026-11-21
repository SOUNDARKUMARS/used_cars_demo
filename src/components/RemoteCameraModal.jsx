import { useState, useEffect, useMemo } from 'react'
import {
  Camera,
  X,
  QrCode,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { generateSessionId, getRemoteCameraUrl } from '../lib/webrtc'
import { useRemoteCameraViewer } from '../hooks/useRemoteCameraViewer'

export default function RemoteCameraModal({
  isOpen,
  onClose,
  activeCategory = 'exterior',
  onSelectCategory,
  categories = [],
  photos = [],
  onCapturePhoto,
}) {
  const [sessionId] = useState(() => generateSessionId())
  const qrUrl = useMemo(() => getRemoteCameraUrl(sessionId), [sessionId])

  const currentCategoryDef = useMemo(() => {
    return (
      categories.find((c) => c.id === activeCategory) || {
        id: activeCategory,
        title: 'Exterior Views',
        shortTitle: 'Exterior',
        max: 5,
      }
    )
  }, [categories, activeCategory])

  const currentCategoryPhotos = useMemo(() => {
    return photos.filter((p) => p.category === activeCategory)
  }, [photos, activeCategory])

  const currentCount = currentCategoryPhotos.length
  const maxCount = currentCategoryDef.max || 5
  const isCategoryFull = currentCount >= maxCount

  const {
    isSubscribed,
    connectionStatus,
    remoteStream,
    videoRef,
    captureFrame,
  } = useRemoteCameraViewer({
    sessionId,
    categoryLabel: currentCategoryDef.shortTitle,
    currentCount,
    maxCount,
    activeCategory,
    onCapturePhoto,
  })

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream
    }
  }, [remoteStream, videoRef])

  if (!isOpen) return null

  const isLiveOrPreview = Boolean(remoteStream)
  const isDisconnected = connectionStatus === 'disconnected'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Camera className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900 leading-none">
                  Remote Camera
                </h3>
                {/* Connection Status Pill */}
                {isLiveOrPreview && (
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full border ${
                      isDisconnected
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : connectionStatus === 'live'
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isDisconnected
                          ? 'bg-red-600'
                          : connectionStatus === 'live'
                          ? 'bg-blue-600 animate-pulse'
                          : 'bg-slate-400'
                      }`}
                    />
                    {isDisconnected
                      ? 'Phone disconnected'
                      : connectionStatus === 'live'
                      ? 'Live'
                      : 'Connecting'}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target: {currentCategoryDef.shortTitle} ({currentCount}/{maxCount})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Switcher Tabs */}
        {categories.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/75 overflow-x-auto">
            {categories.map((cat) => {
              const catPhotos = photos.filter((p) => p.category === cat.id)
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory?.(cat.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{cat.shortTitle}</span>
                  <span
                    className={`text-[10px] px-1 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {catPhotos.length}/{cat.max || 5}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Modal Body */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center min-h-[380px] overflow-hidden">
          {!isLiveOrPreview ? (
            /* QR View (initial state) */
            <div className="flex flex-col items-center justify-center p-6 text-center text-slate-900 bg-white w-full h-full">
              {!isSubscribed ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm font-medium text-slate-700">
                    Initializing remote camera session...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Connecting to signaling service
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center max-w-sm">
                  <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs mb-4">
                    <QRCodeSVG
                      value={qrUrl}
                      size={200}
                      level="M"
                      includeMargin={false}
                    />
                  </div>

                  <h4 className="text-base font-semibold text-slate-900">
                    Scan with your phone camera
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Open your mobile phone camera or QR scanner. The live stream will
                    appear here automatically once connected.
                  </p>

                  <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                    <QrCode className="w-3.5 h-3.5 text-slate-500" />
                    <span>Capturing for {currentCategoryDef.shortTitle}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Live Preview View */
            <div className="relative w-full h-full flex items-center justify-center bg-black min-h-[380px] max-h-[62vh]">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain max-h-[60vh]"
              />

              {/* Viewfinder Framing Guide */}
              <div className="absolute inset-6 border border-white/30 border-dashed rounded-lg pointer-events-none flex items-start justify-start p-2">
                <span className="text-[10px] text-white/50 tracking-wider font-mono uppercase">
                  Vehicle Viewfinder
                </span>
              </div>

              {/* Rejoin / Disconnected Overlay */}
              {isDisconnected && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center text-white">
                  <div className="p-3 bg-white rounded-xl shadow-lg mb-3">
                    <QRCodeSVG
                      value={qrUrl}
                      size={160}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 mb-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Phone disconnected</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-xs">
                    Scan the QR code to resume the session using the same URL, or refresh
                    the phone page.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
          <div className="text-xs text-slate-600">
            {isCategoryFull ? (
              <span className="text-slate-500 font-medium">
                Category full ({currentCount}/{maxCount})
              </span>
            ) : (
              <span>
                {currentCategoryDef.shortTitle}: <strong className="text-slate-900">{currentCount}/{maxCount}</strong> photos
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Done
            </button>

            {isLiveOrPreview && (
              <button
                type="button"
                onClick={captureFrame}
                disabled={isCategoryFull || isDisconnected}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg shadow-xs transition-colors ${
                  isCategoryFull || isDisconnected
                    ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {isCategoryFull
                    ? `Category full (${currentCount}/${maxCount})`
                    : 'Capture'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
