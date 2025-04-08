import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
    executeCode: (code: string) => Promise<{ success: boolean; result?: any; error?: string }>;
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: API
  }
}
