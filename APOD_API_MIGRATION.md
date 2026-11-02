# APOD API Migration Update

## Summary

The gallery migration to NASA's newer WordPress APOD endpoint is working for
recent entries, including titles, dates, images, and video previews. This
document records the description-formatting fix and the restored image fallback.

## Cause of the original problem

The new endpoint returns the `explanation` field as HTML. For example, an
explanation can begin with:

```html
<strong>Explanation:</strong> ... <a href="https://...">...</a>
```

The application originally assigned that value with `textContent`, which
displayed the HTML tags literally. The previous fallback was also lost during
the API migration: the migrated markup used a generic “Preview unavailable”
placeholder and no longer included the existing red NASA worm logo.

## Files modified

- [`index.html`](./index.html)
  - Changed the modal explanation container from a paragraph to a generic
    content container so formatted paragraphs and links can be rendered safely.
- [`js/script.js`](./js/script.js)
  - Added safe explanation rendering using `DOMParser`, an allowlist of text
    formatting elements, and validated `http`/`https` links.
  - Removes a leading “Explanation:” label when NASA includes it in the HTML.
  - Restored the red NASA worm logo and star background through a shared DOM
    fallback helper.
  - Uses the fallback for missing, invalid, or failed gallery and modal media.
  - Keeps valid NASA media unchanged and uses an image `url` when `hdurl` is
    unavailable.
- [`style.css`](./style.css)
  - Preserved the existing fallback appearance.
  - Added modal sizing and minimal paragraph/link styling for formatted
    explanations without changing the existing layout.

The fallback uses [`img/nasa-worm-logo.png`](./img/nasa-worm-logo.png), not
NASA's generic logo.

## Validation

The JavaScript syntax and Git whitespace checks passed. The live endpoint was
also inspected to confirm that current explanations contain HTML markup and
that recent image records provide `hdurl` values. The code preserves the
existing keyboard modal behavior and responsive layout rules.

Interactive browser testing was not available in the development environment,
so visual keyboard, responsive, and console-error checks should be repeated in
a browser before release. A deliberately invalid image URL should be used to
confirm the worm-logo fallback in both a gallery card and the modal.

## Remaining NASA API limitations

- The new endpoint is WordPress-based and paginated. Date-range loading must
  locate the relevant pages and filter entries in the client.
- The endpoint does not guarantee that every record has the same media fields.
  Image entries may lack `hdurl`, and video entries may not provide a usable
  thumbnail.
- Explanations are HTML rather than plain text, so the application must
  continue sanitizing them before rendering.
- NASA's published image can be an intentionally annotated image. The
  September 28, 2026 Cosmic Latte image is legitimate and must not be treated
  as a broken image.
- NASA also provides an unannotated original for that feature, but offering it
  as an additional user option was not implemented.
