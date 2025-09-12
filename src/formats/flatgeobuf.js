import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js'
import proj4 from 'proj4'

async function getFgbExtent(url) {
  const response = await fetch(url)
  const buffer = await response.arrayBuffer()

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  // Process each coordinate recursively
  function processCoordinate(coord) {
    let [lon, lat] = coord
    let [x, y] = proj4('EPSG:4326', 'EPSG:3857', [lon, lat])
    if (x < minX) minX = x
    if (x > maxX) maxX = x
    if (y < minY) minY = y
    if (y > maxY) maxY = y
  }

  // Function to traverse coordinates in any geometry type
  function traverseCoordinates(coords) {
    if (Array.isArray(coords[0])) {
      coords.forEach(traverseCoordinates)
    } else {
      processCoordinate(coords)
    }
  }

  // FlatGeoBuf v4.x returns an AsyncGenerator - iterate through it
  const asyncIterable = deserialize(new Uint8Array(buffer))

  let featureCount = 0

  try {
    for await (const feature of asyncIterable) {
      featureCount++

      const geometry = feature.geometry
      if (!geometry || !geometry.coordinates) continue

      traverseCoordinates(geometry.coordinates)
    }

  } catch (error) {
    console.error('Error iterating through features:', error)
    return undefined
  }

  if (featureCount === 0) {
    console.warn('No features found')
    return undefined
  }

  if (minX === Infinity) {
    console.warn('No valid coordinates found')
    return undefined
  }

  const extent = [minX, minY, maxX, maxY]
  return extent
}

export { getFgbExtent }