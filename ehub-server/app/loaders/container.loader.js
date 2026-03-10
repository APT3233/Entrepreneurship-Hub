/**
 * Đăng ký tất cả dependencies vào container
 * (sẽ implement chi tiết ở core/container/index.js)
 */
export const loadContainer = async ({ db, redis }) =>  {
  // lazy import tránh circular deps
  const { createContainer } = await import('app/core/container/index.js')
  const container = createContainer({ db, redis })

  return container
}