# Supabase Connection Tester

This simple Node.js application tests the connection to your Supabase project using the official Supabase client library.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file by copying the example:
   ```bash
   cp example.env .env
   ```

3. Update the `.env` file with your Supabase credentials:
   - `SUPABASE_URL`: Your project URL (already set)
   - `SUPABASE_ANON_KEY`: Your project's anon/public key
   
   You can find these in your Supabase dashboard under:
   Settings → API → Project API keys

## Running the Test

To test the connection, run:

```bash
npm test
```

The script will:
- Check if environment variables are properly set
- Initialize the Supabase client
- Attempt to make a simple query
- Display the results

### Success/Error Messages

- ✅ Success: You'll see "Successfully connected to Supabase!"
- ❌ Error: If there's an issue, you'll see an error message with details about what went wrong

## Security Note

Make sure to:
- Never commit your `.env` file to version control
- Keep your API keys secure
- Use appropriate security rules in your Supabase dashboard
