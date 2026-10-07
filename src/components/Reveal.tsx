import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ReactNode,
} from 'react'

type RevealProps = {
  children: ReactNode
  as?: ElementType
  className?: string
  delay?: number
  slow?: boolean
}

export default function Reveal({
  children,
  as: Tag = 'div',
  className = '',
  delay = 0,
  slow = false,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      data-visible={visible}
      className={`reveal ${slow ? 'reveal-slow' : ''} ${className}`}
      style={{ '--reveal-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  )
}
