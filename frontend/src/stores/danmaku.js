const listeners = []

export function useDanmaku() {
  function onDanmaku(callback) {
    listeners.push(callback)
    return () => {
      const index = listeners.indexOf(callback)
      if (index > -1) listeners.splice(index, 1)
    }
  }

  function emitDanmaku(text, color = '#FFFFFF') {
    listeners.forEach(cb => cb({ text, color, mode: 0 }))
  }

  return {
    onDanmaku,
    emitDanmaku
  }
}