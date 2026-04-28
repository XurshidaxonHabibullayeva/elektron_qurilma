import { useState } from 'react'

interface DocumentViewerProps {
  url: string
}

export function DocumentViewer({ url }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  if (!url) return null

  // Clean the URL from query parameters if any (e.g. ?t=123)
  const cleanUrl = url.split('?')[0]
  const extension = cleanUrl.split('.').pop()?.toLowerCase() || ''

  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)
  const isPdf = extension === 'pdf'
  const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <img
          src={url}
          alt="Biriktirilgan material"
          className="mx-auto h-auto max-w-full"
          onError={() => setError(true)}
        />
        {error && (
          <p className="p-4 text-center text-sm text-red-500">
            Rasmni yuklashda xatolik yuz berdi.
          </p>
        )}
      </div>
    )
  }

  if (isPdf) {
    return (
      <div className="h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        <iframe
          src={url}
          className="size-full border-0"
          title="PDF Viewer"
          onLoad={() => setLoading(false)}
        />
      </div>
    )
  }

  if (isOfficeDoc) {
    const googleDocsUrl = `https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
            <div
              className="size-8 animate-spin rounded-full border-2 border-slate-300 border-t-teal-600 dark:border-slate-600 dark:border-t-teal-400"
              role="status"
            ></div>
          </div>
        )}
        <iframe
          src={googleDocsUrl}
          className="size-full border-0"
          title="Document Viewer"
          onLoad={() => setLoading(false)}
          onError={() => setError(true)}
        />
      </div>
    )
  }

  // Fallback for unknown/unsupported types
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Ushbu fayl turini tizim ichida to‘g‘ridan-to‘g‘ri ko‘rib bo‘lmaydi.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500/50 dark:bg-teal-700 dark:hover:bg-teal-600"
      >
        Faylni yuklab olish yoki boshqa oynada ochish
      </a>
    </div>
  )
}
