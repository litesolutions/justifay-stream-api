export default () => {
  return {
    filter: (contentType) => {
      return /text/i.test(contentType)
    },
    threshold: 2048,
    flush: import('zlib').Z_SYNC_FLUSH
  }
}
