import React, { ReactNode, CSSProperties } from 'react'

// React Native の View コンポーネントの代替
export const View: React.FC<{
  style?: CSSProperties
  children?: ReactNode
  className?: string
  onClick?: () => void
}> = ({ style, children, className, onClick }) => (
  <div style={style} className={className} onClick={onClick}>
    {children}
  </div>
)

// React Native の Text コンポーネントの代替
export const Text: React.FC<{
  style?: CSSProperties
  children?: ReactNode
  className?: string
  onClick?: () => void
}> = ({ style, children, className, onClick }) => (
  <span style={style} className={className} onClick={onClick}>
    {children}
  </span>
)

// React Native の ScrollView コンポーネントの代替
export const ScrollView: React.FC<{
  style?: CSSProperties
  children?: ReactNode
  className?: string
  horizontal?: boolean
  showsHorizontalScrollIndicator?: boolean
  showsVerticalScrollIndicator?: boolean
}> = ({ 
  style, 
  children, 
  className, 
  horizontal = false,
  showsHorizontalScrollIndicator = true,
  showsVerticalScrollIndicator = true
}) => {
  const scrollStyle: CSSProperties = {
    ...style,
    overflow: 'auto',
    ...(horizontal && {
      display: 'flex',
      flexDirection: 'row',
      overflowX: 'auto',
      overflowY: 'hidden'
    }),
    ...(!showsHorizontalScrollIndicator && { 
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    }),
    ...(!showsVerticalScrollIndicator && { 
      scrollbarWidth: 'none',
      msOverflowStyle: 'none'
    })
  }

  const hideScrollbarClass = (!showsHorizontalScrollIndicator || !showsVerticalScrollIndicator) 
    ? 'hide-scrollbar' : ''

  return (
    <div style={scrollStyle} className={`${className} ${hideScrollbarClass}`}>
      {children}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}

// React Native の TouchableOpacity コンポーネントの代替
export const TouchableOpacity: React.FC<{
  style?: CSSProperties
  children?: ReactNode
  className?: string
  onPress?: () => void
  onLongPress?: () => void
  delayLongPress?: number
  activeOpacity?: number
  disabled?: boolean
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number }
}> = ({ 
  style, 
  children, 
  className, 
  onPress, 
  onLongPress,
  delayLongPress = 500,
  activeOpacity = 0.7,
  disabled = false,
  hitSlop
}) => {
  const [isPressed, setIsPressed] = React.useState(false)
  const longPressTimer = React.useRef<NodeJS.Timeout>()

  const handleMouseDown = () => {
    if (disabled) return
    setIsPressed(true)
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress()
      }, delayLongPress)
    }
  }

  const handleMouseUp = () => {
    if (disabled) return
    setIsPressed(false)
    
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleClick = () => {
    if (disabled) return
    if (onPress) {
      onPress()
    }
  }

  const buttonStyle: CSSProperties = {
    ...style,
    opacity: disabled ? 0.5 : (isPressed ? activeOpacity : 1),
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'opacity 0.1s ease',
    border: 'none',
    background: 'transparent',
    padding: 0,
    ...(hitSlop && {
      padding: `${hitSlop.top || 0}px ${hitSlop.right || 0}px ${hitSlop.bottom || 0}px ${hitSlop.left || 0}px`
    })
  }

  return (
    <button
      style={buttonStyle}
      className={className}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// React Native の TextInput コンポーネントの代替
export const TextInput: React.FC<{
  style?: CSSProperties
  className?: string
  placeholder?: string
  value?: string
  onChangeText?: (text: string) => void
  keyboardType?: 'default' | 'numeric' | 'email-address'
  secureTextEntry?: boolean
  multiline?: boolean
  autoFocus?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
  autoCorrect?: boolean
}> = ({
  style,
  className,
  placeholder,
  value,
  onChangeText,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  autoFocus = false,
  autoCapitalize = 'sentences',
  autoCorrect = true
}) => {
  const inputType = keyboardType === 'numeric' ? 'number' : 
                   keyboardType === 'email-address' ? 'email' : 'text'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChangeText) {
      onChangeText(e.target.value)
    }
  }

  const commonProps = {
    style,
    className,
    placeholder,
    value,
    onChange: handleChange,
    autoFocus,
    autoCapitalize,
    autoCorrect: autoCorrect ? 'on' : 'off'
  }

  if (multiline) {
    return (
      <textarea
        {...commonProps}
        rows={4}
      />
    )
  }

  return (
    <input
      {...commonProps}
      type={secureTextEntry ? 'password' : inputType}
    />
  )
}

// React Native の Image コンポーネントの代替
export const Image: React.FC<{
  source: { uri: string }
  style?: CSSProperties
  className?: string
  onError?: () => void
}> = ({ source, style, className, onError }) => (
  <img
    src={source.uri}
    style={style}
    className={className}
    onError={onError}
    alt=""
  />
)

// React Native の Switch コンポーネントの代替
export const Switch: React.FC<{
  value: boolean
  onValueChange: (value: boolean) => void
  trackColor?: { false: string; true: string }
  thumbColor?: string
  disabled?: boolean
}> = ({ 
  value, 
  onValueChange, 
  trackColor = { false: '#E5E5E5', true: '#8B4513' },
  thumbColor = '#FFFFFF',
  disabled = false
}) => {
  const switchStyle: CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '24px',
    backgroundColor: value ? trackColor.true : trackColor.false,
    borderRadius: '12px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.2s ease',
    opacity: disabled ? 0.5 : 1
  }

  const thumbStyle: CSSProperties = {
    position: 'absolute',
    top: '2px',
    left: value ? '28px' : '2px',
    width: '20px',
    height: '20px',
    backgroundColor: thumbColor,
    borderRadius: '50%',
    transition: 'left 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }

  return (
    <div
      style={switchStyle}
      onClick={() => !disabled && onValueChange(!value)}
    >
      <div style={thumbStyle} />
    </div>
  )
}

// React Native の Modal コンポーネントの代替
export const Modal: React.FC<{
  visible: boolean
  transparent?: boolean
  animationType?: 'none' | 'slide' | 'fade'
  onRequestClose: () => void
  children: ReactNode
}> = ({ visible, transparent = false, animationType = 'fade', onRequestClose, children }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onRequestClose()
      }
    }

    if (visible) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [visible, onRequestClose])

  if (!visible) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: transparent ? 'rgba(0,0,0,0.5)' : 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    animation: animationType === 'fade' ? 'fadeIn 0.2s ease' : 
               animationType === 'slide' ? 'slideIn 0.3s ease' : 'none'
  }

  return (
    <div style={overlayStyle} onClick={onRequestClose}>
      <div onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

// React Native の Alert の代替
export const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{
      text: string
      style?: 'default' | 'cancel' | 'destructive'
      onPress?: () => void
    }>
  ) => {
    if (buttons && buttons.length > 1) {
      // カスタムダイアログを表示
      const result = window.confirm(`${title}\n\n${message || ''}`)
      const button = buttons.find(b => b.style === (result ? 'default' : 'cancel'))
      if (button && button.onPress) {
        button.onPress()
      }
    } else {
      window.alert(`${title}\n\n${message || ''}`)
      if (buttons && buttons[0] && buttons[0].onPress) {
        buttons[0].onPress()
      }
    }
  }
}

// React Native の Dimensions の代替
export const Dimensions = {
  get: (dimension: 'window' | 'screen') => ({
    width: window.innerWidth,
    height: window.innerHeight
  })
}