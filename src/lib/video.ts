/**
 * Pulls evenly spaced still frames from a short video, on the device. One slow walk
 * around a resting dog gives every angle the sculptor needs, from one gentle action.
 */
export async function framesFrom(file: File, count = 5): Promise<File[]> {
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url
  try {
    await once(video, 'loadedmetadata')
    const d = video.duration
    if (!Number.isFinite(d) || d <= 0) throw new Error('unreadable')
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 1600 / Math.max(video.videoWidth, video.videoHeight))
    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)
    const ctx = canvas.getContext('2d')!
    const out: File[] = []
    for (let i = 0; i < count; i++) {
      // Skip the very start and end, where the camera is usually still finding its feet.
      video.currentTime = d * (0.1 + (0.8 * i) / Math.max(1, count - 1))
      await once(video, 'seeked')
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.9))
      if (blob) out.push(new File([blob], `frame-${i}.jpg`, { type: 'image/jpeg' }))
    }
    return out
  } finally {
    URL.revokeObjectURL(url)
    video.removeAttribute('src')
    video.load()
  }
}

function once(el: HTMLMediaElement, ev: string) {
  return new Promise<void>((resolve, reject) => {
    const t = window.setTimeout(() => reject(new Error('timeout')), 8000)
    el.addEventListener(ev, () => { window.clearTimeout(t); resolve() }, { once: true })
    el.addEventListener('error', () => { window.clearTimeout(t); reject(new Error('unreadable')) }, { once: true })
  })
}
