import { processPixels, histogram } from './pixels.mjs'
self.onmessage = ({ data: job }) => {
  try {
    const a = processPixels(job.pixels, job.versions.A.settings)
    const b = processPixels(job.pixels, job.versions.B.settings)
    self.postMessage({ id: job.id, a, b, histA: histogram(a), histB: histogram(b) }, [a.buffer, b.buffer])
  } catch (error) { self.postMessage({ id: job.id, error: error.message }) }
}
