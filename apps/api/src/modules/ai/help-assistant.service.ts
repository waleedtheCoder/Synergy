import { Injectable } from '@nestjs/common';
import { EmbeddingSourceType } from '../../../generated/prisma';
import { VectorStoreService } from './vector-store.service';
import { LlmService } from './llm.service';
import { HELP_DOCS } from './help-docs';
import { renderSources, type PromptSource } from './prompts';

const SOURCE_LIMIT = 5;

@Injectable()
export class HelpAssistantService {
  constructor(
    private readonly vectors: VectorStoreService,
    private readonly llm: LlmService,
  ) {}

  async ask(question: string) {
    const hits = await this.vectors.search(question, {
      sourceTypes: [EmbeddingSourceType.HELP_DOC],
      limit: SOURCE_LIMIT,
    });

    const sources: PromptSource[] = hits.map((hit, index) => ({
      n: index + 1,
      label: HELP_DOCS.find((doc) => doc.id === hit.sourceId)?.title ?? 'Help',
      text: hit.content,
    }));

    const answer = await this.llm.generateText({
      effort: 'low',
      system: [
        "You are Synergi's help assistant. Synergi is a marketplace connecting clients with construction professionals.",
        'Answer questions about how Synergi works using only the numbered help articles. If they do not cover the question, say you are not sure and suggest contacting Synergi support — never invent features, prices, or policies.',
        'Cite the articles you use as [1], [2]. Keep answers under 120 words, friendly and direct. Plain text only, no headings.',
        'Do not answer unrelated questions (general construction advice, coding, etc.); briefly say you can only help with using Synergi.',
      ].join('\n'),
      prompt: `${renderSources(sources)}\n\n<question>\n${question}\n</question>`,
    });

    return {
      answer,
      sources: sources.map((source, index) => ({
        n: source.n,
        id: hits[index].sourceId,
        title: source.label,
      })),
    };
  }
}
