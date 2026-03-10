const required = (key) => {
  if (!process.env[key]) throw new Error(`❌ Missing env: ${key}`)
  return process.env[key]
}

const optional = (key, fallback) => process.env[key] ?? fallback

const toInt = (val, fallback) => {
  const parsed = parseInt(val, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

const toBool = (val, fallback = false) =>
  val === undefined ? fallback : val === 'true'

const toList = (val, fallback = []) =>
  val?.split(',').map((s) => s.trim()).filter(Boolean) ?? fallback

export { required, optional, toInt, toBool, toList }