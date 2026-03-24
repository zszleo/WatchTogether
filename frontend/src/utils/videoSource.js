export function detectVideoSource(url) {
  if (!url) {
    return {
      type: 'none',
      name: null,
      embedUrl: null,
      supportsDanmaku: false
    }
  }

  const biliMatch = url.match(/bilibili\.com\/video\/(BV[\w]+)/i)
  if (biliMatch) {
    return {
      type: 'bilibili',
      name: `Bilibili: ${biliMatch[1]}`,
      embedUrl: `//player.bilibili.com/player.html?bvid=${biliMatch[1]}&high_quality=1&danmaku=0`,
      supportsDanmaku: false
    }
  }

  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/i)
  if (ytMatch) {
    return {
      type: 'youtube',
      name: `YouTube: ${ytMatch[1]}`,
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      supportsDanmaku: false
    }
  }

  const fileName = url.split('/').pop()?.split('?')[0] || '视频'
  return {
    type: 'native',
    name: fileName.replace(/\.[^.]+$/, ''),
    embedUrl: url,
    supportsDanmaku: true
  }
}

export function isEmbedVideo(url) {
  const source = detectVideoSource(url)
  return ['bilibili', 'youtube'].includes(source.type)
}