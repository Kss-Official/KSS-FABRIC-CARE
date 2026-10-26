import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAdmin } from '../../context/AdminContext';
import { EditUserProfileModal } from '../../components/admin/EditUserProfileModal';
import { 
  Users, 
  UserCheck, 
  Clock, 
  Star, 
  Plus, 
  Search, 
  ChevronDown, 
  RotateCcw,
  Calendar,
  MoreHorizontal, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Eye,
  Edit,
  Trash2,
  Briefcase,
  Truck,
  ShieldCheck,
  CheckCircle2,
  PauseCircle,
  X
} from 'lucide-react';
import { filterMatchesDate } from '../../utils/dateFilterUtils';

// Baseline Customers matching existing system
const BASELINE_CUSTOMERS = [
  {
    id: '#CUS1028',
    uid: 'cus_1028',
    role: 'customer',
    name: 'Rohan',
    fullName: 'Rohan Mehta',
    phone: '+91 98765 43210',
    email: 'rohan.mehta@gmail.com',
    avatar: 'RM',
    avatarBg: '#CFFAFE',
    avatarColor: '#0284C7',
    location: 'Banaswadi, Bengaluru 560043',
    area: 'Banaswadi',
    totalOrders: 12,
    totalSpent: '₹3,240',
    status: 'Active',
    joinDate: '12 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1027',
    uid: 'cus_1027',
    role: 'customer',
    name: 'Priya',
    fullName: 'Priya Sharma',
    phone: '+91 99876 54321',
    email: 'priya.sharma@gmail.com',
    avatar: 'PS',
    avatarBg: '#EDE9FE',
    avatarColor: '#7C3AED',
    location: 'HRBR Layout, Bengaluru 560043',
    area: 'HRBR Layout',
    totalOrders: 18,
    totalSpent: '₹5,680',
    status: 'Active',
    joinDate: '05 Aug 2026',
    joinRelative: '2 months ago'
  },
  {
    id: '#CUS1026',
    uid: 'cus_1026',
    role: 'customer',
    name: 'Arjun Nair',
    fullName: 'Arjun Nair',
    phone: '+91 91234 56789',
    email: 'arjun.nair@gmail.com',
    avatar: 'AN',
    avatarBg: '#CCFBF1',
    avatarColor: '#0D9488',
    location: 'Indiranagar, Bengaluru 560038',
    area: 'Indiranagar',
    totalOrders: 9,
    totalSpent: '₹2,910',
    status: 'Active',
    joinDate: '28 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1025',
    uid: 'cus_1025',
    role: 'customer',
    name: 'Sneha',
    fullName: 'Sneha Reddy',
    phone: '+91 99887 66554',
    email: 'sneha.reddy@gmail.com',
    avatar: 'SR',
    avatarBg: '#FCE7F3',
    avatarColor: '#DB2777',
    location: 'Whitefield, Bengaluru 560066',
    area: 'Whitefield',
    totalOrders: 15,
    totalSpent: '₹4,120',
    status: 'Active',
    joinDate: '20 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#CUS1024',
    uid: 'cus_1024',
    role: 'customer',
    name: 'Karan Verma',
    fullName: 'Karan Verma',
    phone: '+91 98712 34567',
    email: 'karan.verma@gmail.com',
    avatar: 'KV',
    avatarBg: '#FEF3C7',
    avatarColor: '#D97706',
    location: 'Marathahalli, Bengaluru 560037',
    area: 'Marathahalli',
    totalOrders: 7,
    totalSpent: '₹1,980',
    status: 'Inactive',
    joinDate: '15 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1023',
    uid: 'cus_1023',
    role: 'customer',
    name: 'Neha Kapoor',
    fullName: 'Neha Kapoor',
    phone: '+91 87654 32109',
    email: 'neha.kapoor@gmail.com',
    avatar: 'NK',
    avatarBg: '#CFFAFE',
    avatarColor: '#0284C7',
    location: 'HSR Layout, Bengaluru 560102',
    area: 'HSR Layout',
    totalOrders: 21,
    totalSpent: '₹6,450',
    status: 'Active',
    joinDate: '10 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1022',
    uid: 'cus_1022',
    role: 'customer',
    name: 'Amit Shah',
    fullName: 'Amit Shah',
    phone: '+91 91234 99876',
    email: 'amit.shah@gmail.com',
    avatar: 'AM',
    avatarBg: '#F3E8FF',
    avatarColor: '#9333EA',
    location: 'Koramangala, Bengaluru 560034',
    area: 'Koramangala',
    totalOrders: 11,
    totalSpent: '₹3,150',
    status: 'Active',
    joinDate: '02 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#CUS1021',
    uid: 'cus_1021',
    role: 'customer',
    name: 'Deepak Reddy',
    fullName: 'Deepak Reddy',
    phone: '+91 99876 23451',
    email: 'deepak.reddy@gmail.com',
    avatar: 'DP',
    avatarBg: '#E0E7FF',
    avatarColor: '#4338CA',
    location: 'Jayanagar, Bengaluru 560011',
    area: 'Jayanagar',
    totalOrders: 8,
    totalSpent: '₹2,400',
    status: 'Active',
    joinDate: '25 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#CUS1020',
    uid: 'cus_1020',
    role: 'customer',
    name: 'Kavya T',
    fullName: 'Kavya T',
    phone: '+91 93456 78912',
    email: 'kavya.t@gmail.com',
    avatar: 'KT',
    avatarBg: '#FEF08A',
    avatarColor: '#A16207',
    location: 'Malleshwaram, Bengaluru 560003',
    area: 'Malleshwaram',
    totalOrders: 14,
    totalSpent: '₹3,890',
    status: 'Active',
    joinDate: '18 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#CUS1019',
    uid: 'cus_1019',
    role: 'customer',
    name: 'Pavan Kumar',
    fullName: 'Pavan Kumar',
    phone: '+91 98765 12345',
    email: 'pavan.kumar@gmail.com',
    avatar: 'PK',
    avatarBg: '#E0F2FE',
    avatarColor: '#0369A1',
    location: 'Hebbal, Bengaluru 560024',
    area: 'Hebbal',
    totalOrders: 16,
    totalSpent: '₹4,300',
    status: 'Active',
    joinDate: '10 May 2026',
    joinRelative: '5 months ago'
  }
];

// Baseline Staff members matching laundry operation roles
const BASELINE_STAFF = [
  {
    id: '#STF201',
    uid: 'usr_staff_001',
    role: 'staff',
    name: 'Anil Verma',
    fullName: 'Anil Verma',
    phone: '+91 98222 33344',
    email: 'staff@fabricare.com',
    avatar: 'AV',
    avatarBg: '#EDE9FE',
    avatarColor: '#6D28D9',
    department: 'Laundry Operations',
    shift: 'Morning (8 AM - 4 PM)',
    ordersHandled: 142,
    status: 'Active',
    joinDate: '10 Apr 2026',
    joinRelative: '6 months ago'
  },
  {
    id: '#STF202',
    uid: 'usr_staff_002',
    role: 'staff',
    name: 'Anita Sharma',
    fullName: 'Anita Sharma',
    phone: '+91 98333 44455',
    email: 'anita.sharma@fabricare.com',
    avatar: 'AS',
    avatarBg: '#FCE7F3',
    avatarColor: '#BE185D',
    department: 'Quality Inspection & Intake',
    shift: 'Morning (8 AM - 4 PM)',
    ordersHandled: 198,
    status: 'Active',
    joinDate: '01 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#STF203',
    uid: 'usr_staff_003',
    role: 'staff',
    name: 'Suresh Kumar',
    fullName: 'Suresh Kumar',
    phone: '+91 98444 55566',
    email: 'suresh.k@fabricare.com',
    avatar: 'SK',
    avatarBg: '#CCFBF1',
    avatarColor: '#0F766E',
    department: 'Dry Cleaning Hub',
    shift: 'Evening (4 PM - 12 AM)',
    ordersHandled: 115,
    status: 'Active',
    joinDate: '15 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#STF204',
    uid: 'usr_staff_004',
    role: 'staff',
    name: 'Rajesh Patel',
    fullName: 'Rajesh Patel',
    phone: '+91 98555 66677',
    email: 'rajesh.patel@fabricare.com',
    avatar: 'RP',
    avatarBg: '#FEF3C7',
    avatarColor: '#B45309',
    department: 'Steam Ironing & Pressing',
    shift: 'Evening (4 PM - 12 AM)',
    ordersHandled: 89,
    status: 'Active',
    joinDate: '01 Jul 2026',
    joinRelative: '3 months ago'
  },
  {
    id: '#STF205',
    uid: 'usr_staff_005',
    role: 'staff',
    name: 'Pooja Mehra',
    fullName: 'Pooja Mehra',
    phone: '+91 98666 77788',
    email: 'pooja.m@fabricare.com',
    avatar: 'PM',
    avatarBg: '#E0E7FF',
    avatarColor: '#4338CA',
    department: 'Packaging & Dispatch',
    shift: 'Morning (8 AM - 4 PM)',
    ordersHandled: 74,
    status: 'Inactive',
    joinDate: '12 Jul 2026',
    joinRelative: '3 months ago'
  }
];

// Baseline Delivery Personnel
const BASELINE_DELIVERY = [
  {
    id: '#DEL301',
    uid: 'usr_agent_001',
    role: 'agent',
    name: 'Ravi Sharma',
    fullName: 'Ravi Sharma',
    phone: '+91 98111 22233',
    email: 'delivery@fabricare.com',
    avatar: 'RS',
    avatarBg: '#E6F7F7',
    avatarColor: '#0D7A75',
    vehicleType: 'Two-Wheeler',
    vehicleNumber: 'MP 07 AB 1234',
    assignedArea: 'Banaswadi & HRBR Layout',
    tasksCompleted: 156,
    status: 'Active',
    dutyStatus: 'On Duty',
    joinDate: '01 Mar 2026',
    joinRelative: '7 months ago'
  },
  {
    id: '#DEL302',
    uid: 'usr_agent_002',
    role: 'agent',
    name: 'Vikram Singh',
    fullName: 'Vikram Singh',
    phone: '+91 98777 88899',
    email: 'vikram.s@fabricare.com',
    avatar: 'VS',
    avatarBg: '#CFFAFE',
    avatarColor: '#0284C7',
    vehicleType: 'Two-Wheeler',
    vehicleNumber: 'KA 03 EF 5678',
    assignedArea: 'Indiranagar & Domlur',
    tasksCompleted: 210,
    status: 'Active',
    dutyStatus: 'On Duty',
    joinDate: '15 Apr 2026',
    joinRelative: '6 months ago'
  },
  {
    id: '#DEL303',
    uid: 'usr_agent_003',
    role: 'agent',
    name: 'Manoj Kumar',
    fullName: 'Manoj Kumar',
    phone: '+91 98888 99900',
    email: 'manoj.k@fabricare.com',
    avatar: 'MK',
    avatarBg: '#EDE9FE',
    avatarColor: '#7C3AED',
    vehicleType: 'Three-Wheeler',
    vehicleNumber: 'KA 04 GH 9012',
    assignedArea: 'Whitefield & Marathahalli',
    tasksCompleted: 184,
    status: 'Active',
    dutyStatus: 'On Duty',
    joinDate: '20 May 2026',
    joinRelative: '5 months ago'
  },
  {
    id: '#DEL304',
    uid: 'usr_agent_004',
    role: 'agent',
    name: 'Deepak Verma',
    fullName: 'Deepak Verma',
    phone: '+91 98999 00011',
    email: 'deepak.v@fabricare.com',
    avatar: 'DV',
    avatarBg: '#FEE2E2',
    avatarColor: '#DC2626',
    vehicleType: 'Two-Wheeler',
    vehicleNumber: 'KA 05 IJ 3456',
    assignedArea: 'Koramangala & HSR',
    tasksCompleted: 68,
    status: 'Inactive',
    dutyStatus: 'Offline',
    joinDate: '10 Jun 2026',
    joinRelative: '4 months ago'
  },
  {
    id: '#DEL305',
    uid: 'usr_agent_005',
    role: 'agent',
    name: 'Sunil Gowda',
    fullName: 'Sunil Gowda',
    phone: '+91 98123 45678',
    email: 'sunil.g@fabricare.com',
    avatar: 'SG',
    avatarBg: '#FEF3C7',
    avatarColor: '#D97706',
    vehicleType: 'Van',
    vehicleNumber: 'KA 01 KL 7890',
    assignedArea: 'Central Bengaluru Hub',
    tasksCompleted: 245,
    status: 'Active',
    dutyStatus: 'On Duty',
    joinDate: '01 Feb 2026',
    joinRelative: '8 months ago'
  }
];

export const AdminUsersPage = () => {
  const { 
    allUsers: contextAllUsers = [], 
    deletedUserKeys: contextDeletedUserKeys = [],
    orders: contextOrders = [], 
    setIsAddUserModalOpen = () => {},
    updateUser = async () => {},
    deleteUser = async () => {},
    toggleUserStatus = async () => {},
    refreshUsers = async () => {}
  } = useAdmin() || {};

  // Refresh State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState(null);

  const handleRefreshUsers = async () => {
    if (isRefreshing) return;
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      try {
        const stored = localStorage.getItem('fabricare_deleted_users');
        if (stored) {
          const parsed = JSON.parse(stored);
          setDeletedUserIds(prev => Array.from(new Set([...prev, ...parsed])));
        }
      } catch (_) {}
      if (refreshUsers) {
        await refreshUsers();
      }
    } catch (err) {
      console.error('Failed to refresh users:', err);
      setRefreshError('Failed to refresh user data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Active User View / Tab ('all' | 'customers' | 'staff' | 'delivery')
  const [activeTab, setActiveTab] = useState('all');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [isJoinDateDropdownOpen, setIsJoinDateDropdownOpen] = useState(false);

  // Selection & Actions
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Track permanently deleted user IDs across sessions, baseline seeds, and page refreshes
  const [deletedUserIds, setDeletedUserIds] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('fabricare_deleted_users');
        return stored ? JSON.parse(stored) : [];
      }
    } catch (_) {}
    return [];
  });

  // Sync deleted user keys from realtime DB context
  useEffect(() => {
    if (contextDeletedUserKeys && contextDeletedUserKeys.length > 0) {
      setDeletedUserIds(prev => {
        const merged = Array.from(new Set([...prev, ...contextDeletedUserKeys]));
        try {
          localStorage.setItem('fabricare_deleted_users', JSON.stringify(merged));
        } catch (_) {}
        return merged;
      });
    }
  }, [contextDeletedUserKeys]);

  // Robust check to determine if any user record was marked deleted
  const isUserDeleted = useCallback((u) => {
    if (!u) return false;
    const id = u.id ? String(u.id).toLowerCase().trim() : '';
    const idNoHash = id.replace(/^#/, '');
    const uid = u.uid ? String(u.uid).toLowerCase().trim() : '';
    const email = u.email ? String(u.email).toLowerCase().trim() : '';
    const phone = u.phone ? String(u.phone).replace(/\s+/g, '') : '';
    const name = (u.fullName || u.name) ? String(u.fullName || u.name).toLowerCase().trim() : '';

    return deletedUserIds.some(deleted => {
      const d = String(deleted || '').toLowerCase().trim();
      if (!d) return false;
      const dNoHash = d.replace(/^#/, '');
      const dSanitized = d.replace(/[.#$[\]/]/g, '_');
      return (
        d === id ||
        d === idNoHash ||
        dNoHash === id ||
        dNoHash === idNoHash ||
        d === uid ||
        dSanitized === uid ||
        (email && d === email) ||
        (phone && (d === phone || d.replace(/\s+/g, '') === phone)) ||
        (name && d === name)
      );
    });
  }, [deletedUserIds]);

  // Ref for detecting clicks outside the action popover
  const popoverRef = useRef(null);

  // Close action popover and join date dropdown on outside click or Escape
  useEffect(() => {
    if (!activeMenuId && !isJoinDateDropdownOpen) return;
    const handleOutsideClick = (e) => {
      if (activeMenuId && !e.target.closest('.action-menu-anchor')) {
        setActiveMenuId(null);
      }
      if (isJoinDateDropdownOpen && !e.target.closest('.filter-dropdown-pill-wrapper')) {
        setIsJoinDateDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveMenuId(null);
        setIsJoinDateDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId, isJoinDateDropdownOpen]);

  // View Details Modal State
  const [viewingUser, setViewingUser] = useState(null);

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    role: 'customer',
    location: '',
    department: '',
    shift: '',
    vehicleType: '',
    vehicleNumber: '',
    status: 'Active'
  });

  // Calculate live user stats and merge RTDB records cleanly
  const mergedUsers = useMemo(() => {
    const userMap = new Map();

    // 1. Seed baseline records (excluding any deleted records)
    BASELINE_CUSTOMERS.forEach(c => {
      if (!isUserDeleted(c)) userMap.set(c.id, { ...c });
    });
    BASELINE_STAFF.forEach(s => {
      if (!isUserDeleted(s)) userMap.set(s.id, { ...s });
    });
    BASELINE_DELIVERY.forEach(d => {
      if (!isUserDeleted(d)) userMap.set(d.id, { ...d });
    });

    // 2. Merge live database users from contextAllUsers
    if (contextAllUsers && contextAllUsers.length > 0) {
      contextAllUsers.forEach((u) => {
        if (isUserDeleted(u)) return;
        const emailLower = (u.email || '').toLowerCase().trim();
        const role = u.role || 'customer';
        const isDelivery = role === 'agent' || role === 'delivery';
        const isStaff = role === 'staff' || role === 'laundry_staff';

        // Check if user already exists in map by email or uid
        let matchedKey = null;
        for (const [k, existing] of userMap.entries()) {
          if ((existing.email && existing.email.toLowerCase() === emailLower) || existing.uid === u.id || existing.uid === u.uid) {
            matchedKey = k;
            break;
          }
        }

        const effectiveRole = isStaff ? 'staff' : (isDelivery ? 'agent' : 'customer');
        const defaultCode = isStaff ? `#STF${(u.id || '').substring(0, 4)}` : (isDelivery ? `#DEL${(u.id || '').substring(0, 4)}` : `#CUS${(u.id || '').substring(0, 4)}`);

        const formatted = {
          id: matchedKey || defaultCode,
          uid: u.uid || u.id,
          role: effectiveRole,
          name: u.name || 'User',
          fullName: u.name || 'User',
          phone: u.phone || '+91 98000 00000',
          email: u.email || '',
          avatar: (u.name || 'US').substring(0, 2).toUpperCase(),
          avatarBg: effectiveRole === 'staff' ? '#EDE9FE' : (effectiveRole === 'agent' ? '#E6F7F7' : '#CFFAFE'),
          avatarColor: effectiveRole === 'staff' ? '#6D28D9' : (effectiveRole === 'agent' ? '#0D7A75' : '#0284C7'),
          location: u.location || `${u.area || 'HSR Layout'}, Bengaluru`,
          area: u.area || 'HSR Layout',
          department: u.department || 'Laundry Operations',
          shift: u.shift || 'Morning (8 AM - 4 PM)',
          vehicleType: u.vehicleType || 'Two-Wheeler',
          vehicleNumber: u.vehicleNumber || 'KA 01 AB 9999',
          assignedArea: u.assignedArea || `${u.area || 'Central Bengaluru'} Sector`,
          tasksCompleted: u.tasksCompleted || 0,
          ordersHandled: u.ordersHandled || 0,
          totalOrders: u.totalOrders || 0,
          totalSpent: u.totalSpent || '₹0',
          status: (u.isActive !== false && u.status !== 'Inactive') ? 'Active' : 'Inactive',
          dutyStatus: (u.isActive !== false && u.status !== 'Inactive') ? 'On Duty' : 'Offline',
          joinDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent',
          joinRelative: 'Recently joined'
        };

        if (matchedKey) {
          userMap.set(matchedKey, { ...userMap.get(matchedKey), ...formatted });
        } else {
          userMap.set(u.id || u.uid, formatted);
        }
      });
    }

    // 3. Filter out deleted users so they disappear permanently
    const allUsers = Array.from(userMap.values());
    return allUsers.filter(u => !isUserDeleted(u));
  }, [contextAllUsers, deletedUserIds, isUserDeleted]);

  // Dynamic Metrics depending on active tab
  const metrics = useMemo(() => {
    let dataset = mergedUsers;
    if (activeTab === 'customers') dataset = mergedUsers.filter(u => u.role === 'customer');
    else if (activeTab === 'staff') dataset = mergedUsers.filter(u => u.role === 'staff');
    else if (activeTab === 'delivery') dataset = mergedUsers.filter(u => u.role === 'agent' || u.role === 'delivery');

    const total = dataset.length;
    const active = dataset.filter(u => u.status === 'Active').length;
    const inactive = total - active;

    let card4Title = 'Staff & Drivers';
    let card4Value = `${mergedUsers.filter(u => u.role === 'staff').length + mergedUsers.filter(u => u.role === 'agent' || u.role === 'delivery').length}`;

    if (activeTab === 'customers') {
      card4Title = 'Average Rating';
      card4Value = '4.8 ★';
    } else if (activeTab === 'staff') {
      card4Title = 'Departments Active';
      card4Value = '5 Hubs';
    } else if (activeTab === 'delivery') {
      card4Title = 'On Duty Fleet';
      card4Value = `${dataset.filter(u => u.dutyStatus === 'On Duty' || u.status === 'Active').length}`;
    }

    return { total, active, inactive, card4Title, card4Value };
  }, [mergedUsers, activeTab]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: mergedUsers.length,
      customers: mergedUsers.filter(u => u.role === 'customer').length,
      staff: mergedUsers.filter(u => u.role === 'staff').length,
      delivery: mergedUsers.filter(u => u.role === 'agent' || u.role === 'delivery').length
    };
  }, [mergedUsers]);

  // Filtered dataset
  const filteredUsers = useMemo(() => {
    return mergedUsers.filter(u => {
      // 1. Tab view filter
      if (activeTab === 'customers' && u.role !== 'customer') return false;
      if (activeTab === 'staff' && u.role !== 'staff') return false;
      if (activeTab === 'delivery' && u.role !== 'agent' && u.role !== 'delivery') return false;

      // 2. Role filter dropdown
      if (roleFilter !== 'all') {
        if (roleFilter === 'customer' && u.role !== 'customer') return false;
        if (roleFilter === 'staff' && u.role !== 'staff') return false;
        if ((roleFilter === 'delivery' || roleFilter === 'agent') && u.role !== 'agent' && u.role !== 'delivery') return false;
      }

      // 3. Status filter
      if (statusFilter !== 'all' && (u.status || '').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // 4. Area / Locality filter
      if (areaFilter !== 'all') {
        const areaStr = `${u.area || ''} ${u.location || ''} ${u.assignedArea || ''} ${u.department || ''}`.toLowerCase();
        if (!areaStr.includes(areaFilter.toLowerCase())) return false;
      }

      // 5. Join Date filter
      if (!filterMatchesDate(u, dateRangeFilter, ['joinedAt', 'createdAt', 'created_at', 'joinDate', 'join_date'])) {
        return false;
      }

      // 6. Search query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesName = String(u.fullName || u.name || '').toLowerCase().includes(q);
        const matchesId = String(u.id || '').toLowerCase().includes(q);
        const matchesPhone = String(u.phone || '').includes(q);
        const matchesEmail = String(u.email || '').toLowerCase().includes(q);
        const matchesLoc = String(u.location || u.area || u.department || u.vehicleNumber || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesPhone && !matchesEmail && !matchesLoc) {
          return false;
        }
      }

      return true;
    });
  }, [mergedUsers, activeTab, roleFilter, statusFilter, areaFilter, dateRangeFilter, searchTerm]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = (currentPageClamped - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredUsers.length);
  const currentUsersPage = filteredUsers.slice(startIndex, endIndex);

  // Checkbox helpers
  const handleToggleSelectAll = () => {
    const pageIds = currentUsersPage.map(u => u.id);
    const allSelected = pageIds.length > 0 && pageIds.every(id => selectedUserIds.includes(id));
    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedUserIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectUser = (id) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setRoleFilter('all');
    setAreaFilter('all');
    setDateRangeFilter('all');
    setCurrentPage(1);
    setSelectedUserIds([]);
  };

  // Status toggle handler
  const handleToggleStatus = async (user) => {
    try {
      if (toggleUserStatus && user.uid) {
        await toggleUserStatus(user.uid, user.status);
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
    setActiveMenuId(null);
  };

  // Open Edit User Modal
  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({
      name: user.fullName || user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      role: user.role || 'customer',
      location: user.location || user.area || '',
      department: user.department || 'Laundry Operations',
      shift: user.shift || 'Morning (8 AM - 4 PM)',
      vehicleType: user.vehicleType || 'Two-Wheeler',
      vehicleNumber: user.vehicleNumber || '',
      status: user.status || 'Active'
    });
    setActiveMenuId(null);
  };

  // Save Edit User
  const handleSaveEdit = async (updatedData) => {
    if (!editingUser) return;
    try {
      if (updateUser) {
        const targetUid = editingUser.uid || editingUser.id;
        await updateUser(targetUid, {
          name: (updatedData.name || editForm.name || '').trim(),
          phone: (updatedData.phone || editForm.phone || '').trim(),
          email: (updatedData.email || editForm.email || '').trim(),
          role: editingUser.role || updatedData.role || editForm.role,
          location: (updatedData.location || editForm.location || '').trim(),
          area: (updatedData.location || editForm.location || '').split(',')[0].trim(),
          department: updatedData.department || editForm.department,
          shift: updatedData.shift || editForm.shift,
          vehicleType: updatedData.vehicleType || editForm.vehicleType,
          vehicleNumber: (updatedData.vehicleNumber || editForm.vehicleNumber || '').trim(),
          status: updatedData.status || editForm.status,
          isActive: (updatedData.status || editForm.status) === 'Active'
        });
      }
    } catch (err) {
      console.error('Failed to update user:', err);
    }
    setEditingUser(null);
  };

  // Delete User
  const handleDeleteUser = async (user) => {
    setActiveMenuId(null);
    if (!window.confirm(`Are you sure you want to delete ${user.fullName || user.name}?`)) return;

    const identifiers = [
      user.uid,
      user.id,
      user.id && String(user.id).replace(/^#/, ''),
      user.email && String(user.email).toLowerCase().trim(),
      user.phone,
      user.phone && String(user.phone).replace(/\s+/g, ''),
      user.fullName || user.name
    ].filter(Boolean);

    // Optimistically remove from UI and persist to localStorage immediately
    setDeletedUserIds(prev => {
      const next = Array.from(new Set([...prev, ...identifiers]));
      try {
        localStorage.setItem('fabricare_deleted_users', JSON.stringify(next));
      } catch (_) {}
      return next;
    });

    try {
      if (deleteUser) {
        await deleteUser(user);
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'staff':
        return <span className="user-role-badge badge-staff"><Briefcase size={12} /> Staff</span>;
      case 'agent':
      case 'delivery':
        return <span className="user-role-badge badge-delivery"><Truck size={12} /> Delivery</span>;
      default:
        return <span className="user-role-badge badge-customer"><Users size={12} /> Customer</span>;
    }
  };

  return (
    <div className="admin-customers-page animate-fade-in">
      {/* 1. Header Row */}
      <div className="customers-header-row">
        <div className="customers-header-left">
          <h1 className="customers-page-title">
            {activeTab === 'all' ? 'Users' : activeTab === 'customers' ? 'Customers' : activeTab === 'staff' ? 'Staff Members' : 'Delivery Personnel'}
          </h1>
          <p className="customers-page-subtitle">
            Manage all your customers, staff members, and delivery personnel in one place.
          </p>
        </div>

        {/* User Category Dropdown & Add User Button (Right side of header) */}
        <div className="header-actions-group">
          <div className="user-type-dropdown-container">
            <Users size={16} className="dropdown-prefix-icon" />
            <select 
              id="user-category-select"
              className="user-type-dropdown-select"
              value={activeTab}
              onChange={(e) => { setActiveTab(e.target.value); setCurrentPage(1); }}
              aria-label="Select User Category"
            >
              <option value="all">All Users ({tabCounts.all})</option>
              <option value="customers">Customers ({tabCounts.customers})</option>
              <option value="staff">Staff ({tabCounts.staff})</option>
              <option value="delivery">Delivery ({tabCounts.delivery})</option>
            </select>
            <ChevronDown size={15} className="dropdown-chevron-icon" />
          </div>

          <button 
            id="add-user-header-btn"
            className="btn-add-customer-teal"
            onClick={() => setIsAddUserModalOpen(true)}
            type="button"
          >
            <Plus size={18} strokeWidth={2.4} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* 2. Four Metric Cards */}
      <div className="customers-metrics-grid">
        {/* Card 1: Total */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-cyan">
            <Users size={22} color="#0891B2" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.total}</div>
            <div className="metric-label">
              {activeTab === 'all' ? 'Total Users' : activeTab === 'customers' ? 'Total Customers' : activeTab === 'staff' ? 'Total Staff' : 'Total Fleet'}
            </div>
          </div>
        </div>

        {/* Card 2: Active */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-green">
            <UserCheck size={22} color="#16A34A" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.active}</div>
            <div className="metric-label">
              {activeTab === 'delivery' ? 'On Duty Agents' : 'Active Status'}
            </div>
          </div>
        </div>

        {/* Card 3: Inactive */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-yellow">
            <Clock size={22} color="#D97706" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.inactive}</div>
            <div className="metric-label">
              {activeTab === 'delivery' ? 'Offline / Inactive' : 'Inactive Status'}
            </div>
          </div>
        </div>

        {/* Card 4: Role-specific highlight */}
        <div className="customer-metric-card">
          <div className="metric-icon-circle-badge badge-purple">
            <Star size={22} color="#9333EA" strokeWidth={1.8} />
          </div>
          <div className="metric-text-stack">
            <div className="metric-numeric-value">{metrics.card4Value}</div>
            <div className="metric-label">{metrics.card4Title}</div>
          </div>
        </div>
      </div>

      {/* 3. Search and Filter Bar: FILTERS ON THE RIGHT SIDE BEFORE 'ADD USER' BUTTON */}
      <div className="customers-filter-bar-row">
        {/* Left: Search Box */}
        <div className="filter-search-box-wrap">
          <Search size={16} className="search-field-icon" />
          <input 
            type="text" 
            placeholder={
              activeTab === 'customers' 
                ? 'Search customers by name, phone, email, or locality...'
                : activeTab === 'staff'
                ? 'Search staff by name, phone, department, or shift...'
                : activeTab === 'delivery'
                ? 'Search agents by name, vehicle number, or hub...'
                : 'Search users by name, phone, email, role, or ID...'
            } 
            className="filter-search-input-field"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
          {searchTerm && (
            <button 
              type="button" 
              className="search-clear-btn" 
              onClick={() => setSearchTerm('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Right Side Controls: Dropdown Filters followed directly by '+ Add User' Button */}
        <div className="filter-controls-group">
          {/* User Type / Role Filter (visible if All Users tab is active) */}
          {activeTab === 'all' && (
            <div className="filter-select-container">
              <select 
                className="filter-styled-select"
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                aria-label="Filter by Role"
              >
                <option value="all">All Roles</option>
                <option value="customer">Customers</option>
                <option value="staff">Staff Members</option>
                <option value="delivery">Delivery Personnel</option>
              </select>
              <ChevronDown size={14} className="select-chevron-icon" />
            </div>
          )}

          {/* Status Select */}
          <div className="filter-select-container">
            <select 
              className="filter-styled-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              aria-label="Filter by Status"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown size={14} className="select-chevron-icon" />
          </div>


          {/* Join Date Dropdown Button */}
          <div className="filter-dropdown-pill-wrapper">
            <button 
              type="button"
              className={`filter-pill-button ${dateRangeFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setIsJoinDateDropdownOpen(!isJoinDateDropdownOpen)}
            >
              <Calendar size={15} className="pill-button-icon" />
              <span>
                {dateRangeFilter === 'all'
                  ? 'Join Date'
                  : (dateRangeFilter === 'today' ? 'Joined: Today' : dateRangeFilter === 'yesterday' ? 'Joined: Yesterday' : dateRangeFilter === 'last-week' ? 'Joined: Last Week' : 'Joined: Last 30 Days')}
              </span>
              <ChevronDown size={14} className="pill-button-chevron" />
            </button>
            {isJoinDateDropdownOpen && (
              <div className="join-date-popover animate-scale-in">
                {[
                  { key: 'all', label: 'All Time' },
                  { key: 'today', label: 'Today' },
                  { key: 'yesterday', label: 'Yesterday' },
                  { key: 'last-week', label: 'Last Week' },
                  { key: 'last-30', label: 'Last 30 Days' }
                ].map(r => (
                  <button 
                    key={r.key}
                    className={`popover-item ${dateRangeFilter === r.key ? 'active' : ''}`}
                    onClick={() => {
                      setDateRangeFilter(r.key);
                      setCurrentPage(1);
                      setIsJoinDateDropdownOpen(false);
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 4. Main Users Table Card */}
      <div className="customers-table-card-container">
        <div className="table-responsive-wrapper">
          <table className="customers-full-data-table">
            <thead>
              <tr>
                <th className="th-checkbox-col">
                  <input 
                    type="checkbox" 
                    className="styled-chk-box" 
                    checked={currentUsersPage.length > 0 && currentUsersPage.every(u => selectedUserIds.includes(u.id))}
                    onChange={handleToggleSelectAll}
                    aria-label="Select all"
                  />
                </th>
                <th>User / Member</th>
                {activeTab === 'all' && <th>Role</th>}
                <th>Contact</th>
                <th>{activeTab === 'staff' ? 'Department / Shift' : activeTab === 'delivery' ? 'Fleet & Assigned Hub' : 'Location'}</th>
                <th>{activeTab === 'staff' ? 'Orders Handled' : activeTab === 'delivery' ? 'Tasks Done' : 'Orders & Spent'}</th>
                <th>Status</th>
                <th>Join Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsersPage.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'all' ? 9 : 8} className="empty-results-cell">
                    No users found matching your search or filters.
                  </td>
                </tr>
              ) : (
                currentUsersPage.map((user) => {
                  const isChecked = selectedUserIds.includes(user.id);
                  const isStaff = user.role === 'staff';
                  const isDelivery = user.role === 'agent' || user.role === 'delivery';

                  return (
                    <tr key={user.id} className={isChecked ? 'row-selected' : ''}>
                      {/* Checkbox */}
                      <td className="td-checkbox-col">
                        <input 
                          type="checkbox" 
                          className="styled-chk-box" 
                          checked={isChecked}
                          onChange={() => handleToggleSelectUser(user.id)}
                          aria-label={`Select ${user.name}`}
                        />
                      </td>

                      {/* User Avatar, Name & Code */}
                      <td>
                        <div className="customer-identity-cell">
                          <div 
                            className="customer-avatar-round"
                            style={{ 
                              backgroundColor: user.avatarBg, 
                              color: user.avatarColor 
                            }}
                          >
                            {user.avatar}
                          </div>
                          <div className="customer-name-id-wrap">
                            <span className="customer-primary-name">{user.fullName || user.name}</span>
                            <span className="customer-code-id">{user.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge (visible on All Users tab) */}
                      {activeTab === 'all' && (
                        <td>
                          {getRoleBadge(user.role)}
                        </td>
                      )}

                      {/* Contact */}
                      <td>
                        <div className="customer-contact-stack">
                          <div className="contact-line-item">
                            <Phone size={13} className="contact-item-icon" />
                            <span>{user.phone}</span>
                          </div>
                          {user.email && (
                            <div className="contact-line-item">
                              <Mail size={13} className="contact-item-icon" />
                              <span>{user.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Location / Department / Vehicle */}
                      <td>
                        {isStaff ? (
                          <div className="staff-dept-stack">
                            <span className="staff-dept-title">{user.department}</span>
                            <span className="staff-shift-sub">{user.shift}</span>
                          </div>
                        ) : isDelivery ? (
                          <div className="delivery-fleet-stack">
                            <span className="fleet-vehicle-text"><strong>{user.vehicleType}</strong> • {user.vehicleNumber}</span>
                            <span className="fleet-area-sub">{user.assignedArea}</span>
                          </div>
                        ) : (
                          <div className="customer-location-wrapper">
                            <MapPin size={14} className="location-marker-icon" />
                            <div className="location-text-stack">
                              <span className="location-area-line">{user.area || user.location}</span>
                              <span className="location-city-line">Bengaluru</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Activity / Stats */}
                      <td>
                        {isStaff ? (
                          <div className="activity-cell-stack">
                            <span className="orders-count-number">{user.ordersHandled}</span>
                            <span className="activity-sub-text">orders processed</span>
                          </div>
                        ) : isDelivery ? (
                          <div className="activity-cell-stack">
                            <span className="orders-count-number">{user.tasksCompleted}</span>
                            <span className="activity-sub-text">tasks delivered</span>
                          </div>
                        ) : (
                          <div className="activity-cell-stack">
                            <span className="orders-count-number">{user.totalOrders} orders</span>
                            <span className="spent-amount-number">{user.totalSpent}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span 
                          className={`status-pill-capsule ${user.status.toLowerCase()}`}
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleToggleStatus(user)}
                          title="Click to toggle status"
                        >
                          {user.status === 'Active' ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Join Date */}
                      <td>
                        <div className="join-date-stack">
                          <span className="join-exact-date">{user.joinDate}</span>
                          <span className="join-relative-time">{user.joinRelative}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="td-actions-col">
                        <div className="action-menu-anchor" ref={activeMenuId === user.id ? popoverRef : null}>
                          <button 
                            type="button"
                            className="table-dot-menu-btn"
                            onClick={() => setActiveMenuId(activeMenuId === user.id ? null : user.id)}
                            aria-label="Actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>

                          {activeMenuId === user.id && (
                            <div className="action-dropdown-popover animate-scale-in">
                              <button 
                                className="action-popover-item"
                                onClick={() => { setViewingUser(user); setActiveMenuId(null); }}
                              >
                                <Eye size={13} />
                                <span>View Details</span>
                              </button>
                              <button 
                                className="action-popover-item"
                                onClick={() => handleOpenEdit(user)}
                              >
                                <Edit size={13} />
                                <span>Edit Profile</span>
                              </button>
                              <button 
                                className="action-popover-item"
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.status === 'Active' ? (
                                  <>
                                    <PauseCircle size={13} color="#D97706" />
                                    <span>Mark Inactive</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 size={13} color="#16A34A" />
                                    <span>Mark Active</span>
                                  </>
                                )}
                              </button>
                              <button 
                                className="action-popover-item danger"
                                onClick={() => handleDeleteUser(user)}
                              >
                                <Trash2 size={13} />
                                <span>Delete User</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Pagination Footer */}
      <div className="customers-pagination-footer-row">
        <div className="pagination-count-summary">
          Showing <span className="highlight-count">{filteredUsers.length === 0 ? 0 : startIndex + 1}–{endIndex}</span> of <span className="highlight-count">{filteredUsers.length}</span> users
        </div>

        <div className="pagination-buttons-cluster">
          <button 
            type="button"
            className="pagination-arrow-btn" 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPageClamped <= 1}
            aria-label="Previous Page"
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button 
              key={pageNum}
              type="button"
              className={`pagination-number-btn ${currentPageClamped === pageNum ? 'active' : ''}`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button 
            type="button"
            className="pagination-arrow-btn" 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPageClamped >= totalPages}
            aria-label="Next Page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* View User Details Modal */}
      {viewingUser && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop-overlay animate-fade-in" onClick={() => setViewingUser(null)}>
          <div className="user-details-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="details-modal-header">
              <div className="details-user-identity">
                <div 
                  className="customer-avatar-round lg"
                  style={{ backgroundColor: viewingUser.avatarBg, color: viewingUser.avatarColor }}
                >
                  {viewingUser.avatar}
                </div>
                <div>
                  <h3 className="details-user-name">{viewingUser.fullName || viewingUser.name}</h3>
                  <div className="details-role-id-row">
                    {getRoleBadge(viewingUser.role)}
                    <span className="details-code-id">{viewingUser.id}</span>
                  </div>
                </div>
              </div>
              <button className="details-close-btn" onClick={() => setViewingUser(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="details-modal-body">
              <div className="details-info-section">
                <h4 className="details-section-heading">Contact Information</h4>
                <div className="details-info-grid">
                  <div className="details-info-item">
                    <span className="details-label">Phone</span>
                    <span className="details-val">{viewingUser.phone || 'N/A'}</span>
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Email Address</span>
                    <span className="details-val">{viewingUser.email || 'N/A'}</span>
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Status</span>
                    <span className={`status-pill-capsule ${viewingUser.status.toLowerCase()}`}>
                      {viewingUser.status}
                    </span>
                  </div>
                  <div className="details-info-item">
                    <span className="details-label">Joined On</span>
                    <span className="details-val">{viewingUser.joinDate} ({viewingUser.joinRelative})</span>
                  </div>
                </div>
              </div>

              {viewingUser.role === 'customer' && (
                <div className="details-info-section">
                  <h4 className="details-section-heading">Address & Order History</h4>
                  <div className="details-info-grid">
                    <div className="details-info-item">
                      <span className="details-label">Primary Address</span>
                      <span className="details-val">{viewingUser.location}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Total Orders</span>
                      <span className="details-val font-semibold">{viewingUser.totalOrders} completed</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Total Spend</span>
                      <span className="details-val font-semibold text-teal">{viewingUser.totalSpent}</span>
                    </div>
                  </div>
                </div>
              )}

              {viewingUser.role === 'staff' && (
                <div className="details-info-section">
                  <h4 className="details-section-heading">Operations & Department</h4>
                  <div className="details-info-grid">
                    <div className="details-info-item">
                      <span className="details-label">Department</span>
                      <span className="details-val font-semibold">{viewingUser.department}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Assigned Shift</span>
                      <span className="details-val">{viewingUser.shift}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Processed Garments</span>
                      <span className="details-val">{viewingUser.ordersHandled} orders handled</span>
                    </div>
                  </div>
                </div>
              )}

              {(viewingUser.role === 'agent' || viewingUser.role === 'delivery') && (
                <div className="details-info-section">
                  <h4 className="details-section-heading">Fleet & Logistics Information</h4>
                  <div className="details-info-grid">
                    <div className="details-info-item">
                      <span className="details-label">Vehicle</span>
                      <span className="details-val font-semibold">{viewingUser.vehicleType} • {viewingUser.vehicleNumber}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Assigned Hub / Sector</span>
                      <span className="details-val">{viewingUser.assignedArea}</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Completed Tasks</span>
                      <span className="details-val">{viewingUser.tasksCompleted} deliveries & pickups</span>
                    </div>
                    <div className="details-info-item">
                      <span className="details-label">Fleet Status</span>
                      <span className="details-val text-green font-semibold">{viewingUser.dutyStatus}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="details-modal-footer">
              <button 
                type="button"
                className="btn-modal-action-secondary"
                onClick={() => setViewingUser(null)}
              >
                Close
              </button>
              <button 
                type="button"
                className="btn-modal-action-primary"
                onClick={() => {
                  const target = viewingUser;
                  setViewingUser(null);
                  handleOpenEdit(target);
                }}
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit User Modal – uses redesigned component matching Reference Image 2 exactly */}
      <EditUserProfileModal
        isOpen={Boolean(editingUser)}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        currentRole={activeTab}
        onSave={handleSaveEdit}
      />

      {/* Scoped CSS Styles matching Reference Image 2 pixel-by-pixel */}
      <style>{`
        .admin-customers-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          width: 100%;
          box-sizing: border-box;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        }

        /* 1. Header */
        .customers-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }

        .customers-page-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 4px 0;
          letter-spacing: -0.02em;
        }

        .customers-page-subtitle {
          font-size: 0.875rem;
          color: #64748B;
          margin: 0;
          font-weight: 400;
        }

        /* Header Actions Group: Dropdown & Add User Button */
        .header-actions-group {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .user-type-dropdown-container {
          position: relative;
          display: flex;
          align-items: center;
          background: #FFFFFF;
          border: 1.5px solid #CBD5E1;
          border-radius: 10px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .user-type-dropdown-container:hover {
          border-color: #94A3B8;
        }

        .user-type-dropdown-container:focus-within {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .dropdown-prefix-icon {
          position: absolute;
          left: 12px;
          color: #0D7A75;
          pointer-events: none;
        }

        .user-type-dropdown-select {
          appearance: none;
          background: transparent;
          border: none;
          padding: 10px 38px 10px 38px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
          cursor: pointer;
          outline: none;
          min-width: 170px;
        }

        .dropdown-chevron-icon {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .btn-add-customer-teal {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #0D7A75;
          color: #FFFFFF;
          border: none;
          border-radius: 10px;
          padding: 10px 20px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 1px 3px rgba(13, 122, 117, 0.2);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-add-customer-teal:hover {
          background: #09635F;
          box-shadow: 0 4px 8px rgba(13, 122, 117, 0.25);
          transform: translateY(-1px);
        }

        /* 2. 4 White Metric Cards */
        .customers-metrics-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        .customer-metric-card {
          background: #FFFFFF;
          border: 1px solid #F1F5F9;
          border-radius: 14px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .customer-metric-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          transform: translateY(-1px);
        }

        .metric-icon-circle-badge {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .badge-cyan {
          background-color: #E6F7F7;
        }

        .badge-green {
          background-color: #EDFDF4;
        }

        .badge-yellow {
          background-color: #FFFBEB;
        }

        .badge-purple {
          background-color: #FAF5FF;
        }

        .metric-text-stack {
          display: flex;
          flex-direction: column;
        }

        .metric-numeric-value {
          font-size: 1.625rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.1;
        }

        .metric-label {
          font-size: 0.8125rem;
          color: #64748B;
          font-weight: 500;
          margin-top: 4px;
        }

        /* 3. Search and Filter Bar */
        .customers-filter-bar-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
        }

        .filter-search-box-wrap {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 280px;
          max-width: 480px;
        }

        .search-field-icon {
          position: absolute;
          left: 14px;
          color: #94A3B8;
          pointer-events: none;
        }

        .search-clear-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
        }

        .filter-search-input-field {
          width: 100%;
          padding: 10px 32px 10px 40px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          font-size: 0.875rem;
          color: #0F172A;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .filter-search-input-field:focus {
          border-color: #0D7A75;
          box-shadow: 0 0 0 3px rgba(13, 122, 117, 0.12);
        }

        .filter-controls-group {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }

        .filter-select-container {
          position: relative;
          display: flex;
          align-items: center;
        }

        .filter-styled-select {
          appearance: none;
          padding: 9px 34px 9px 14px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          transition: border-color 0.15s;
        }

        .filter-styled-select:focus {
          border-color: #0D7A75;
        }

        .select-chevron-icon {
          position: absolute;
          right: 12px;
          color: #64748B;
          pointer-events: none;
        }

        .filter-dropdown-pill-wrapper {
          position: relative;
        }

        .filter-pill-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          font-size: 0.875rem;
          color: #334155;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .filter-pill-button:hover {
          background-color: #F8FAFC;
        }

        .pill-button-icon {
          color: #64748B;
        }

        .pill-button-chevron {
          color: #64748B;
        }

        .join-date-popover {
          position: absolute;
          top: calc(100% + 6px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 6px;
          z-index: 50;
          min-width: 140px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .popover-item {
          display: block;
          width: 100%;
          text-align: left;
          padding: 8px 12px;
          font-size: 0.8125rem;
          color: #334155;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .popover-item:hover, .popover-item.active {
          background: #E6F7F7;
          color: #0D7A75;
          font-weight: 600;
        }

        .filter-reset-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          padding: 9px 12px;
          color: #64748B;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-reset-action-btn:hover {
          color: #0F172A;
          background: #F8FAFC;
        }

        .filter-refresh-action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: 1px solid #E2E8F0;
          border-radius: 9px;
          padding: 9px 12px;
          color: #0D7A75;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }

        .filter-refresh-action-btn:hover:not(:disabled) {
          background: #E6F7F7;
          border-color: #0D7A75;
        }

        .filter-refresh-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-users-refresh {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #FFFFFF;
          color: #0F172A;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-users-refresh:hover:not(:disabled) {
          background: #F8FAFC;
          border-color: #CBD5E1;
        }

        .btn-users-refresh:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .spin-animation {
          animation: spin 0.8s linear infinite;
        }

        /* 4. Table */
        .customers-table-card-container {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }

        .table-responsive-wrapper {
          overflow-x: auto;
          width: 100%;
        }

        .customers-full-data-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .customers-full-data-table thead tr {
          border-bottom: 1px solid #E2E8F0;
          background: #F8FAFC;
        }

        .customers-full-data-table th {
          padding: 14px 18px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748B;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .customers-full-data-table td {
          padding: 16px 18px;
          font-size: 0.875rem;
          color: #334155;
          border-bottom: 1px solid #F1F5F9;
          vertical-align: middle;
        }

        .customers-full-data-table tbody tr:hover {
          background: #F8FAFC;
        }

        .customers-full-data-table tbody tr.row-selected {
          background: #F0FDF4;
        }

        .th-checkbox-col, .td-checkbox-col {
          width: 44px;
          padding-left: 18px !important;
          padding-right: 0 !important;
        }

        .styled-chk-box {
          width: 16px;
          height: 16px;
          border-radius: 4px;
          border: 1px solid #CBD5E1;
          cursor: pointer;
          accent-color: #0D7A75;
        }

        /* Identity Cell */
        .customer-identity-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .customer-avatar-round {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8125rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .customer-avatar-round.lg {
          width: 52px;
          height: 52px;
          font-size: 1.1rem;
        }

        .customer-name-id-wrap {
          display: flex;
          flex-direction: column;
        }

        .customer-primary-name {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #0F172A;
        }

        .customer-code-id {
          font-size: 0.75rem;
          color: #94A3B8;
          font-family: monospace;
          margin-top: 2px;
        }

        /* Role Badge */
        .user-role-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .badge-customer {
          background: #E0F2FE;
          color: #0369A1;
        }

        .badge-staff {
          background: #F3E8FF;
          color: #7E22CE;
        }

        .badge-delivery {
          background: #E6F7F7;
          color: #0D7A75;
        }

        /* Contact Stack */
        .customer-contact-stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .contact-line-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8125rem;
          color: #475569;
        }

        .contact-item-icon {
          color: #94A3B8;
          flex-shrink: 0;
        }

        /* Location */
        .customer-location-wrapper {
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }

        .location-marker-icon {
          color: #94A3B8;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .location-text-stack {
          display: flex;
          flex-direction: column;
        }

        .location-area-line {
          font-size: 0.8125rem;
          font-weight: 500;
          color: #334155;
        }

        .location-city-line {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        .staff-dept-stack, .delivery-fleet-stack {
          display: flex;
          flex-direction: column;
        }

        .staff-dept-title, .fleet-vehicle-text {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #1E293B;
        }

        .staff-shift-sub, .fleet-area-sub {
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Activity / Stats */
        .activity-cell-stack {
          display: flex;
          flex-direction: column;
        }

        .orders-count-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: #0F172A;
        }

        .spent-amount-number {
          font-size: 0.775rem;
          color: #0D7A75;
          font-weight: 600;
        }

        .activity-sub-text {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        /* Status Pill */
        .status-pill-capsule {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-pill-capsule.active {
          background-color: #EDFDF4;
          color: #16A34A;
        }

        .status-pill-capsule.inactive {
          background-color: #FEE2E2;
          color: #DC2626;
        }

        /* Join Date */
        .join-date-stack {
          display: flex;
          flex-direction: column;
        }

        .join-exact-date {
          font-size: 0.8125rem;
          color: #334155;
          font-weight: 500;
        }

        .join-relative-time {
          font-size: 0.75rem;
          color: #94A3B8;
        }

        /* Actions */
        .td-actions-col {
          text-align: right;
          padding-right: 20px !important;
        }

        .action-menu-anchor {
          position: relative;
          display: inline-block;
        }

        .table-dot-menu-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.15s;
        }

        .table-dot-menu-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .action-dropdown-popover {
          position: absolute;
          top: calc(100% + 4px);
          right: 0;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          padding: 6px;
          z-index: 100;
          min-width: 155px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .action-popover-item {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          text-align: left;
          padding: 8px 10px;
          font-size: 0.8125rem;
          color: #334155;
          background: none;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s;
        }

        .action-popover-item:hover {
          background-color: #F8FAFC;
          color: #0D7A75;
        }

        .action-popover-item.danger:hover {
          background-color: #FEE2E2;
          color: #DC2626;
        }

        /* 5. Pagination Footer */
        .customers-pagination-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-top: none;
          border-radius: 0 0 14px 14px;
          margin-top: -24px;
        }

        .pagination-count-summary {
          font-size: 0.8125rem;
          color: #64748B;
        }

        .highlight-count {
          font-weight: 600;
          color: #0F172A;
        }

        .pagination-buttons-cluster {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pagination-arrow-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          color: #64748B;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pagination-arrow-btn:hover:not(:disabled) {
          border-color: #0D7A75;
          color: #0D7A75;
        }

        .pagination-arrow-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-number-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          background: #FFFFFF;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
        }

        .pagination-number-btn:hover {
          border-color: #CBD5E1;
        }

        .pagination-number-btn.active {
          background: #0D7A75;
          border-color: #0D7A75;
          color: #FFFFFF;
        }

        /* Modal Styles */
        .modal-backdrop-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
        }

        .user-details-modal-box, .edit-user-modal-box {
          background: #FFFFFF;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .details-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E2E8F0;
        }

        .details-user-identity {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .details-user-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0;
        }

        .details-role-id-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
        }

        .details-code-id {
          font-size: 0.75rem;
          color: #94A3B8;
          font-family: monospace;
        }

        .details-close-btn {
          background: none;
          border: none;
          color: #94A3B8;
          cursor: pointer;
          padding: 6px;
          border-radius: 8px;
        }

        .details-close-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .details-modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .details-info-section {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 16px;
        }

        .details-section-heading {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin: 0 0 12px 0;
        }

        .details-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .details-info-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .details-label {
          font-size: 0.75rem;
          color: #64748B;
        }

        .details-val {
          font-size: 0.875rem;
          color: #0F172A;
        }

        .details-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding: 16px 24px;
          border-top: 1px solid #E2E8F0;
        }

        .btn-modal-action-secondary {
          padding: 9px 18px;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
          background: #FFFFFF;
          color: #475569;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .btn-modal-action-primary {
          padding: 9px 20px;
          border-radius: 8px;
          border: none;
          background: #0D7A75;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 0.875rem;
          cursor: pointer;
        }

        .edit-user-form {
          padding: 24px;
        }

        .font-semibold {
          font-weight: 600;
        }

        .text-teal {
          color: #0D7A75;
        }

        .text-green {
          color: #16A34A;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .customers-metrics-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .customers-metrics-grid {
            grid-template-columns: 1fr;
          }
          .customers-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .users-tab-pill-group {
            width: 100%;
            overflow-x: auto;
          }
          .customers-filter-bar-row {
            flex-direction: column;
            align-items: stretch;
          }
          .filter-search-box-wrap {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminUsersPage;
