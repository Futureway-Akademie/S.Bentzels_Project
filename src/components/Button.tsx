import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'outline' | 'link'

type CommonProps = { variant?: Variant }
type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { to?: undefined }
type LinkProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }

const classFor = (variant: Variant, extra?: string) =>
  `${variant === 'link' ? 'btn-link' : 'btn'} ${extra ?? ''}`.trim()

export default function Button(props: ButtonProps | LinkProps) {
  const { variant = 'outline', className, ...rest } = props
  if ('to' in props && props.to) {
    const { to, ...anchor } = rest as LinkProps
    return <Link to={to} className={classFor(variant, className)} {...anchor} />
  }
  return (
    <button
      type="button"
      className={classFor(variant, className)}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    />
  )
}
