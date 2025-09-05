import { Routes, Route } from 'react-router-dom';
import AdminPanel from './AdminPanel';
import AdminProducts from './AdminProducts';
import AdminUsers from './AdminUsers';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminPanel />} />
      <Route path="/products" element={<AdminProducts />} />
      <Route path="/products/add" element={<AddProduct />} />
      <Route path="/products/edit/:id" element={<EditProduct />} />
      <Route path="/users" element={<AdminUsers />} />
    </Routes>
  );
};

export default AdminRoutes;