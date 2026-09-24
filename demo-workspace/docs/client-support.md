# Client Support Policy

## Mobile compatibility

The production API supports the current mobile client and the immediately
previous mobile client release.

The previous mobile client may remain active for up to 30 days after a backend
release.

During that support window, older clients can still send the legacy payload:

```json
{
  "customerName": "Ada Lovelace"
}
```

Backend changes must not turn that still-supported payload into a server error.
