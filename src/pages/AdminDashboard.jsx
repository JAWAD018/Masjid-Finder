import React, { useState, useEffect } from 'react';
import { 
  Shield, Bell, Phone, Clock, CheckCircle, XCircle, User, Loader, AlertTriangle,
  Search, RefreshCw, X, Filter, ChevronDown, ChevronUp, MapPin,
  User2
} from 'lucide-react';

// Firestore imports
import { db } from '../firebase/config'; // Make sure your config exports `db`
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from 'firebase/firestore';

const AdminDashboard = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState(new Set());
  const [filter, setFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const unsubscribeRequests = loadRequests();
    loadNotifications();
    return () => unsubscribeRequests && unsubscribeRequests();
  }, []);

  // Load requests from Firestore
  const loadRequests = () => {
    setRefreshing(true);
    const q = query(collection(db, 'updateRequests'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, snapshot => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        processedAt: doc.data().processedAt?.toDate?.() || null
      }));
      setRequests(data);
      setRefreshing(false);
    }, error => {
      console.error('Error fetching requests:', error);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  // Load notifications (mocked, can be replaced with Firestore collection)
  const loadNotifications = async () => {
    try {
      const mockNotifications = [
        {
          id: '1',
          type: 'new_request',
          title: 'New Prayer Time Update Request',
          message: 'Masjid request received',
          read: false,
          createdAt: new Date()
        }
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  // Approve or reject a request
const handleRequestAction = async (requestId, action) => {
  setProcessingIds(prev => new Set([...prev, requestId]));

  try {
    // Find the request
    const request = requests.find(r => r.id === requestId);

    if (!request) throw new Error("Request not found");

    // Update admin request status
    const requestRef = doc(db, "updateRequests", requestId);
    await updateDoc(requestRef, {
      status: action,
      processedAt: new Date()
    });

    // If approved, also update prayer times in masjids collection
   if (action === "approved") {
  const masjidRef = doc(db, "masjids", request.masjidId);

  // Only update changed prayers individually
  const updates = {};
  Object.entries(request.requestedTimes).forEach(([prayer, newTime]) => {
    const oldTime = request.currentTimes?.[prayer];
    if (newTime !== oldTime) {
      updates[`prayerTimes.${prayer}`] = newTime;
    }
  });

  if (Object.keys(updates).length > 0) {
    // Add metadata
    updates.lastUpdated = new Date();
    updates.updatedBy = "admin";

    await updateDoc(masjidRef, updates);
  }
}


    // Update state locally
    const updatedRequests = requests.map(r => r.id === requestId ? { ...r, status: action, processedAt: new Date() } : r);
    setRequests(updatedRequests);

    alert(`${action === "approved" ? "Approved" : "Rejected"} request for ${request.masjidName}`);
  } catch (error) {
    console.error("Error processing request:", error);
    alert("Something went wrong! Check console.");
  } finally {
    setProcessingIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
  }
};
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'approved': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'rejected': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredRequests = requests
    .filter(r => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (searchQuery) {
        return r.masjidName.toLowerCase().includes(searchQuery.toLowerCase()) ||
               r.phoneNumber.includes(searchQuery) ||
               r.reason?.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length
  };

  const toggleExpand = (requestId) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
    } else {
      setExpandedRequest(requestId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 p-6 bg-white rounded-2xl shadow-sm border border-green-100">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-xl">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
              <p className="text-slate-500">Manage prayer time update requests</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-green-600" />
            </button>
            <button
              onClick={loadRequests}
              disabled={refreshing}
              className="px-4 py-2.5 bg-white border border-green-200 text-green-700 rounded-lg flex items-center gap-2 hover:bg-green-50 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <div className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4" />
              </div>
              <span>Admin User</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            { label: 'Total Requests', value: stats.total, color: 'green', icon: <Shield className="w-5 h-5" /> },
            { label: 'Pending', value: stats.pending, color: 'amber', icon: <Clock className="w-5 h-5" /> },
            { label: 'Approved', value: stats.approved, color: 'emerald', icon: <CheckCircle className="w-5 h-5" /> },
            { label: 'Rejected', value: stats.rejected, color: 'rose', icon: <XCircle className="w-5 h-5" /> }
          ].map(stat => (
            <div key={stat.label} className={`bg-white border border-green-100 rounded-2xl p-5 shadow-sm`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2 bg-${stat.color}-100 rounded-lg`}>
                  <div className={`text-${stat.color}-600`}>{stat.icon}</div>
                </div>
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              </div>
              <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search masjids, phone numbers, or reasons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
              >
                <Filter className="w-5 h-5" />
                <span className="hidden sm:inline">Filter</span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showFilters && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-green-100 z-10 p-2">
                  {['all', 'pending', 'approved', 'rejected'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilter(status)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm capitalize ${
                        filter === status ? 'bg-green-100 text-green-700' : 'hover:bg-green-50'
                      }`}
                    >
                      {status === 'all' ? 'All Requests' : status}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {filter !== 'all' && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-slate-500">Filtered by:</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-sm capitalize">{filter}</span>
              <button onClick={() => setFilter('all')} className="text-sm text-slate-500 hover:text-slate-700">Clear</button>
            </div>
          )}
        </div>

        {/* Requests */}
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-green-100 p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-700 mb-2">No requests found</h3>
              <p className="text-slate-500">
                {searchQuery || filter !== 'all' ? 'Try adjusting your search or filter criteria' : 'No prayer time update requests have been submitted yet'}
              </p>
            </div>
          ) : (
            filteredRequests.map(req => (
              <RequestCard
                key={req.id}
                request={req}
                onAction={handleRequestAction}
                isProcessing={processingIds.has(req.id)}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                onViewDetails={setSelectedRequest}
                isExpanded={expandedRequest === req.id}
                onToggleExpand={toggleExpand}
              />
            ))
          )}
        </div>

        {/* Modal */}
        {selectedRequest && (
          <RequestDetailsModal
            request={selectedRequest}
            onClose={() => setSelectedRequest(null)}
            onAction={handleRequestAction}
            isProcessing={processingIds.has(selectedRequest.id)}
            getStatusColor={getStatusColor}
          />
        )}
      </div>
    </div>
  );
};

// Time Ago Helper
const getTimeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  const intervals = [
    { label: 'year', secs: 31536000 },
    { label: 'month', secs: 2592000 },
    { label: 'day', secs: 86400 },
    { label: 'hour', secs: 3600 },
    { label: 'minute', secs: 60 },
    { label: 'second', secs: 1 }
  ];
  for (let i of intervals) {
    const count = Math.floor(seconds / i.secs);
    if (count >= 1) return `${count} ${i.label}${count > 1 ? 's' : ''} ago`;
  }
  return 'just now';
};

// RequestCard Component
const RequestCard = ({ request, onAction, isProcessing, getStatusColor, getStatusIcon, onViewDetails, isExpanded, onToggleExpand }) => {
  const timeAgo = getTimeAgo(request.createdAt);
  return (
    <div className="bg-white border border-green-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800">{request.masjidName}</h3>
              <div className="flex items-center gap-2 mt-1">
                <User2 className="w-4 h-4 text-green-400" /> 
                <p className="text-sm text-slate-500">{request.name}</p>
                </div>
              <div className="flex items-center gap-2 mt-1">
                <Phone className="w-4 h-4 text-green-400" />
                <p className="text-sm text-slate-500">{request.phoneNumber}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1">{timeAgo}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-700">{request.reason}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getStatusColor(request.status)}`}>
            {getStatusIcon(request.status)} {request.status}
          </span>
          <button 
            onClick={() => onToggleExpand(request.id)}
            className="p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-green-100">
        <h4 className="font-medium text-slate-700 mb-3">Updated Prayer Times</h4>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {Object.entries(request.requestedTimes).map(([prayer, newTime]) => {
        const oldTime = request.currentTimes?.[prayer];
        const isChanged = oldTime !== newTime;
        if (!isChanged) return null; // skip unchanged times
        return (
          <div key={prayer} className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs font-medium text-slate-500 capitalize mb-1">{prayer}</p>
            <p className="text-sm font-semibold text-emerald-700">{newTime}</p>
            <p className="text-xs text-slate-400 line-through">{oldTime}</p>
          </div>
        );
      })}
          </div>
          {request.status === 'pending' && (    
            <div className="flex gap-3 mt-5 pt-4 border-t border-green-100">
              <button
                onClick={() => onAction(request.id, 'rejected')}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-100 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Reject
              </button>
              <button
                onClick={() => onAction(request.id, 'approved')}
                disabled={isProcessing}
                className="flex-1 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Approve
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// RequestDetailsModal Component
const RequestDetailsModal = ({ request, onClose, onAction, isProcessing, getStatusColor }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-2xl shadow-lg max-w-2xl w-full p-6 relative border border-green-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-800 mb-4">{request.masjidName}</h2>
        <p className="text-sm text-slate-500 mb-4">{request.phoneNumber}</p>
        <div className="mb-4">
          <p className="text-sm text-slate-700">{request.reason}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
          {request.status}
        </span>
        {request.status === 'pending' && (
          <div className="flex gap-3 mt-5">
            <button
              onClick={() => onAction(request.id, 'rejected')}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg flex items-center justify-center gap-2 hover:bg-rose-100 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject
            </button>
            <button
              onClick={() => onAction(request.id, 'approved')}
              disabled={isProcessing}
              className="flex-1 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 disabled:opacity-50 transition-colors"
            >
              {isProcessing ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;