import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminPickupDeliveryPage } from './AdminPickupDeliveryPage';
import { AdminUsersPage } from './AdminUsersPage';
import { AdminServicesPage } from './AdminServicesPage';
import { AdminContentPage } from './AdminContentPage';
import { AdminSettingsPage } from './AdminSettingsPage';
import { AdminNotificationsPage } from './AdminNotificationsPage';
import { AdminDeliveryReportsPage } from './AdminDeliveryReportsPage';
import { AdminHelpSupportPage } from './AdminHelpSupportPage';

import { CreateOrderDrawer } from '../../components/admin/CreateOrderDrawer';
import { AddUserModal } from '../../components/admin/AddUserModal';
import { AddCustomerModal } from '../../components/admin/AddCustomerModal';
import { AddServiceModal } from '../../components/admin/AddServiceModal';
import { ManageServicesModal } from '../../components/admin/ManageServicesModal';
import { AssignOrderModal } from '../../components/admin/AssignOrderModal';
import { SupportTicketDrawer } from '../../components/admin/SupportTicketDrawer';

export const AdminPortal = () => {
  const { adminTab, isAdminAuthenticated } = useAdmin();

  if (!isAdminAuthenticated || adminTab === 'login') {
    return <AdminLoginPage />;
  }

  const renderAdminPage = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboardPage />;
      case 'orders':
        return <AdminOrdersPage />;
      case 'pickup-delivery':
        return <AdminPickupDeliveryPage />;
      case 'users':
      case 'customers':
      case 'staff':
      case 'delivery-users':
      case 'delivery':
        return <AdminUsersPage />;
      case 'services':
        return <AdminServicesPage />;
      case 'notifications':
        return <AdminNotificationsPage />;
      case 'content':
        return <AdminContentPage />;
      case 'settings':
      case 'my-profile':
      case 'profile':
        return <AdminSettingsPage />;
      case 'delivery-reports':
      case 'complaints':
      case 'complaint-reports':
      case 'reports':
        return <AdminDeliveryReportsPage />;
      case 'help-support':
        return <AdminHelpSupportPage />;
      default:
        return <AdminDashboardPage />;
    }
  };

  return (
    <AdminLayout>
      {renderAdminPage()}

      {/* Global Admin Drawers and Modals */}
      <CreateOrderDrawer />
      <AddCustomerModal />
      <AddServiceModal />
      <ManageServicesModal />
      <AssignOrderModal />
      <SupportTicketDrawer />
    </AdminLayout>
  );
};

