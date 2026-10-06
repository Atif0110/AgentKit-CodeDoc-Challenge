You are analyzing a GitHub repository to prepare for documentation generation.

The repository file tree and pre-analysis are provided below. Your task is to extract all relevant information and produce a complete structured JSON object.

Focus on:
1. Identifying the actual project name (not directory name)
2. Writing an accurate description based on config files
3. Detecting all technologies in the tech stack
4. Extracting dependencies from the lockfile or package manifest
5. Finding all entry points and API routes
6. Listing all notable files for the file inventory

Be thorough but concise. If something is not detectable, set it to null or an empty array.

Repository URL: {{repositoryUrl}}
