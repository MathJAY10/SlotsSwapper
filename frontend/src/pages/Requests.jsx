import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { swapsApi } from '../services/api'

export default function Requests() {
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [error, setError] = useState('')
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
    loadRequests()
  }, [user, navigate])

  const loadRequests = async () => {
    try {
      const { data } = await swapsApi.getRequests()
      setIncoming(data.incoming)
      setOutgoing(data.outgoing)
    } catch (err) {
      setError('Failed to load requests')
    }
  }

  const handleResponse = async (requestId, accept) => {
    try {
      await swapsApi.respondToRequest(requestId, accept)
      loadRequests()
    } catch (err) {
      setError('Failed to respond to request')
    }
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Swap Requests</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row">
        <div className="col-md-6">
          <h4>Incoming Requests</h4>
          {incoming.length === 0 ? (
            <p>No incoming requests</p>
          ) : (
            <div className="list-group">
              {incoming.map((req) => (
                <div key={req.id} className="list-group-item">
                  <h6>{req.requester.name} wants to swap</h6>
                  <p className="mb-2">
                    <strong>Their slot:</strong> {req.mySlot.title}<br />
                    <strong>Your slot:</strong> {req.theirSlot.title}
                  </p>
                  <span className={`badge ${req.status === 'PENDING' ? 'bg-warning' : req.status === 'ACCEPTED' ? 'bg-success' : 'bg-danger'}`}>
                    {req.status}
                  </span>
                  {req.status === 'PENDING' && (
                    <div className="mt-2">
                      <button className="btn btn-sm btn-success me-2" onClick={() => handleResponse(req.id, true)}>Accept</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleResponse(req.id, false)}>Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-md-6">
          <h4>Outgoing Requests</h4>
          {outgoing.length === 0 ? (
            <p>No outgoing requests</p>
          ) : (
            <div className="list-group">
              {outgoing.map((req) => (
                <div key={req.id} className="list-group-item">
                  <h6>To {req.responder.name}</h6>
                  <p className="mb-2">
                    <strong>Your slot:</strong> {req.mySlot.title}<br />
                    <strong>Their slot:</strong> {req.theirSlot.title}
                  </p>
                  <span className={`badge ${req.status === 'PENDING' ? 'bg-warning' : req.status === 'ACCEPTED' ? 'bg-success' : 'bg-danger'}`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
