# ThinkMetal Inventory Mobile

Flutter frontend scaffold for the ThinkMetal inventory app.

## Stack

- Flutter
- `provider` for state management
- `dio` for API calls
- `flutter_secure_storage` for JWT storage
- `go_router` for navigation
- `intl` for dates/currency formatting

## API base URL

The app reads the API URL from `--dart-define=API_BASE_URL=...`.

Examples:

```bash
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:3000
```

Use `10.0.2.2` for the Android emulator when the Express API is running on your computer.
