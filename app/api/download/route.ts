import { NextRequest, NextResponse } from 'next/server'
import { instagramGetUrl } from 'instagram-url-direct'

// CORS headers for Android app compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

// Extract shortcode from Instagram URL
function extractShortcode(url: string): string | null {
  const match = url.match(/\/(p|reel|reels|tv)\/([\w-]+)/i)
  return match ? match[2] : null
}

// Determine media type from URL
function getMediaType(url: string): 'reel' | 'post' | 'igtv' | 'story' {
  if (url.includes('/reel') || url.includes('/reels')) return 'reel'
  if (url.includes('/tv')) return 'igtv'
  if (url.includes('/stories')) return 'story'
  return 'post'
}

// Fetch additional metadata by scraping Instagram page
async function fetchMetadata(url: string): Promise<{
  thumbnail?: string
  title?: string
  description?: string
  author?: string
  authorUsername?: string
  authorProfilePic?: string
  likes?: number
  comments?: number
  views?: number
  duration?: number
}> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    })
    
    if (!response.ok) return {}
    
    const html = await response.text()
    
    // Extract Open Graph metadata
    const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/)?.[1]
    const ogTitle = html.match(/<meta property="og:title" content="([^"]+)"/)?.[1]
    const ogDescription = html.match(/<meta property="og:description" content="([^"]+)"/)?.[1]
    const ogVideo = html.match(/<meta property="og:video" content="([^"]+)"/)?.[1]
    
    // Try to extract author info from title (format: "Author on Instagram: ...")
    let author: string | undefined
    let authorUsername: string | undefined
    
    if (ogTitle) {
      const authorMatch = ogTitle.match(/^(.+?) on Instagram/)
      if (authorMatch) {
        author = authorMatch[1]
      }
    }
    
    // Try to extract username from URL or description
    const usernameMatch = ogDescription?.match(/@([\w.]+)/) || html.match(/"username":"([\w.]+)"/)
    if (usernameMatch) {
      authorUsername = usernameMatch[1]
    }
    
    // Try to extract engagement metrics from embedded JSON
    let likes: number | undefined
    let comments: number | undefined
    let views: number | undefined
    
    const likesMatch = html.match(/"edge_media_preview_like":\s*{\s*"count":\s*(\d+)/)
    if (likesMatch) likes = parseInt(likesMatch[1], 10)
    
    const commentsMatch = html.match(/"edge_media_to_comment":\s*{\s*"count":\s*(\d+)/)
    if (commentsMatch) comments = parseInt(commentsMatch[1], 10)
    
    const viewsMatch = html.match(/"video_view_count":\s*(\d+)/)
    if (viewsMatch) views = parseInt(viewsMatch[1], 10)
    
    // Extract video duration
    const durationMatch = html.match(/"video_duration":\s*([\d.]+)/)
    const duration = durationMatch ? parseFloat(durationMatch[1]) : undefined
    
    // Extract author profile pic
    const profilePicMatch = html.match(/"profile_pic_url":"([^"]+)"/)
    const authorProfilePic = profilePicMatch 
      ? profilePicMatch[1].replace(/\\u0026/g, '&') 
      : undefined
    
    return {
      thumbnail: ogImage,
      title: ogTitle,
      description: ogDescription,
      author,
      authorUsername,
      authorProfilePic,
      likes,
      comments,
      views,
      duration,
    }
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json(
        { error: 'Missing URL parameter', code: 'MISSING_URL' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Validate Instagram URL (supports query params like ?igsh=... from shared links)
    const instagramUrlPattern = /^https?:\/\/(www\.)?(instagram\.com|instagr\.am)\/(p|reel|reels|tv|stories)\/[\w-]+/i
    if (!instagramUrlPattern.test(url)) {
      return NextResponse.json(
        { error: 'Invalid Instagram URL. Please provide a valid Instagram Reel, Post, or IGTV link.', code: 'INVALID_URL' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Clean the URL by removing tracking parameters for better compatibility
    let cleanUrl = url
    try {
      const urlObj = new URL(url)
      // Remove common tracking params but keep the base URL
      urlObj.searchParams.delete('igsh')
      urlObj.searchParams.delete('igshid')
      urlObj.searchParams.delete('utm_source')
      urlObj.searchParams.delete('utm_medium')
      cleanUrl = urlObj.toString()
    } catch {
      // If URL parsing fails, use original
      cleanUrl = url
    }

    // Fetch media and metadata in parallel using cleaned URL
    const [mediaResult, metadata] = await Promise.all([
      instagramGetUrl(cleanUrl),
      fetchMetadata(cleanUrl),
    ])

    if (!mediaResult || !mediaResult.url_list || mediaResult.url_list.length === 0) {
      return NextResponse.json(
        { 
          error: 'Unable to fetch media. This could be due to: Private account, Blocked access, or Content no longer available.',
          code: 'FETCH_FAILED',
          suggestion: 'Please ensure the account is public and the link is still valid.'
        },
        { status: 404, headers: corsHeaders }
      )
    }

    // Get the best quality video URL (merged audio/video)
    const videoUrl = mediaResult.url_list[0]
    const shortcode = extractShortcode(cleanUrl)
    const mediaType = getMediaType(cleanUrl)

    // Build comprehensive response
    const response = {
      success: true,
      data: {
        // Media info
        shortcode,
        media_type: mediaType,
        original_url: url,
        
        // Video URLs
        video_url: videoUrl,
        all_urls: mediaResult.url_list,
        thumbnail_url: metadata.thumbnail,
        
        // Content info
        title: metadata.title,
        description: metadata.description,
        duration_seconds: metadata.duration,
        
        // Author info
        author: {
          name: metadata.author,
          username: metadata.authorUsername,
          profile_pic_url: metadata.authorProfilePic,
        },
        
        // Engagement metrics (may be unavailable for some posts)
        engagement: {
          likes: metadata.likes,
          comments: metadata.comments,
          views: metadata.views,
        },
        
        // Request metadata
        fetched_at: new Date().toISOString(),
      },
    }

    return NextResponse.json(response, { headers: corsHeaders })

  } catch (error) {
    console.error('Instagram download error:', error)

    // Handle specific error cases
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('private') || errorMessage.includes('Private')) {
      return NextResponse.json(
        { 
          error: 'This account is private. Only public content can be downloaded.',
          code: 'PRIVATE_ACCOUNT'
        },
        { status: 403, headers: corsHeaders }
      )
    }

    if (errorMessage.includes('blocked') || errorMessage.includes('rate')) {
      return NextResponse.json(
        { 
          error: 'Access temporarily blocked. Please try again in a few minutes.',
          code: 'BLOCKED_ACCESS'
        },
        { status: 429, headers: corsHeaders }
      )
    }

    return NextResponse.json(
      { 
        error: 'Failed to process Instagram URL. Please check the URL and try again.',
        code: 'PROCESSING_ERROR',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500, headers: corsHeaders }
    )
  }
}
