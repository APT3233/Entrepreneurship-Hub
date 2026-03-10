
const AppError = (message, statusCode, errorCode, details = null) => {
  const error = new Error(message)
  error.name = 'AppError'
  error.statusCode = statusCode
  error.errorCode = errorCode
  error.details = details
  error.isOperational = true
  error.timestamp = new Date().toISOString()
  return error
}

export default AppError