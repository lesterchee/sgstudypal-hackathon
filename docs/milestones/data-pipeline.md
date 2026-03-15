# Data Pipeline Architecture

## Data Scrapers
- `crawl-sgexam.ts`: Puppeteer script to scrape exams from sgexam.com.
- `sort-pdfs.ts`: Sorts downloaded PDFs into a Year/Level/Subject directory structure (`TARGET_DIR/public/pdfs/{year}/{level}/{subject}`).

## Sprint 128 Update
- Mapped 5,800+ raw filenames into structured taxonomies via Regex extraction (`/(20\d{2})/`, `/(p[1-6])/i`, `/(maths|science|english|chinese)/i`).
- Built adversarial self-healing fallsbacks for unparsable filenames (`Unknown_Year`, `unknown_level`, `unknown_subject`).
- Prepared structured dataset for Firebase batch uploading.

## Sprint 132 Update
- Created `apps/sg-tutor/data/exam-papers.ts` — TypeScript data scaffold for interactive AI Mock Exams.
- Defined strict interfaces: `Option`, `Question`, `MockExam`.
- Exported empty `MOCK_EXAMS: MockExam[]` master payload array, ready for V1.0 question ingestion.
- `npx tsc --noEmit` checkpoint passed with zero errors.
