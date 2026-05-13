import { Component, type ErrorInfo, type ReactNode } from 'react'
import { WarningCircle, ArrowCounterClockwise } from '@phosphor-icons/react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  message:  string
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info)
  }

  reset = () => this.setState({ hasError: false, message: '' })

  render() {
    if (!this.state.hasError) return this.props.children

    if (this.props.fallback) return this.props.fallback

    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
        <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[#fef2f2] flex items-center justify-center">
          <WarningCircle size={24} weight="fill" className="text-[var(--color-error)]" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">Something went wrong</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs">
            This section ran into an unexpected error. Try refreshing or come back later.
          </p>
        </div>
        <button
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-green-600)] hover:text-[var(--color-green-700)] transition-colors"
        >
          <ArrowCounterClockwise size={13} />
          Try again
        </button>
      </div>
    )
  }
}
