---
name: SSO Crawler
description: Legal Ingestion Skill to monitor and digest Singapore Family Law
---
I am granting you the Legal Ingestion Skill. Your mission is to monitor and 'digest' Singapore Family Law.

The Workflow:

Crawl: Use your browser tool to access Singapore Statutes Online (SSO) specifically for the 'Women’s Charter 1961'.

Tokenize: Break down sections (e.g., Section 112 on Asset Division) into Logic Chunks.

The Artifact: Generate a JSON schema in /packages/legal-engine/src/rules/womens-charter.json.

Validation: Every chunk must include a source_url and a last_updated timestamp.

Start by analyzing Section 112 of the Women's Charter and propose a JSON structure that represents the court's power to divide matrimonial assets.
