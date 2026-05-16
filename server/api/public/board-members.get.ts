import { isMysqlConfigured, useDb } from '#server/utils/db'
import { getPublicBoardMemberList } from '#server/services/public/publicContentService'
import { createInvalidator, PublicCacheScopes } from '#server/utils/publicCache'

export default defineCachedEventHandler(async (event) => {
  if (!isMysqlConfigured(event)) return []
  return await getPublicBoardMemberList(useDb(event))
}, {
  maxAge: 60 * 60 * 24 * 365,
  staleMaxAge: -1,
  swr: true,
  name: 'public-board-members',
  shouldInvalidateCache: createInvalidator(PublicCacheScopes.boardMembers),
})
