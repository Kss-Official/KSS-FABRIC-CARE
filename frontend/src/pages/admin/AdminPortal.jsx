import React from 'react';
import { useAdmin } from '../../context/AdminContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminDashboardPage } from './AdminDashboardPage';
import { AdminOrdersPage } from './AdminOrdersPage';
import { AdminPickupDeliveryPage } from './AdminPickupDeliveryPage';
import { AdminCustomersPage } from './AdminCustomersPage';
import { AdminServicesPage } from './AdminServicesPage';
import { AdminContentPage } from './AdminContentPage';
import { AdminSettingsPage } from './AdminSettingsPage';
import { AdminNotificationsPage } from './AdminNotificationsPage';
import { AdminDeliveryReportsPage } from './AdminDeliveryReportsPage';
import { AdminHelpSupportPage } from './AdminHelpSupportPage';

import { CreateOrderDrawer } from '../../components/admin/CreateOrderDrawer';
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
      case 'customers':
        return <AdminCustomersPage />;
      case 'services':
        return <AdminServicesPage />;
      case 'notifications':
        return <AdminNotificationsPage />;
      case 'content':
        return <AdminContentPage />;
      case 'settings':
        return <AdminSettingsPage />;
      case 'delivery-reports':
      case 'complaints':
      case 'complaint-reports':
      case 'reports':
        return <AdminDeliveryReportsPage />;
      case 'help-support':
        return <AdminHelpSupportPage />;
      default:
        return <AdminDeliveryReportsPage />;
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

