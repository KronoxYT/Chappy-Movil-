import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginScreen } from '../login-screen'
import { useAppStore } from '@/lib/store'

// Mock the store
jest.mock('@/lib/store', () => ({
  useAppStore: jest.fn()
}))

const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

describe('LoginScreen', () => {
  beforeEach(() => {
    mockUseAppStore.mockReturnValue({
      setAuthToken: jest.fn(),
      setWebsocketUrl: jest.fn(),
      websocketUrl: 'ws://localhost:3003'
    })
  })

  it('renders login form', () => {
    render(<LoginScreen />)
    expect(screen.getByText('CHAPPI')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your API key')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /connect to network/i })).toBeInTheDocument()
  })

  it('shows error on failed login', async () => {
    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid API key' })
      })
    ) as jest.Mock

    render(<LoginScreen />)
    
    const input = screen.getByPlaceholderText('Enter your API key')
    const button = screen.getByRole('button', { name: /connect to network/i })
    
    fireEvent.change(input, { target: { value: 'invalid-key' } })
    fireEvent.click(button)
    
    await waitFor(() => {
      expect(screen.getByText('Invalid API key')).toBeInTheDocument()
    })
  })
})