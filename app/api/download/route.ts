import { NextRequest, NextResponse } from 'next/server'
import { instagramGetUrl } from 'instagram-url-direct'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// 🧠 Simple in-memory cache (5 min)
const cache = new Map<string, any>()

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// 🔁 Retry wrapper
async function getMediaWithRetry(url: string, retries = 2): Promise<any> {
  try {
    return await instagramGetUrl(url)
  } catch (err) {
    if (retries > 0) {
      await delay(2000)
      return getMediaWithRetry(url, retries - 1)
    }
    throw err
  }
}

// ⏱ Delay helper
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 🔍 Extract shortcode
function extractShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|reels|tv)\/([\w-]+)/i)
  return match ? match[2] : null
}

// 📦 Media type
function getMediaType(url: string): string {
  if (url.includes('/reel')) return 'reel'
  if (url.includes('/tv')) return 'igtv'
  return 'post'
}

// 🧹 Clean URL
function cleanInstagramUrl(raw: string): string {
  try {
    const u = new URL(raw)
    u.search = '' // remove ALL params
    return u.toString()
  } catch {
    return raw.split('?')[0]
  }
}

// ⚡ Lightweight metadata fetch (optional)
async function fetchMetadata(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': '*/*',
        'Referer': 'https://www.instagram.com/',
      },
    })

    if (!res.ok) return {}

    const html = await res.text()

    const thumbnail = html.match(/og:image" content="([^"]+)"/)?.[1]
    const title = html.match(/og:title" content="([^"]+)"/)?.[1]
    const description = html.match(/og:description" content="([^"]+)"/)?.[1]

    const usernameMatch = html.match(/"username":"([\w.]+)"/)
    const profilePicMatch = html.match(/"profile_pic_url":"([^"]+)"/)

    return {
      thumbnail,
      title,
      description,
      authorUsername: usernameMatch?.[1],
      authorProfilePic: profilePicMatch?.[1]?.replace(/\\u0026/g, '&'),
    }
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const inputUrl = searchParams.get('url')

    if (!inputUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing URL', code: 'NO_URL' },
        { status: 400, headers: corsHeaders }
      )
    }

    const cleanUrl = cleanInstagramUrl(inputUrl)

    // ⚡ Cache check
    if (cache.has(cleanUrl)) {
      return NextResponse.json(cache.get(cleanUrl), { headers: corsHeaders })
    }

    // ⏱ Delay to avoid instant blocking
    await delay(1200)

    // 🔥 Get media (main call)
    const mediaResult = await getMediaWithRetry(cleanUrl)

    if (!mediaResult?.url_list?.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to fetch media',
          code: 'FETCH_FAILED'
        },
        { status: 404, headers: corsHeaders }
      )
    }

    // ⏱ Delay before metadata fetch (important)
    await delay(800)

    const metadata = await fetchMetadata(cleanUrl)

    const videoUrl = mediaResult.url_list[0]

    const response = {
      success: true,
      data: {
        shortcode: extractShortcode(cleanUrl),
        media_type: getMediaType(cleanUrl),
        original_url: inputUrl,

        video_url: videoUrl,
        all_urls: mediaResult.url_list,
        thumbnail_url: metadata.thumbnail || null,

        title: metadata.title || null,
        description: metadata.description || null,
        duration_seconds: null,

        author: {
          name: null,
          username: metadata.authorUsername || null,
          profile_pic_url: metadata.authorProfilePic || null,
        },

        engagement: {
          likes: null,
          comments: null,
          views: null,
        },

        fetched_at: new Date().toISOString(),
      },
    }

    // 💾 Cache response
    cache.set(cleanUrl, response)
    setTimeout(() => cache.delete(cleanUrl), 5 * 60 * 1000)

    return NextResponse.json(response, { headers: corsHeaders })

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'Processing failed',
        code: 'PROCESSING_ERROR',
        details: error?.message || null
      },
      { status: 500, headers: corsHeaders }
    )
  }
}