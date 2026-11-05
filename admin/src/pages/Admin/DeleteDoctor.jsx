import { useContext, useEffect, useState } from 'react'
import { AdminContext } from '../../context/AdminContext'
import { AiFillDelete } from 'react-icons/ai'
import { FiSearch, FiX, FiAlertTriangle } from 'react-icons/fi'
import { MdOutlineMedicalServices } from 'react-icons/md'
import axios from 'axios'
import { toast } from 'react-toastify'

export default function DeleteDoctor() {
  // ── pull everything straight from your AdminContext ──
  const {
    backendUrl,
    aToken,
    doctors,
    getAllDoctors,
    appointments,
    getAllAppointments,
  } = useContext(AdminContext)

  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading]       = useState(false)

  // doctors + appointments are already loaded by AdminContext on login
  // but refresh if they're empty (e.g. direct page navigation)
  useEffect(() => {
    if (doctors.length === 0) getAllDoctors()
    if (appointments.length === 0) getAllAppointments()
  }, [])

  // ── helpers ──
  const getDocAppointments = (docId) =>
    appointments.filter(a =>
      String(a.doc_id) === String(docId) ||
      String(a.docId)  === String(docId)
    )

  const filtered = doctors.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.speciality.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (doc) => {
    setSelected(doc)
    setShowConfirm(false)
  }

  // ── delete calls your backend, then refreshes context lists ──
  const handleDelete = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/delete-doctor',
        { docId: selected.id },
        { headers: { aToken } }
      )
      if (data.success) {
        toast.success(`Dr. ${selected.name} deleted successfully`)
        // refresh both lists in context so rest of admin panel stays in sync
        await getAllDoctors()
        await getAllAppointments()
        setSelected(null)
        setShowConfirm(false)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Delete failed. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── appointment breakdown for selected doctor ──
  const docAppts      = selected ? getDocAppointments(selected.id) : []
  const activeAppts    = docAppts.filter(a => !a.cancelled && !a.is_completed)
  const completedAppts = docAppts.filter(a => a.is_completed)
  const cancelledAppts = docAppts.filter(a => a.cancelled)

  return (
    <div className="m-5">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <AiFillDelete className="text-red-500 w-6 h-6" />
        <h1 className="text-lg font-semibold text-gray-700">Delete Doctor</h1>
        <span className="text-sm text-gray-400">({doctors.length} total)</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── LEFT: doctor list ── */}
        <div className="flex-1">

          {/* Search */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or speciality..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-red-300"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-xs text-gray-400 mb-3">
            {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
          </p>

          {/* No results */}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <MdOutlineMedicalServices className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No doctors found</p>
            </div>
          )}

          {/* Cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filtered.map(doc => {
              const apptCount = getDocAppointments(doc.id).length
              const isSelected = selected?.id === doc.id

              return (
                <div
                  key={doc.id}
                  onClick={() => handleSelect(doc)}
                  className={`border rounded-xl p-4 cursor-pointer transition-all
                    ${isSelected
                      ? 'border-red-400 bg-red-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={doc.image}
                        alt={doc.name}
                        onError={e => { e.target.src = '/placeholder.png' }}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white
                        ${doc.available ? 'bg-green-400' : 'bg-gray-300'}`}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.speciality}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{doc.degree} · {doc.experience}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">${doc.fees}/visit</span>
                    <div className="flex items-center gap-2">
                      {apptCount > 0 && (
                        <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full">
                          {apptCount} appt{apptCount !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full
                        ${doc.available
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {doc.available ? 'Available' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT: detail + confirm panel ── */}
        <div className="lg:w-80 xl:w-96">
          {!selected ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-10 text-center">
              <AiFillDelete className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                Select a doctor from the list to view their details and delete them
              </p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white sticky top-5">

              {/* Doctor header */}
              <div className="bg-red-50 p-5 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <img
                    src={selected.image}
                    alt={selected.name}
                    onError={e => { e.target.src = '/placeholder.png' }}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div>
                    <p className="font-semibold text-gray-800">{selected.name}</p>
                    <p className="text-sm text-gray-500">{selected.speciality}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{selected.degree}</p>
                  </div>
                </div>
              </div>

              {/* Doctor details */}
              <div className="p-4 space-y-2.5 border-b border-gray-100">
                <DetailRow label="Experience"  value={selected.experience} />
                <DetailRow label="Fees"        value={`$${selected.fees} per visit`} />
                <DetailRow label="Status"      value={selected.available ? 'Available' : 'Not available'} />
                <DetailRow
                  label="Address"
                  value={
                    [selected.address?.line1, selected.address?.line2]
                      .filter(Boolean).join(', ') || '—'
                  }
                />
              </div>

              {/* Appointments summary */}
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Appointments to be deleted
                </p>
                {docAppts.length === 0 ? (
                  <p className="text-sm text-gray-400">No appointments on record</p>
                ) : (
                  <div className="space-y-2">
                    <ApptStat label="Active"    count={activeAppts.length}    color="amber" />
                    <ApptStat label="Completed" count={completedAppts.length} color="green" />
                    <ApptStat label="Cancelled" count={cancelledAppts.length} color="gray"  />
                    <div className="pt-2 mt-1 border-t border-gray-100 flex justify-between text-sm font-medium">
                      <span className="text-gray-500">Total</span>
                      <span className="text-gray-800">{docAppts.length}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Delete action */}
              <div className="p-4 space-y-2">
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
                  >
                    <AiFillDelete className="w-4 h-4" />
                    Delete Dr. {selected.name.split(' ').slice(-1)[0]}
                  </button>
                ) : (
                  <div className="space-y-3">
                    {/* Warning */}
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                      <FiAlertTriangle className="text-red-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-red-700 leading-relaxed">
                        This will permanently delete <strong>{selected.name}</strong> and their{' '}
                        <strong>{docAppts.length} appointment{docAppts.length !== 1 ? 's' : ''}</strong>.
                        This cannot be undone.
                      </p>
                    </div>

                    {/* Confirm / Cancel */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <AiFillDelete className="w-4 h-4" />
                            Confirm delete
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        disabled={loading}
                        className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm py-2.5 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => { setSelected(null); setShowConfirm(false) }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 py-1 transition-colors"
                >
                  Clear selection
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-start text-sm gap-4">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-700 font-medium text-right">{value}</span>
    </div>
  )
}

function ApptStat({ label, count, color }) {
  const colors = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    gray:  'bg-gray-100 text-gray-500',
  }
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colors[color]}`}>
        {count}
      </span>
    </div>
  )
}
