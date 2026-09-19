import booksCatalog from './medicalBooksCatalog.json' with { type: 'json' };

/**
 * Medical Book Knowledge Retrieval & Context Injector Engine
 * Connects the 23 authoritative clinical medical textbooks in "E:/clone app/backend/books"
 * to the LLM Report Analysis Pipeline.
 */
export class BookKnowledgeEngine {
  constructor() {
    this.catalog = booksCatalog;
  }

  /**
   * Retrieve matched textbook guidelines and clinical contexts based on the analyzed report findings
   */
  getRelevantBookContext(engineResult = {}, fileName = '', fullText = '') {
    const matchedBooks = new Map();
    const queryTokens = [];

    // 1. Gather tokens from structured tests
    if (Array.isArray(engineResult.structuredResults)) {
      for (const t of engineResult.structuredResults) {
        if (t.testName) queryTokens.push(t.testName.toLowerCase());
        if (t.category) queryTokens.push(t.category.toLowerCase());
        if (t.evaluatedStatus && t.evaluatedStatus !== 'NORMAL') {
          queryTokens.push(`${t.testName} abnormal`.toLowerCase());
        }
      }
    }

    // 2. Gather tokens from diagnostic narrative procedures / findings
    if (Array.isArray(engineResult.diagnosticFindings)) {
      for (const d of engineResult.diagnosticFindings) {
        if (d.procedure) queryTokens.push(d.procedure.toLowerCase());
        if (d.anatomicalRegion) queryTokens.push(d.anatomicalRegion.toLowerCase());
        if (d.fractureLocation) queryTokens.push('fracture', d.fractureLocation.toLowerCase());
        if (d.impression) queryTokens.push(d.impression.toLowerCase());
        if (d.findingsSummary) queryTokens.push(d.findingsSummary.toLowerCase());
      }
    }

    // 3. Document Badges & Category
    if (Array.isArray(engineResult.documentBadges)) {
      for (const b of engineResult.documentBadges) {
        if (b.name) queryTokens.push(b.name.toLowerCase());
      }
    }

    // 4. File name & snippet tokens
    if (fileName) queryTokens.push(fileName.toLowerCase());
    if (fullText) queryTokens.push(fullText.slice(0, 1000).toLowerCase());

    const combinedQuery = queryTokens.join(' ');

    // Match against book keywords and clinical context
    for (const book of this.catalog) {
      let matchScore = 0;
      const matchedKeywords = [];

      for (const kw of book.keywords) {
        if (combinedQuery.includes(kw.toLowerCase())) {
          matchScore += 1;
          matchedKeywords.push(kw);
        }
      }

      for (const spec of book.specialties) {
        if (combinedQuery.includes(spec.toLowerCase())) {
          matchScore += 2;
        }
      }

      if (matchScore > 0) {
        matchedBooks.set(book.id, {
          bookTitle: book.title,
          authors: book.authors,
          publisher: book.publisher,
          specialties: book.specialties,
          matchedKeywords,
          clinicalContext: book.clinicalContext,
          score: matchScore
        });
      }
    }

    // If no direct keyword match, provide general clinical reference from Davidson & Blueprints
    if (matchedBooks.size === 0) {
      const defaultBook = this.catalog.find(b => b.id === 'BOOK-DAVIDSON-100-CASES') || this.catalog[0];
      if (defaultBook) {
        matchedBooks.set(defaultBook.id, {
          bookTitle: defaultBook.title,
          authors: defaultBook.authors,
          publisher: defaultBook.publisher,
          specialties: defaultBook.specialties,
          matchedKeywords: ['internal medicine synthesis'],
          clinicalContext: defaultBook.clinicalContext,
          score: 1
        });
      }
    }

    // Sort by score and take top 4 most relevant textbooks
    const topMatches = Array.from(matchedBooks.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    return {
      referenceCount: topMatches.length,
      matchedTextbooks: topMatches.map(m => `📖 ${m.bookTitle} (${m.authors}, ${m.publisher})`),
      clinicalContextPrompt: topMatches.map(m => 
        `[AUTHORITATIVE REFERENCE: ${m.bookTitle}]\n` +
        `Specialties: ${m.specialties.join(', ')}\n` +
        `Clinical Diagnostic Guidelines: ${m.clinicalContext}`
      ).join('\n\n')
    };
  }
}

export const bookKnowledgeEngine = new BookKnowledgeEngine();
export default bookKnowledgeEngine;
