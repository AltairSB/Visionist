const MAX_EDGE_PX = 1024
const JPEG_QUALITY = 0.85

export type CompressedImage = {
  base64: string
  mimeType: 'image/jpeg'
  previewUrl: string
}

const loadImage = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Görsel yüklenemedi.'))
    }

    image.src = url
  })

export const compressImageFile = async (file: File): Promise<CompressedImage> => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Desteklenen formatlar: JPEG, PNG, WebP.')
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Görsel en fazla 8 MB olabilir.')
  }

  const image = await loadImage(file)
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(image.width, image.height))
  const width = Math.round(image.width * scale)
  const height = Math.round(image.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Görsel işlenemedi.')
  }

  context.drawImage(image, 0, 0, width, height)

  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  const base64 = dataUrl.split(',')[1] ?? ''

  if (!base64) {
    throw new Error('Görsel sıkıştırılamadı.')
  }

  return {
    base64,
    mimeType: 'image/jpeg',
    previewUrl: dataUrl,
  }
}
