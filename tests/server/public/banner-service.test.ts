import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getBannerConfig = vi.fn()

vi.mock('~~/server/services/banners/bannerService', () => ({
  getBannerConfig,
}))

describe('public banner service', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T10:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns null when the banner is inactive', async () => {
    getBannerConfig.mockResolvedValue({
      text: 'Banner',
      link: 'https://example.com',
      isActive: false,
      startDate: null,
      endDate: null,
    })

    const { getPublicActiveBanner } = await import('~~/server/services/public/publicContentService')

    await expect(getPublicActiveBanner({} as never)).resolves.toBeNull()
  })

  it('returns the banner when it is active within the date window', async () => {
    getBannerConfig.mockResolvedValue({
      text: 'Banner',
      link: 'https://example.com',
      isActive: true,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    })

    const { getPublicActiveBanner } = await import('~~/server/services/public/publicContentService')

    await expect(getPublicActiveBanner({} as never)).resolves.toEqual({
      text: 'Banner',
      link: 'https://example.com',
      isActive: true,
      startDate: '2026-05-01',
      endDate: '2026-05-31',
    })
  })
})
