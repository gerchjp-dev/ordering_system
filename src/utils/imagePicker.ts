// Expo ImagePicker の代替実装
export interface ImagePickerResult {
  canceled: boolean
  assets?: Array<{
    uri: string
    width?: number
    height?: number
    base64?: string
  }>
}

export const ImagePicker = {
  MediaTypeOptions: {
    Images: 'images' as const
  },

  async requestMediaLibraryPermissionsAsync() {
    // Web では権限は不要
    return { status: 'granted' as const }
  },

  async requestCameraPermissionsAsync() {
    // Web では権限は不要
    return { status: 'granted' as const }
  },

  async launchImageLibraryAsync(options?: {
    mediaTypes?: string
    allowsEditing?: boolean
    aspect?: [number, number]
    quality?: number
    base64?: boolean
  }): Promise<ImagePickerResult> {
    return new Promise((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        if (file) {
          const reader = new FileReader()
          reader.onload = (e) => {
            const uri = e.target?.result as string
            resolve({
              canceled: false,
              assets: [{
                uri,
                ...(options?.base64 && { base64: uri.split(',')[1] })
              }]
            })
          }
          reader.readAsDataURL(file)
        } else {
          resolve({ canceled: true })
        }
      }
      
      input.click()
    })
  },

  async launchCameraAsync(options?: {
    allowsEditing?: boolean
    aspect?: [number, number]
    quality?: number
    base64?: boolean
  }): Promise<ImagePickerResult> {
    // Web カメラアクセス
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      
      return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        
        video.srcObject = stream
        video.play()
        
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          // 3秒後に自動撮影（実際のアプリでは撮影ボタンを実装）
          setTimeout(() => {
            if (context) {
              context.drawImage(video, 0, 0)
              const uri = canvas.toDataURL('image/jpeg', options?.quality || 0.8)
              
              stream.getTracks().forEach(track => track.stop())
              
              resolve({
                canceled: false,
                assets: [{
                  uri,
                  width: canvas.width,
                  height: canvas.height,
                  ...(options?.base64 && { base64: uri.split(',')[1] })
                }]
              })
            }
          }, 3000)
        }
      })
    } catch (error) {
      console.error('Camera access error:', error)
      return { canceled: true }
    }
  }
}