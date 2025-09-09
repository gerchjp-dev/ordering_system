// AsyncStorage の代替実装
class WebStorage {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.error('Storage getItem error:', error)
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value)
    } catch (error) {
      console.error('Storage setItem error:', error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error('Storage removeItem error:', error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Storage clear error:', error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return Object.keys(localStorage)
    } catch (error) {
      console.error('Storage getAllKeys error:', error)
      return []
    }
  }
}

export const AsyncStorage = new WebStorage()