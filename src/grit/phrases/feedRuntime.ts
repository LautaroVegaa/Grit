import { Category, Phrase } from './types';
import { selectFeedBatch } from './feedEngine';

export interface FeedRuntimeRequest {
  batchSize: number;
  cursor?: string | null;
  allowedCategories?: Category[];
  excludeIds?: string[];
}

export interface FeedRuntimeResponse {
  items: Phrase[];
  cursor: string | null;
  totalAvailable: number;
}

export const getFeedBatch = async (
  request: FeedRuntimeRequest,
): Promise<FeedRuntimeResponse> => {
  return selectFeedBatch({
    batchSize: request.batchSize,
    cursor: request.cursor ?? null,
    allowedCategories: request.allowedCategories,
    excludeIds: request.excludeIds ?? [],
  });
};
