import { DiscoveredKTP } from './discovery.ts'

export function sortByKTPNumber(a: string, b: string) {
  const aNum = +a.split('.')[0].replace(/\D/g, '')
  const bNum = +b.split('.')[0].replace(/\D/g, '')
  return aNum - bNum
}

export function sortDiscoveredKTPs(a: DiscoveredKTP, b: DiscoveredKTP) {
  return sortByKTPNumber(a.address, b.address)
}
