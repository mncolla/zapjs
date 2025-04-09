import { ElectronAPI } from '@electron-toolkit/preload'

interface API {
    executeCode: (code: string) => Promise<{
        success: boolean;
        error?: string;
        logs?: string[];
    }>;
}

declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface Platform {}
  }
  interface Window {
    electron: ElectronAPI
    api: API
  }
}

export {};
