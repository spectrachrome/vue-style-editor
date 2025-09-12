import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js'
import proj4 from 'proj4'

async function getFgbExtent(url) {
  console.log('Calculating FGB extent for:', url)
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch FGB data: ${response.status} ${response.statusText}`)
  }
  
  const buffer = await response.arrayBuffer()
  if (buffer.byteLength === 0) {
    console.warn('FGB file is empty:', url)
    return undefined
  }
  
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

  // FlatGeoBuf deserialize returns an iterable/generator
  // Convert to array to ensure proper iteration
  try {
    const featuresIterator = deserialize(new Uint8Array(buffer))
    
    if (!featuresIterator) {
      console.warn('FGB deserialization returned null/undefined')
      return undefined
    }
    
    // Convert iterator to array to avoid iteration issues
    console.log('Converting FGB iterator to array...')
    const features = Array.from(featuresIterator)
    console.log(`FGB deserialization result: ${features.length} features`)
    
    if (features.length === 0) {
      console.warn('No features found in FGB data - file might be empty or corrupted')
      // Still return undefined but don't treat this as a fatal error
      return undefined
    }
    
    // Process the features
    for (const feature of features) {
      const geometry = feature.geometry
      if (!geometry || !geometry.coordinates) continue
      traverseCoordinates(geometry.coordinates)
    }
    
    console.log('Processed', features.length, 'FGB features for extent calculation')
    
  } catch (error) {
    console.error('Error processing FGB data:', error)
    return undefined
  }

  if (minX === Infinity) {
    console.warn('No valid coordinates found in FGB data')
    return undefined
  }
  
  const extent = [minX, minY, maxX, maxY]
  console.log('Calculated FGB extent:', extent)
  return extent
}

export { getFgbExtent }
