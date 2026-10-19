import {getImageProps} from "next/image";

// The catalog sidebar puts these photographs below the fold on smaller screens.
// Match Image's responsive candidates without eagerly downloading mobile content.
export function DesktopImagePreload({src, sizes}: {src: string; sizes: string}) {
  const {props} = getImageProps({src, alt: "", fill: true, sizes});
  return <link rel="preload" as="image" media="(min-width: 1024px)"
    imageSrcSet={props.srcSet} imageSizes={props.sizes} fetchPriority="high"/>;
}
