import { legacy_createStore as createStore } from 'redux'

const readPref = (key, fallback) => {
  try {
    if (typeof window === 'undefined') return fallback
    const value = window.localStorage.getItem(key)
    return value ?? fallback
  } catch {
    return fallback
  }
}

const initialState = {
  sidebarShow: true,
  theme: 'light',
  sidebarColorScheme: readPref('resello_sidebarColorScheme', 'auto'),
  headerColorScheme: readPref('resello_headerColorScheme', 'auto'),
}

const changeState = (state = initialState, { type, ...rest }) => {
  switch (type) {
    case 'set':
      return { ...state, ...rest }
    default:
      return state
  }
}

const store = createStore(changeState)
export default store
