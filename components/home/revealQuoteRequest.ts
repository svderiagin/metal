export function revealQuoteRequest(section = document.getElementById("request"), behavior: ScrollBehavior = "auto") {
  if (!section) return;

  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const fitsViewport = (element: HTMLElement) => element.getBoundingClientRect().height <= viewportHeight;
  const target = fitsViewport(section) ? section : section.querySelector<HTMLElement>("[data-quote-fields]") ?? section;
  target.focus({preventScroll: true});
  target.scrollIntoView({block: fitsViewport(target) ? "center" : "start", behavior});
}
