import { afterEach, describe, expect, it, vi } from 'vitest'

const findSettingByKey = vi.fn()
const upsertSetting = vi.fn()

vi.mock('~~/server/repositories/settings/settingRepository', () => ({
  findSettingByKey,
  upsertSetting,
}))

afterEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

describe('banner settings service', () => {
  it('returns default banner state when the setting does not exist', async () => {
    findSettingByKey.mockResolvedValue(null)

    const { listBannersForAdmin } = await import('~~/server/services/banners/bannerService')

    await expect(listBannersForAdmin({} as never)).resolves.toEqual({
      text: '',
      link: null,
      isActive: false,
      startDate: null,
      endDate: null,
    })
  })

  it('stores the banner in one top_banner JSON setting', async () => {
    findSettingByKey.mockResolvedValue(null)
    upsertSetting.mockResolvedValue(undefined)

    const { patchBanner } = await import('~~/server/services/banners/bannerService')

    await expect(patchBanner({} as never, 1, {
      text: 'Pendaftaran dibuka',
      link: 'https://example.com',
      isActive: true,
      startDate: '2026-05-08',
      endDate: '2026-05-31',
    })).resolves.toEqual({
      text: 'Pendaftaran dibuka',
      link: 'https://example.com',
      isActive: true,
      startDate: '2026-05-08',
      endDate: '2026-05-31',
    })

    expect(upsertSetting).toHaveBeenCalledWith(
      {} as never,
      'top_banner',
      JSON.stringify({
        text: 'Pendaftaran dibuka',
        link: 'https://example.com',
        isActive: true,
        startDate: '2026-05-08',
        endDate: '2026-05-31',
      }),
    )
  })
})
