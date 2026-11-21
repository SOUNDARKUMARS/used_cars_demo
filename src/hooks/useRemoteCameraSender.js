import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getIceServers } from '../lib/webrtc'

export function useRemoteCameraSender({ sessionId }) {
  const [localStream, setLocalStream] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [facingMode, setFacingMode] = useState('environment')
  const [flashActive, setFlashActive] = useState(false)
  const [isSessionEnded, setIsSessionEnded] = useState(false)
  const [cameraError, setCameraError] = useState(() => {
    if (typeof window === 'undefined') return null
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'

    if (!window.isSecureContext && !isLocalhost) {
      return 'insecure-context'
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return 'no-camera'
    }
    return null
  })
  const [desktopStatus, setDesktopStatus] = useState({
    categoryLabel: 'Exterior',
    count: 0,
    max: 5,
  })

  const peerConnectionRef = useRef(null)
  const channelRef = useRef(null)
  const iceCandidateQueue = useRef([])
  const localStreamRef = useRef(null)
  const wakeLockRef = useRef(null)
  const videoRef = useRef(null)

  const sendSignal = useCallback((type, data = {}) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type, data },
    })
  }, [])

  const triggerShutter = useCallback(() => {
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 150)
    sendSignal('shutter', {})
  }, [sendSignal])

  const switchCamera = useCallback(async () => {
    const pc = peerConnectionRef.current
    if (!pc) return

    const nextMode = facingMode === 'environment' ? 'user' : 'environment'
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: nextMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      const sender = pc
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video')

      if (sender && newVideoTrack) {
        // Replace video track on the active RTP sender without renegotiating SDP
        await sender.replaceTrack(newVideoTrack)
      }

      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach((track) => track.stop())
      }

      localStreamRef.current = newStream
      setFacingMode(nextMode)
      setLocalStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream
      }
    } catch (err) {
      console.error('Camera switch failed:', err)
    }
  }, [facingMode])

  // Screen Wake Lock
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator) {
        try {
          wakeLockRef.current = await navigator.wakeLock.request('screen')
        } catch {
          // Wake lock request failed or rejected by browser policy
        }
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }
  }, [])

  // Initialize Camera & WebRTC
  useEffect(() => {
    if (!sessionId || cameraError) return

    let isCancelled = false

    const channel = supabase.channel(`remote-cam:${sessionId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    })

    channelRef.current = channel

    const startStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        })

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        localStreamRef.current = stream
        setLocalStream(stream)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        const pc = new RTCPeerConnection({ iceServers: getIceServers() })
        peerConnectionRef.current = pc

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream)
        })

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal('ice', { candidate: event.candidate })
          }
        }

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            setConnectionStatus('live')
          } else if (
            pc.connectionState === 'disconnected' ||
            pc.connectionState === 'failed'
          ) {
            setConnectionStatus('disconnected')
          } else if (pc.connectionState === 'connecting') {
            setConnectionStatus('connecting')
          }
        }

        channel
          .on('broadcast', { event: 'signal' }, async ({ payload }) => {
            if (!payload || !payload.type) return
            const { type, data } = payload

            if (type === 'answer') {
              if (data?.sdp) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.sdp))
                // Flush queued candidates after remote description is applied
                while (iceCandidateQueue.current.length > 0) {
                  const candidate = iceCandidateQueue.current.shift()
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate))
                  } catch {
                    // Ignore candidate error
                  }
                }
              }
            } else if (type === 'ice') {
              if (data?.candidate) {
                if (pc.remoteDescription && pc.remoteDescription.type) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate))
                  } catch {
                    // Ignore candidate error
                  }
                } else {
                  iceCandidateQueue.current.push(data.candidate)
                }
              }
            } else if (type === 'status') {
              if (data) {
                setDesktopStatus({
                  categoryLabel: data.categoryLabel || 'Exterior',
                  count: typeof data.count === 'number' ? data.count : 0,
                  max: typeof data.max === 'number' ? data.max : 5,
                })
              }
            } else if (type === 'end') {
              setIsSessionEnded(true)
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach((t) => t.stop())
                localStreamRef.current = null
              }
              if (peerConnectionRef.current) {
                peerConnectionRef.current.close()
                peerConnectionRef.current = null
              }
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal('join', {})
              sendSignal('offer', { sdp: pc.localDescription })
            }
          })
      } catch (err) {
        if (isCancelled) return
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'PermissionDeniedError'
        ) {
          setCameraError('permission-denied')
        } else if (
          err.name === 'NotFoundError' ||
          err.name === 'DevicesNotFoundError'
        ) {
          setCameraError('no-camera')
        } else {
          setCameraError(err.message || 'Unable to access camera')
        }
      }
    }

    startStream()

    return () => {
      isCancelled = true
      sendSignal('bye', {})
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [sessionId, cameraError, sendSignal])

  return {
    localStream,
    connectionStatus,
    facingMode,
    flashActive,
    isSessionEnded,
    cameraError,
    desktopStatus,
    videoRef,
    switchCamera,
    triggerShutter,
  }
}
