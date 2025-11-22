# Environment Setup

## Environment Variables

Create a `.env.local` file in the root of the frontend project with the following variables:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api/v1

# Environment
VITE_ENV=development
```

## Default Configuration

If `.env.local` is not provided, the application will use these defaults:
- `VITE_API_BASE_URL`: `http://localhost:3000/api/v1`

The API base URL is configured in `src/services/api.ts` and will automatically use the environment variable if available, or fall back to the default.

## Notes

- `.env.local` is already in `.gitignore` and will not be committed to version control
- For production, set `VITE_API_BASE_URL` to your production API URL
- The backend should be running on the configured port before starting the frontend


