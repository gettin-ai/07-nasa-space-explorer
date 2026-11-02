# NASA APOD API Test Log

Use this document to record each API check or update related to the NASA Astronomy Picture of the Day gallery.

## 2026-11-02 - APOD imagery test

**Endpoint**

`https://api.nasa.gov/planetary/apod`

**Request**

- API key: configured key tested, value omitted from this log
- Date: `2026-11-02`
- Parameter: `thumbs=true`

**Result**

- HTTP status: `200 OK`
- Response format: valid JSON
- `media_type`: `image`
- `title`: `NASA Science`
- `url`: NASA generic logo image
- `hdurl`: NASA generic logo image

**Conclusion**

The API endpoint and API key are accepted, but the APOD record is returning NASA's generic logo instead of astronomy imagery. This indicates an upstream APOD data problem rather than a failure in the app's fetch request. No restoration estimate was available when this test was recorded.

## Future test template

### YYYY-MM-DD - Short description

**Endpoint**

`https://api.nasa.gov/planetary/apod`

**Request**

- API key: configured key tested, value omitted from this log
- Date or date range: `YYYY-MM-DD` or `YYYY-MM-DD` through `YYYY-MM-DD`
- Parameters: `thumbs=true`

**Result**

- HTTP status:
- Response format:
- `media_type`:
- `title`:
- `url`:
- `hdurl`:

**Conclusion**

Record whether the API returned usable astronomy imagery or whether the issue remains.
