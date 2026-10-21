import { useState } from 'react'
import { categoryStyle } from './categoryStyles.js'

/** Shows the product photo, or a category-tinted illustration when there is no URL or it fails to load. */
export default function ProductImage({ imageUrl, name, category, className = '', iconClassName = 'size-12' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const url = imageUrl?.trim()

  if (url && failedUrl !== url) {
    return (
      <img
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setFailedUrl(url)}
        className={`object-cover ${className}`}
      />
    )
  }

  const { icon: Icon, tint } = categoryStyle(category)
  return (
    <div role="img" aria-label={`${name} (no photo)`} className={`grid place-items-center ${tint} ${className}`}>
      <Icon className={`${iconClassName} text-nordic/80`} strokeWidth={1.4} aria-hidden="true" />
    </div>
  )
}
