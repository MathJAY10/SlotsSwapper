import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { eventsApi } from '../services/api'

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
    loadEvents()
  }, [user, navigate])

  const loadEvents = async () => {
    setLoading(true)
    try {
      const { data } = await eventsApi.getAll()
      setEvents(data)
      setError('')
    } catch (err) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!title || !startTime || !endTime) {
      setError('Please fill all fields')
      return
    }
    setLoading(true)
    try {
      await eventsApi.create(title, startTime, endTime)
      setTitle('')
      setStartTime('')
      setEndTime('')
      setError('')
      await loadEvents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSwappable = async (eventId, currentStatus) => {
    setLoading(true)
    try {
      const newStatus = currentStatus === 'SWAPPABLE' ? 'BUSY' : 'SWAPPABLE'
      await eventsApi.update(eventId, { status: newStatus })
      setError('')
      await loadEvents()
    } catch (err) {
      setError('Failed to update event')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      setLoading(true)
      try {
        await eventsApi.delete(eventId)
        setError('')
        await loadEvents()
      } catch (err) {
        setError('Failed to delete event')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <div className="container-fluid py-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h1 className="mb-1">Dashboard</h1>
            <p className="text-muted mb-0">Welcome back, <strong>{user?.name}</strong>! 👋</p>
          </div>
          <button 
            className="btn btn-outline-danger" 
            onClick={() => { logout(); navigate('/login'); }}
          >
            Logout
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>⚠️ Error:</strong> {error}
            <button type="button" className="btn-close" onClick={() => setError('')}></button>
          </div>
        )}

        {/* Main Content */}
        <div className="row g-4">
          {/* Create Event Card */}
          <div className="col-lg-5">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-calendar-plus"></i> Create New Event
                </h5>
                <form onSubmit={handleCreateEvent}>
                  <div className="mb-3">
                    <label className="form-label fw-500">Event Title</label>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="e.g., Team Meeting"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-500">Start Time</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-lg"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-500">End Time</label>
                    <input
                      type="datetime-local"
                      className="form-control form-control-lg"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating...
                      </>
                    ) : (
                      '✨ Create Event'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Events List Card */}
          <div className="col-lg-7">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <h5 className="card-title mb-4">
                  <i className="bi bi-list-check"></i> Your Events ({events.length})
                </h5>
                {loading && events.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : events.length === 0 ? (
                  <div className="alert alert-info mb-0">
                    📭 No events yet. Create one to get started!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="border rounded-lg p-3 mb-3"
                        style={{ backgroundColor: '#fff', borderLeft: `4px solid ${event.status === 'SWAPPABLE' ? '#28a745' : '#6c757d'}` }}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="flex-grow-1">
                            <h6 className="mb-2 fw-600">{event.title}</h6>
                            <small className="text-muted">
                              📅 {new Date(event.startTime).toLocaleDateString()} <br />
                              🕐 {new Date(event.startTime).toLocaleTimeString()} - {new Date(event.endTime).toLocaleTimeString()}
                            </small>
                            <br />
                            <span
                              className={`badge mt-2 ${
                                event.status === 'SWAPPABLE'
                                  ? 'bg-success'
                                  : 'bg-secondary'
                              }`}
                            >
                              {event.status === 'SWAPPABLE' ? '🔄 Swappable' : '🔒 Busy'}
                            </span>
                          </div>
                          <div className="btn-group-vertical" role="group">
                            <button
                              className={`btn btn-sm ${
                                event.status === 'SWAPPABLE'
                                  ? 'btn-warning'
                                  : 'btn-success'
                              }`}
                              onClick={() => handleToggleSwappable(event.id, event.status)}
                              disabled={loading}
                              title={event.status === 'SWAPPABLE' ? 'Make Busy' : 'Make Swappable'}
                            >
                              {event.status === 'SWAPPABLE' ? '🔒 Lock' : '🔓 Unlock'}
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDeleteEvent(event.id)}
                              disabled={loading}
                              title="Delete event"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}