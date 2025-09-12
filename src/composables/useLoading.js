import { ref } from 'vue'

const isMapLoading = ref(false)
const loadingHint = ref('')

const loadingHints = [
  'Calculating orbital trajectories ...',
  'Optimizing Delta-V requirements ...',
  'Making sure nosecone is pointing upwards ...',
  'Combobulating discombobulators ...',
  'Treating Kessler syndrome ...',
]

const getRandomHint = () => {
  return loadingHints[Math.floor(Math.random() * loadingHints.length)]
}

export function useLoading() {
  const startMapLoading = () => {
    isMapLoading.value = true
    loadingHint.value = getRandomHint()
  }

  const stopMapLoading = () => {
    isMapLoading.value = false
    loadingHint.value = ''
  }

  return {
    isMapLoading,
    loadingHint,
    startMapLoading,
    stopMapLoading,
  }
}
