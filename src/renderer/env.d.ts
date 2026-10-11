/// <reference types="vite/client" />
import type { LunarApi } from '../preload/index'

declare global {
  interface Window {
    lunar: LunarApi
  }
}

export {}
