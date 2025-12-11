"use client"

import { ReactElement } from "react"

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'

const MyTooltip = ({
  children,
  content,
  placement = "top-start",
  maxWidth = 400,
  interactive = false,
  noBox = false,
  wrapperClassName = '',
  noMargin=true,
  inlineBlock = false,
}: {
  children: ReactElement;
  content: React.ReactNode;
  placement?: Placement;
  interactive?: boolean;
  maxWidth?: number;
  noBox?: boolean;
  wrapperClassName?: string;
  noMargin?: boolean;
  inlineBlock?: boolean;
}) => {

  const positionClasses = placement.includes('top')
    ? 'bottom-full'
    : placement.includes('bottom')
      ? 'top-full'
      : placement.includes('left')
        ? 'right-full top-1/2 -translate-y-1/2'
        : placement.includes('right')
          ? 'left-full top-1/2 -translate-y-1/2'
          : ''

  const alignClasses = placement.includes('start')
    ? 'left-0'
    : placement.includes('end')
      ? 'right-0'
      : placement.includes('left') || placement.includes('right')
        ? ''
        : 'left-1/2 -translate-x-1/2'

  const gapClasses = noMargin
    ? ''
    : placement.includes('top')
      ? 'mb-2'
      : placement.includes('bottom')
        ? 'mt-2'
        : placement.includes('left')
          ? 'mr-2'
          : placement.includes('right')
            ? 'ml-2'
            : ''

  const visibilityClasses = interactive ? 'group-hover:visible group-focus-visible:visible' : 'group-hover:visible'

  return (
    <span
      className={`relative ${inlineBlock ? 'inline-block' : 'inline'} group focus:outline-none ${wrapperClassName}`}
      tabIndex={0}
    >
      {children}
      <div
        className={`
          absolute z-[10000000000] invisible ${visibilityClasses}
          ${positionClasses}
          ${alignClasses}
          ${gapClasses}
          ${noBox ? 'bg-transparent' : 'bg-black/65 text-white rounded-lg p-2'}
          text-sm
          ${interactive ? '' : 'pointer-events-none'}
        `}
        style={{
          maxWidth: maxWidth,
          width: 'max-content'
        }}
      >
        {content}
      </div>
    </span>
  )
}

export default MyTooltip
