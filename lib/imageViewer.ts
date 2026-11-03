export type ImageSize = {width: number; height: number};
export type ImagePan = {x: number; y: number};

export function imageViewGeometry(source: ImageSize, viewport: ImageSize, original: boolean) {
  if (source.width <= 0 || source.height <= 0 || viewport.width <= 0 || viewport.height <= 0) {
    return {width: 0, height: 0, fitScale: 1, canZoom: false, limit: {x: 0, y: 0}};
  }
  const fitScale = Math.min(1, viewport.width / source.width, viewport.height / source.height);
  const scale = original ? 1 : fitScale;
  const width = source.width * scale;
  const height = source.height * scale;
  return {width, height, fitScale, canZoom: fitScale < 1,
    limit: {x: Math.max(0, (width - viewport.width) / 2), y: Math.max(0, (height - viewport.height) / 2)}};
}

export function clampImagePan(pan: ImagePan, limit: ImagePan): ImagePan {
  return {x: Math.max(-limit.x, Math.min(limit.x, pan.x)), y: Math.max(-limit.y, Math.min(limit.y, pan.y))};
}

export function imageZoomPan(point: ImagePan, fitScale: number, limit: ImagePan): ImagePan {
  return clampImagePan({x: point.x * (1 - 1 / fitScale), y: point.y * (1 - 1 / fitScale)}, limit);
}
