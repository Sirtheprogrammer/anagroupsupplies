import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { ShoppingCartIcon, HeartIcon } from '@heroicons/react/24/outline';

const GroupDetail = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const fetchGroup = useCallback(async () => {
    setLoading(true);
    try {
      const groupRef = doc(db, 'productGroups', groupId);
      const groupSnap = await getDoc(groupRef);
      if (!groupSnap.exists()) {
        toast.error('Group not found');
        navigate('/');
        return;
      }
      setGroup({ id: groupSnap.id, ...groupSnap.data() });

      // fetch variants that reference this group
      const q = query(collection(db, 'products'), where('groupId', '==', groupId));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // sort by createdAt if available
      items.sort((a,b) => (a.createdAt && b.createdAt) ? (a.createdAt > b.createdAt ? 1 : -1) : 0);
      setVariants(items);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Error fetching group:', err);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [groupId, navigate]);

  useEffect(() => { fetchGroup(); }, [fetchGroup]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!group) return null;

  const selected = variants[selectedIndex] || null;

  return (
    <div className="container-fluid py-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{group.name}</h1>
        <p className="text-sm text-gray-600 mb-6">{group.description}</p>

        <div className="mb-6">
          {selected ? (
            <img src={selected.image} alt={selected.name} className="w-full h-96 object-cover rounded-lg" />
          ) : (
            <div className="w-full h-96 bg-gray-100 rounded-lg" />
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="text-xl font-semibold">{selected ? selected.name : 'Variant'}</div>
          <div className="text-lg font-bold text-primary">TZS {selected ? parseFloat(selected.price).toLocaleString() : '-'}</div>
        </div>

        <div className="mb-6">
          <div className="overflow-x-auto flex gap-3 pb-2">
            {variants.map((v, idx) => (
              <button key={v.id} onClick={() => setSelectedIndex(idx)} className={`w-32 h-32 rounded-md overflow-hidden border ${idx===selectedIndex? 'border-primary ring-2 ring-primary':'border-gray-200'}`}>
                <img src={v.image} alt={v.name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button className="flex-1 bg-primary text-white py-3 rounded-lg flex items-center justify-center gap-2">
            <ShoppingCartIcon className="h-5 w-5" />
            Add Selected to Cart
          </button>
          <button className="flex-1 border border-primary text-primary py-3 rounded-lg flex items-center justify-center gap-2">
            <HeartIcon className="h-5 w-5" />
            Add Selected to Wishlist
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetail;
