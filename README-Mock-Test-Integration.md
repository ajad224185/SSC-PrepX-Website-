# SSC PrepX Mock Test Integration

Changes made:
- Bottom navigation: Chat removed.
- Mock Test added in its place.
- Existing Quizzes tab was consolidated into Mock Test.
- Mock Test Hub opens inside SSC PrepX using the live Mock Test Hub URL.
- `mock-test.html` is included as a standalone Mock Test page.
- `mock-test-hub-source/` contains the uploaded Mock Test Hub static snapshot/source files.

Important:
The uploaded Mock Test Hub ZIP contains a Next.js client plus API calls to `/api/...`. A local copy can render its shell but cannot reproduce the original backend/API/authentication by itself. Therefore the SSC PrepX integration uses the live Mock Test Hub URL so its existing backend continues to work.

Upload the contents of this ZIP to the root of your SSC PrepX GitHub repository. Keep your existing `js/`, `functions/`, login/admin files and other project files unchanged.
