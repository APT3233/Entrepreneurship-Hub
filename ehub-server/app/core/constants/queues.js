/**
 * Queue names — dùng cho Redis Queue / BullMQ workers
 */
export const Queues = Object.freeze({
  EMAIL:          'queue:email',
  PDF_EXPORT:     'queue:pdf-export',
  DATA_IMPORT:    'queue:data-import',
  NOTIFICATION:   'queue:notification',
  ANALYTICS:      'queue:analytics',
  AUDIT:          'queue:audit',
})