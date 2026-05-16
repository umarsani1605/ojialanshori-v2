import { describe, expect, it } from 'vitest'
import {
  canApprovePost,
  canCreatePost,
  canDeletePost,
  canEditPost,
  canPublishPost,
  canRejectPost,
  canSubmitPost,
} from '~~/server/policies/posts'

describe('canCreatePost', () => {
  it('allows admin to create berita', () => {
    expect(canCreatePost('admin', 'berita')).toBe(true)
  })

  it('rejects reviewer creating berita', () => {
    expect(canCreatePost('reviewer', 'berita')).toBe(false)
  })

  it('rejects santri creating berita', () => {
    expect(canCreatePost('santri', 'berita')).toBe(false)
  })

  it('allows santri to create pena_santri', () => {
    expect(canCreatePost('santri', 'pena_santri')).toBe(true)
  })

  it('allows admin to create pena_santri', () => {
    expect(canCreatePost('admin', 'pena_santri')).toBe(true)
  })

  it('allows reviewer to create pena_santri', () => {
    expect(canCreatePost('reviewer', 'pena_santri')).toBe(true)
  })
})

describe('canApprovePost', () => {
  it('allows admin to approve berita', () => {
    expect(canApprovePost('admin', 'berita')).toBe(true)
  })

  it('rejects reviewer approving berita', () => {
    expect(canApprovePost('reviewer', 'berita')).toBe(false)
  })

  it('allows admin to approve pena_santri', () => {
    expect(canApprovePost('admin', 'pena_santri')).toBe(true)
  })

  it('allows reviewer to approve pena_santri', () => {
    expect(canApprovePost('reviewer', 'pena_santri')).toBe(true)
  })

  it('rejects santri approving any post', () => {
    expect(canApprovePost('santri', 'berita')).toBe(false)
    expect(canApprovePost('santri', 'pena_santri')).toBe(false)
  })
})

describe('canPublishPost', () => {
  it('allows admin to publish berita', () => {
    expect(canPublishPost('admin', 'berita')).toBe(true)
  })

  it('allows admin to publish pena_santri', () => {
    expect(canPublishPost('admin', 'pena_santri')).toBe(true)
  })

  it('allows reviewer to publish pena_santri', () => {
    expect(canPublishPost('reviewer', 'pena_santri')).toBe(true)
  })

  it('rejects reviewer publishing berita', () => {
    expect(canPublishPost('reviewer', 'berita')).toBe(false)
  })

  it('rejects santri publishing any post', () => {
    expect(canPublishPost('santri', 'pena_santri')).toBe(false)
    expect(canPublishPost('santri', 'berita')).toBe(false)
  })
})

describe('canSubmitPost', () => {
  it('allows santri to submit own pena_santri', () => {
    expect(canSubmitPost('santri', 5, 5)).toBe(true)
  })

  it('rejects santri submitting other posts', () => {
    expect(canSubmitPost('santri', 5, 99)).toBe(false)
  })

  it('rejects reviewer submitting', () => {
    expect(canSubmitPost('reviewer', 5, 5)).toBe(false)
  })

  it('rejects admin submitting', () => {
    expect(canSubmitPost('admin', 5, 5)).toBe(false)
  })
})

describe('canRejectPost', () => {
  it('allows admin to reject pena_santri', () => {
    expect(canRejectPost('admin', 'pena_santri')).toBe(true)
  })

  it('allows reviewer to reject pena_santri', () => {
    expect(canRejectPost('reviewer', 'pena_santri')).toBe(true)
  })

  it('rejects santri rejecting', () => {
    expect(canRejectPost('santri', 'pena_santri')).toBe(false)
  })

  it('rejects reviewer rejecting berita', () => {
    expect(canRejectPost('reviewer', 'berita')).toBe(false)
  })
})

describe('canEditPost', () => {
  it('admin can edit any berita post', () => {
    expect(canEditPost('admin', 'berita', 1, 99)).toBe(true)
  })

  it('admin can edit any pena_santri post', () => {
    expect(canEditPost('admin', 'pena_santri', 1, 99)).toBe(true)
  })

  it('santri can edit own pena_santri post', () => {
    expect(canEditPost('santri', 'pena_santri', 5, 5)).toBe(true)
  })

  it('santri cannot edit other santri posts', () => {
    expect(canEditPost('santri', 'pena_santri', 5, 99)).toBe(false)
  })

  it('reviewer can edit pena_santri posts', () => {
    expect(canEditPost('reviewer', 'pena_santri', 5, 5)).toBe(true)
    expect(canEditPost('reviewer', 'pena_santri', 5, 99)).toBe(true)
  })
})

describe('canDeletePost', () => {
  it('admin can delete any post', () => {
    expect(canDeletePost('admin', 'berita', 1, 99)).toBe(true)
    expect(canDeletePost('admin', 'pena_santri', 1, 99)).toBe(true)
  })

  it('santri can delete own post', () => {
    expect(canDeletePost('santri', 'pena_santri', 5, 5)).toBe(true)
  })

  it('santri cannot delete other posts', () => {
    expect(canDeletePost('santri', 'pena_santri', 5, 99)).toBe(false)
  })

  it('reviewer can delete own pena_santri post only', () => {
    expect(canDeletePost('reviewer', 'pena_santri', 1, 1)).toBe(true)
    expect(canDeletePost('reviewer', 'pena_santri', 1, 2)).toBe(false)
    expect(canDeletePost('reviewer', 'berita', 1, 1)).toBe(false)
  })
})
