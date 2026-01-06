# Coding Guidelines

- Use conventional commits
- Always write exports at the bottom of the file
- Never use default exports; use named exports only
- Use kebab-case for file names
- Always use drizzle-kit for database migrations (never create migration files manually)
- Avoid barrel export files (index.ts that only re-exports); import directly from source files
