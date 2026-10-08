/**
 * Reads a chosen photo, shrinks it for storage, and checks it is usable as sculpting
 * reference: big enough, not too dark or bright, and not blurred. All on-device.
 */
export async function readPhoto(file: File): Promise<{ src: string; issues: string[] }> {
  if (!file.type.startsWith('image/')) return { src: '', issues: ['This isn’t a photo. Try a JPEG, PNG or HEIC image.'] }

  const bmp = await createImageBitmap(file).catch(() => null)
  if (!bmp) return { src: '', issues: ['We couldn’t open this photo. Try saving it as a JPEG first.'] }

  const issues: string[] = []
  if (Math.min(bmp.width, bmp.height) < 700) issues.push('Small photo. Use your main camera, not a screenshot.')

  // Analyse a small greyscale copy.
  const A = 160
  const scale = A / Math.max(bmp.width, bmp.height)
  const w = Math.max(1, Math.round(bmp.width * scale))
  const h = Math.max(1, Math.round(bmp.height * scale))
  const a = document.createElement('canvas')
  a.width = w
  a.height = h
  const actx = a.getContext('2d', { willReadFrequently: true })!
  actx.drawImage(bmp, 0, 0, w, h)
  const px = actx.getImageData(0, 0, w, h).data
  const g = new Float32Array(w * h)
  let sum = 0
  for (let i = 0; i < w * h; i++) {
    const v = 0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]
    g[i] = v
    sum += v
  }
  const mean = sum / (w * h)
  if (mean < 55) issues.push('A little dark. Try near a window in daylight.')
  else if (mean > 220) issues.push('Very bright. Move out of direct sun.')

  // Variance of the Laplacian: low means little fine detail, i.e. blur.
  let lsum = 0
  let lsq = 0
  let n = 0
  for (let y = 1; y < h - 1; y++)
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const l = 4 * g[i] - g[i - 1] - g[i + 1] - g[i - w] - g[i + w]
      lsum += l
      lsq += l * l
      n++
    }
  const variance = n ? lsq / n - (lsum / n) ** 2 : 0
  if (variance < 40) issues.push('Looks blurred. Hold still, or tap to focus on their face.')

  // Stored copy: max 900px JPEG keeps a full set of photos inside browser storage.
  const S = Math.min(1, 900 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * S)
  c.height = Math.round(bmp.height * S)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return { src: c.toDataURL('image/jpeg', 0.78), issues }
}
