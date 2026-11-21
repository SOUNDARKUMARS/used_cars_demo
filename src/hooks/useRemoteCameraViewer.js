import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getIceServers } from '../lib/webrtc'

export function useRemoteCameraViewer({
  sessionId,
  categoryLabel,
  currentCount,
  maxCount,
  activeCategory,
  onCapturePhoto,
}) {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')
  const [remoteStream, setRemoteStream] = useState(null)

  const peerConnectionRef = useRef(null)
  const channelRef = useRef(null)
  const iceCandidateQueue = useRef([])
  const videoRef = useRef(null)

  const currentCountRef = useRef(currentCount)
  const maxCountRef = useRef(maxCount)
  const categoryLabelRef = useRef(categoryLabel)
  const activeCategoryRef = useRef(activeCategory)
  const onCapturePhotoRef = useRef(onCapturePhoto)

  useEffect(() => {
    currentCountRef.current = currentCount
    maxCountRef.current = maxCount
    categoryLabelRef.current = categoryLabel
    activeCategoryRef.current = activeCategory
    onCapturePhotoRef.current = onCapturePhoto
  }, [currentCount, maxCount, categoryLabel, activeCategory, onCapturePhoto])

  const sendSignal = useCallback((type, data = {}) => {
    if (!channelRef.current) return
    channelRef.current.send({
      type: 'broadcast',
      event: 'signal',
      payload: { type, data },
    })
  }, [])

  const broadcastStatus = useCallback(() => {
    sendSignal('status', {
      categoryLabel: categoryLabelRef.current,
      count: currentCountRef.current,
      max: maxCountRef.current,
    })
  }, [sendSignal])

  const captureFrame = useCallback(() => {
    if (currentCountRef.current >= maxCountRef.current) {
      return false
    }

    const video = videoRef.current
    if (!video || !video.videoWidth || !video.videoHeight) {
      return false
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const filename = `${activeCategoryRef.current}-${Date.now()}.jpg`
        const file = new File([blob], filename, { type: 'image/jpeg' })
        if (onCapturePhotoRef.current) {
          onCapturePhotoRef.current(file)
        }
      },
      'image/jpeg',
      0.9
    )
    return true
  }, [])

  const handleOffer = useCallback(
    async (sdp) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      iceCandidateQueue.current = []

      const pc = new RTCPeerConnection({ iceServers: getIceServers() })
      peerConnectionRef.current = pc

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

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0])
          setConnectionStatus('live')
        }
      }

      await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      sendSignal('answer', { sdp: pc.localDescription })

      // Flush candidates that arrived before the remote description was applied
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift()
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch {
          // Ignore candidate failure during renegotiation
        }
      }

      broadcastStatus()
    },
    [sendSignal, broadcastStatus]
  )

  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = peerConnectionRef.current
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch {
        // Ignore invalid candidate
      }
    } else {
      iceCandidateQueue.current.push(candidate)
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return

    const channel = supabase.channel(`remote-cam:${sessionId}`, {
      config: {
        broadcast: {
          self: false,
        },
      },
    })

    channelRef.current = channel

    channel
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        if (!payload || !payload.type) return
        const { type, data } = payload

        if (type === 'join') {
          broadcastStatus()
        } else if (type === 'offer') {
          if (data?.sdp) {
            await handleOffer(data.sdp)
          }
        } else if (type === 'ice') {
          if (data?.candidate) {
            await handleIceCandidate(data.candidate)
          }
        } else if (type === 'shutter') {
          captureFrame()
        } else if (type === 'bye') {
          setConnectionStatus('disconnected')
          if (peerConnectionRef.current) {
            peerConnectionRef.current.close()
            peerConnectionRef.current = null
          }
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true)
        }
      })

    return () => {
      sendSignal('end', {})
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close()
        peerConnectionRef.current = null
      }
      supabase.removeChannel(channel)
      channelRef.current = null
      setIsSubscribed(false)
      setRemoteStream(null)
    }
  }, [sessionId, handleOffer, handleIceCandidate, sendSignal, broadcastStatus, captureFrame])

  // Sync count and category changes to the mobile sender
  useEffect(() => {
    if (isSubscribed && connectionStatus === 'live') {
      broadcastStatus()
    }
  }, [categoryLabel, currentCount, maxCount, isSubscribed, connectionStatus, broadcastStatus])

  return {
    isSubscribed,
    connectionStatus,
    remoteStream,
    videoRef,
    captureFrame,
    sendSignal,
    broadcastStatus,
  }
}
