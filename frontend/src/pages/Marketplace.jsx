import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { swapsApi, eventsApi } from '../services/api'

export default function Marketplace() {
  const [swappableSlots, setSwappableSlots] = useState([])
  const [userSwappableEvents, setUserSwappableEvents] = useState([])
  const [selectedMySlot, setSelectedMySlot] = useState(null)
  const [selectedTheirSlot, setSelectedTheirSlot] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
    loadSwappableSlots()
    loadUserSwappableEvents()
  }, [user, navigate])

  const loadSwappableSlots = async () => {
    try {
      const { data } = await swapsApi.getSwappableSlots()
      setSwappableSlots(data.slots)
    } catch (err) {
      setError('Failed to load swappable slots')
    }
  }

  const loadUserSwappableEvents = async () => {
    try {
      const { data } = await eventsApi.getAll()
      setUserSwappableEvents(data.filter((e) => e.status === 'SWAPPABLE'))
    } catch (err) {
      setError('Failed to load your events')
    }
  }

  const handleRequestSwap = async () => {
    if (!selectedMySlot || !selectedTheirSlot) {
      setError('Please select both slots')
      return
    }
    try {
      await swapsApi.createRequest(selectedMySlot, selectedTheirSlot)
      setShowModal(false)
      setSelectedMySlot(null)
      setSelectedTheirSlot(null)
      loadSwappableSlots()
      loadUserSwappableEvents()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create swap request')
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Marketplace - Swappable Slots</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        {swappableSlots.map((slot) => (
          <div key={slot.id} className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{slot.title}</h5>
                <p className="card-text">
                  <strong>Owner:</strong> {slot.owner.name}<br />
                  <strong>Time:</strong> {new Date(slot.startTime).toLocaleString()}
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedTheirSlot(slot.id)
                    setShowModal(true)
                  }}
                >
                  Request Swap
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Select Your Slot</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {userSwappableEvents.length === 0 ? (
                  <p>You have no swappable events</p>
                ) : (
                  <div className="list-group">
                    {userSwappableEvents.map((event) => (
                      <button
                        key={event.id}
                        className={`list-group-item list-group-item-action ${selectedMySlot === event.id ? 'active' : ''}`}
                        onClick={() => setSelectedMySlot(event.id)}
                      >
                        {event.title} - {new Date(event.startTime).toLocaleString()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleRequestSwap}>Request Swap</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
