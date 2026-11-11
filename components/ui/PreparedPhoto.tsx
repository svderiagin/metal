import Image, {getImageProps, type ImageProps} from "next/image";
import type {Ref} from "react";
import type {PreparedPhoto as Photo} from "@/lib/server/preparedPhotos";

export function PreparedPhoto({photo, alt, ref, onLoad, ...image}: ImageProps & {photo?: Photo; ref?: Ref<HTMLImageElement>; "data-active"?: boolean}) {
  if (!photo) return <Image {...image} alt={alt} ref={ref} onLoad={onLoad}/>;

  const {props} = getImageProps({...image, alt, src: photo.fallback, unoptimized: true});
  return <picture>
    <source type="image/avif" sizes={image.sizes} srcSet={photo.avif}/>
    <img {...props} alt={alt} ref={ref} onLoad={onLoad} sizes={image.sizes} srcSet={photo.webp}/>
  </picture>;
}
