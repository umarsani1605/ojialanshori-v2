import { describe, expect, it } from 'vitest'

import { shouldUseAdminCategorySource } from '~~/app/composables/post-editor/usePostEditorContext'

describe('shouldUseAdminCategorySource', () => {
  it('returns false for non-admin editor flows', () => {
    expect(shouldUseAdminCategorySource(false)).toBe(false)
  })

  it('returns true only for admin editor flows', () => {
    expect(shouldUseAdminCategorySource(true)).toBe(true)
  })
})
