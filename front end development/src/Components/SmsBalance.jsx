// Components/SmsBalance.jsx – Complete, fully connected
import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Plus,
  History,
  RefreshCw,
  DollarSign,
  CheckCircle,
  Clock,
  ShoppingCart,
  CreditCard,
  Phone,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Banknote,
  Loader2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

const SmsBalance = () => {
  const [balance, setBalance] = useState({
    balance: 0,
    totalUsed: 0,
    totalPurchased: 0,
    providerBalance: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('mobile_money');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [purchasing, setPurchasing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    fetchData();
    fetchBundles();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const balanceRes = await api.get('/sms/balance');
      const balanceData = balanceRes.data?.data || balanceRes.data || {};
      setBalance({
        balance: balanceData.balance || 0,
        totalUsed: balanceData.totalUsed || 0,
        totalPurchased: balanceData.totalPurchased || 0,
        providerBalance: balanceData.providerBalance || 0
      });

      const transactionsRes = await api.get('/sms/purchases');
      const transactionsData = transactionsRes.data?.data || transactionsRes.data || [];
      setTransactions(Array.isArray(transactionsData) ? transactionsData : []);
    } catch (error) {
      console.error('Error fetching balance data:', error);
      toast.error('Failed to load SMS balance');
      setBalance({ balance: 0, totalUsed: 0, totalPurchased: 0, providerBalance: 0 });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBundles = async () => {
    try {
      const response = await api.get('/sms/bundles');
      const bundlesData = response.data?.data || response.data || [];
      setBundles(Array.isArray(bundlesData) ? bundlesData : []);
      if (bundlesData.length > 0) setSelectedBundle(bundlesData[0]);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      const defaultBundles = [
        { id: 'bundle_500', name: '500 SMS', amount: 500, price: 31000 },
        { id: 'bundle_1000', name: '1000 SMS', amount: 1000, price: 62000 },
        { id: 'bundle_2000', name: '2000 SMS', amount: 2000, price: 124000 },
        { id: 'bundle_5000', name: '5000 SMS', amount: 5000, price: 310000 },
        { id: 'bundle_10000', name: '10000 SMS', amount: 10000, price: 620000 }
      ];
      setBundles(defaultBundles);
      setSelectedBundle(defaultBundles[0]);
    }
  };

  const handlePurchase = async () => {
    if (!selectedBundle) {
      toast.error('Please select a bundle');
      return;
    }
    if (paymentMethod === 'mobile_money' && !phoneNumber) {
      toast.error('Please enter your phone number');
      return;
    }

    setPurchasing(true);
    setPaymentStatus('processing');

    try {
      const response = await api.post('/sms/purchase/initiate', {
        bundleId: selectedBundle.id,
        paymentMethod,
        phoneNumber
      });

      const responseData = response.data?.data || response.data || {};
      const { transaction } = responseData;

      toast.success('Purchase initiated! Please complete payment.');
      setPaymentStatus('pending');

      // Simulate payment confirmation (for demo)
      setTimeout(async () => {
        try {
          const statusRes = await api.get(`/sms/purchase/status/${transaction.reference}`);
          const statusData = statusRes.data?.data || statusRes.data || {};
          if (statusData.status === 'completed') {
            setPaymentStatus('completed');
            toast.success('Payment successful! Credits added.');
            fetchData();
            setShowPurchaseModal(false);
            resetModal();
          } else {
            setPaymentStatus('failed');
            toast.error('Payment verification failed.');
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);

    } catch (error) {
      console.error('Error initiating purchase:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate purchase');
      setPaymentStatus('failed');
    } finally {
      setPurchasing(false);
    }
  };

  const resetModal = () => {
    setSelectedBundle(bundles[0] || null);
    setPaymentMethod('mobile_money');
    setPhoneNumber('');
    setPaymentStatus(null);
  };

  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('en-UG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProgressPercentage = () => {
    const used = balance.totalUsed || 0;
    const total = balance.totalPurchased || 1;
    return Math.min((used / total) * 100, 100);
  };

  const getProgressColor = () => {
    const percent = getProgressPercentage();
    if (percent > 90) return 'bg-red-500';
    if (percent > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-purple-600" size={28} />
            SMS Balance
          </h1>
          <p className="text-sm text-slate-500 mt-1">Manage your SMS credits and purchase new bundles</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {/* <button
            onClick={() => setShowPurchaseModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <ShoppingCart size={18} />
            Buy SMS
          </button> */}
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-6 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-purple-200 text-sm">Available SMS</p>
              <p className="text-3xl font-bold mt-1">{balance.balance || 0}</p>
            </div>
            <Wallet size={32} className="text-purple-300" />
          </div>
          {(balance.balance || 0) < 100 && (
            <div className="mt-3 flex items-center gap-2 bg-red-500/20 text-red-100 px-3 py-1.5 rounded-lg text-sm">
              <AlertCircle size={16} />
              Low balance! Purchase more credits.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Purchased</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{balance.totalPurchased || 0}</p>
            </div>
            <TrendingUp size={24} className="text-green-500" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Used</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{balance.totalUsed || 0}</p>
            </div>
            <TrendingDown size={24} className="text-blue-500" />
          </div>
        </div>
      </div>

      {/* Usage Progress */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="font-medium text-slate-700">Usage Overview</span>
          <span className="text-sm text-slate-500">
            {balance.totalUsed || 0} / {balance.totalPurchased || 0} SMS used
          </span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm text-slate-500">
          <span>0 SMS</span>
          <span className="font-medium text-slate-700">{balance.balance || 0} SMS remaining</span>
          <span>{balance.totalPurchased || 0} SMS total</span>
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white border border-slate-200 rounded-lg">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <History size={20} className="text-purple-600" />
            <h3 className="font-medium text-slate-700">Purchase History</h3>
            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
              Last {transactions.length} transactions
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="animate-spin text-purple-600" size={32} />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="mx-auto text-slate-300" size={48} />
            <p className="text-slate-500 mt-2">No purchases yet</p>
            <p className="text-sm text-slate-400">Purchase SMS credits to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Type</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Amount</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Cost</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Method</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.type === 'purchase' 
                          ? 'bg-green-100 text-green-600' 
                          : t.type === 'usage'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-orange-100 text-orange-600'
                      }`}>
                        {t.type?.toUpperCase() || 'PURCHASE'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{t.amount || 0} SMS</td>
                    <td className="px-4 py-3">UGX {(t.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">
                      {t.paymentMethod?.replace('_', ' ').toUpperCase() || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        t.status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : t.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {t.status?.toUpperCase() || 'COMPLETED'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-purple-600" size={24} />
                <h2 className="text-xl font-bold text-slate-800">Buy SMS Credits</h2>
              </div>
              <button
                onClick={() => { setShowPurchaseModal(false); resetModal(); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Payment Status Messages */}
            {paymentStatus === 'processing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="animate-spin" size={20} />
                  <span>Processing payment...</span>
                </div>
              </div>
            )}

            {paymentStatus === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Clock size={20} />
                  <span>Waiting for confirmation...</span>
                </div>
              </div>
            )}

            {paymentStatus === 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={20} />
                  <span>Payment successful! Credits added.</span>
                </div>
              </div>
            )}

            {paymentStatus === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle size={20} />
                  <span>Payment failed. Please try again.</span>
                </div>
              </div>
            )}

            {/* Show only if not completed or no status */}
            {(!paymentStatus || paymentStatus === 'failed') && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Bundle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {bundles.map((bundle) => (
                      <button
                        key={bundle.id}
                        onClick={() => setSelectedBundle(bundle)}
                        className={`p-3 rounded-lg border-2 transition ${
                          selectedBundle?.id === bundle.id
                            ? 'border-purple-600 bg-purple-50 text-purple-600'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="font-bold">{bundle.amount} SMS</div>
                        <div className="text-sm">UGX {bundle.price?.toLocaleString() || 0}</div>
                        <div className="text-xs text-slate-400">
                          UGX {bundle.price && bundle.amount ? Math.round(bundle.price / bundle.amount) : 0}/SMS
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('mobile_money')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                        paymentMethod === 'mobile_money'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Smartphone size={20} />
                      <span className="text-xs">Mobile Money</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('bank')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                        paymentMethod === 'bank'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <CreditCard size={20} />
                      <span className="text-xs">Bank</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition ${
                        paymentMethod === 'cash'
                          ? 'border-purple-600 bg-purple-50 text-purple-600'
                          : 'border-slate-200 hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <Banknote size={20} />
                      <span className="text-xs">Cash</span>
                    </button>
                  </div>
                </div>

                {paymentMethod === 'mobile_money' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., 0772123456"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      You will receive a payment prompt on this number
                    </p>
                  </div>
                )}

                {selectedBundle && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Bundle:</span>
                      <span className="font-bold">{selectedBundle.amount} SMS</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Price:</span>
                      <span>UGX {selectedBundle.price?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-600">Cost per SMS:</span>
                      <span>UGX {selectedBundle.price && selectedBundle.amount ? Math.round(selectedBundle.price / selectedBundle.amount) : 0}</span>
                    </div>
                    <div className="border-t border-slate-200 my-2" />
                    <div className="flex justify-between py-1">
                      <span className="font-bold text-slate-700">Total:</span>
                      <span className="font-bold text-green-600 text-lg">
                        UGX {selectedBundle.price?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handlePurchase}
                    disabled={purchasing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {purchasing ? (
                      <RefreshCw className="animate-spin" size={18} />
                    ) : (
                      <ShoppingCart size={18} />
                    )}
                    {purchasing ? 'Processing...' : 'Buy Now'}
                  </button>
                  <button
                    onClick={() => { setShowPurchaseModal(false); resetModal(); }}
                    className="px-4 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* If payment completed, show close button */}
            {paymentStatus === 'completed' && (
              <button
                onClick={() => { setShowPurchaseModal(false); resetModal(); }}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SmsBalance;