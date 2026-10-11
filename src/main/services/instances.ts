import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import type { Instance, LaunchSettings } from '../../shared/types'
import { instanceRoot } from '../paths'
import { loadStore, updateStore } from '../store'

export function listInstances(): { instances: Instance[]; activeInstanceId: string } {
  const data = loadStore()
  return { instances: data.instances, activeInstanceId: data.activeInstanceId }
}

export function createInstance(name: string): Instance {
  const instance: Instance = {
    id: randomUUID(),
    name: name.trim() || 'Instance',
    minecraftVersion: '1.8.9',
    createdAt: new Date().toISOString(),
    settings: {}
  }
  updateStore((data) => {
    data.instances.push(instance)
    data.activeInstanceId = instance.id
  })
  fs.mkdirSync(instanceRoot(instance.id), { recursive: true })
  return instance
}

export function deleteInstance(id: string): void {
  updateStore((data) => {
    if (data.instances.length <= 1) throw new Error('Keep at least one instance.')
    data.instances = data.instances.filter((item) => item.id !== id)
    if (data.activeInstanceId === id) data.activeInstanceId = data.instances[0]?.id ?? ''
  })
  fs.rmSync(instanceRoot(id), { recursive: true, force: true })
}

export function selectInstance(id: string): void {
  updateStore((data) => {
    if (!data.instances.some((item) => item.id === id)) throw new Error('Instance not found.')
    data.activeInstanceId = id
  })
}

export function patchInstanceSettings(id: string, settings: Partial<LaunchSettings>): void {
  updateStore((data) => {
    const instance = data.instances.find((item) => item.id === id)
    if (!instance) throw new Error('Instance not found.')
    instance.settings = { ...instance.settings, ...settings }
  })
}
