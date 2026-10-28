# Repository safety

Keep authentication passwords, Cloudflare/R2 access keys, transfer signing secrets,
Firebase Admin service-account keys, signing keys, school-data exports and local
operator reports outside this repository. Use encrypted deployment secrets or
private local environment variables. Never put a secret into a browser build
variable such as `VITE_*`: browser variables are public.

`.gitignore` prevents ordinary additions of local private files. The Public
repository safety workflow also rejects tracked private files, scans the complete
tracked source and scans commits introduced by a push or pull request. Its tools
are version/checksum pinned and use read-only repository permissions.

Firebase web/mobile app configuration identifies the client app and is designed
to be public. It does not replace Authentication, Security Rules or API-key
restrictions. The portal scanner permits only the exact reviewed Firebase client
identifiers in their specific configuration files; it does not suppress other
Google keys, credentials or entire files.

If a credential has ever been committed, revoke or rotate it with its issuing
service. Removing a file or adding it to `.gitignore` does not invalidate the
credential or remove older commits. History cleanup, when needed, must be planned
separately so existing clones and collaborators are handled safely.

Report a suspected exposure privately to the school office rather than posting
credential values in an issue, pull request, screenshot or log.
