import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from 'react-query';
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons';
import { QueryClient, QueryClientProvider } from 'react-query';
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import ChangeFieldOfficerDialog from './ChangeFieldOfficerDialog';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { FiPhone, FiUser, FiDollarSign, FiTarget, FiBriefcase, FiFilter, FiX } from "react-icons/fi";
import { HomeOutlined } from '@ant-design/icons';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddCustomerModal from './AddCustomerModal';
import { AiFillCaretDown } from "react-icons/ai";
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { useRouter } from 'next/router';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import './CustomerListPage.css'

const queryClient = new QueryClient();

export default function CustomerListPage() {
    return (
        <QueryClientProvider client={queryClient}>
            <CustomerListContent />
        </QueryClientProvider>
    );
}

type Customer = {
    storeId: number;
    storeName: string;
    clientFirstName: string;
    clientLastName: string;
    primaryContact: number;
    monthlySale: number | null;
    intent: number | null;
    employeeName: string;
    clientType: string | null;
    totalVisitCount: number;
    lastVisitDate: string | null;
    email: string | null;
    city: string;
    state: string;
    country: string | null;
};

function CustomerListContent() {
    const router = useRouter();
    const [selectedColumns, setSelectedColumns] = useState<string[]>([
        'shopName', 'ownerName', 'city', 'state', 'phone', 'monthlySales', 'intentLevel', 'fieldOfficer',
        'clientType', 'totalVisits', 'lastVisitDate', 'email',
    ]);
    const [desktopFilters, setDesktopFilters] = useState({
        storeName: '',
        primaryContact: '',
        ownerName: '',
        city: '',
        state: '',
        clientType: '',
        employeeName: '',
    });
    const [mobileFilters, setMobileFilters] = useState({
        storeName: '',
        primaryContact: '',
        ownerName: '',
        city: '',
        state: '',
        clientType: '',
        employeeName: '',
    });
    const [isDesktopFilterExpanded, setIsDesktopFilterExpanded] = useState(false);
    const [isMobileFilterExpanded, setIsMobileFilterExpanded] = useState(false);
    const [expandedCards, setExpandedCards] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isChangeFieldOfficerDialogOpen, setIsChangeFieldOfficerDialogOpen] = useState<boolean>(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [sortColumn, setSortColumn] = useState<string>('storeName');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    const token = useSelector((state: RootState) => state.auth.token);
    const employeeId = useSelector((state: RootState) => state.auth.employeeId);
    const role = useSelector((state: RootState) => state.auth.role);
    const teamId = useSelector((state: RootState) => state.auth.teamId);

    const fetchFilteredCustomers = async ({ queryKey }: { queryKey: any }) => {
        const [_, { page, filters, sortColumn, sortDirection }] = queryKey;

        let url = 'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/filteredValues';
        const queryParams = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value) queryParams.append(key, value.toString());
        });

        queryParams.append('page', (page - 1).toString());
        queryParams.append('size', '10');
        queryParams.append('sort', `${sortColumn},${sortDirection}`);

        // Special handling for Field Officer filter
        if (filters.employeeName) {
            url = 'http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/getByEmployeeWithSort';
            queryParams.append('id', employeeId?.toString() || '');
            queryParams.append('sortBy', sortColumn);
            queryParams.append('sortOrder', sortDirection);
        }

        const response = await fetch(`${url}?${queryParams.toString()}`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        return response.json();
    };

    const { data, isLoading, isError, error, refetch } = useQuery(
        ['customers', { page: currentPage, filters: desktopFilters, sortColumn, sortDirection }],
        fetchFilteredCustomers
    );

    const customers = data?.content || [];
    const totalCustomers = data?.totalElements || 0;
    const totalPages = data?.totalPages || 1;

    useEffect(() => {
        refetch();
    }, [desktopFilters, currentPage, sortColumn, sortDirection]);

    const openDeleteModal = (customerId: string) => {
        setSelectedCustomerId(customerId);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setSelectedCustomerId(null);
        setIsDeleteModalOpen(false);
    };

    const handleDesktopFilterChange = (filterName: keyof typeof desktopFilters, value: string) => {
        setDesktopFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: value,
        }));
        setCurrentPage(1);
    };

    const handleMobileFilterChange = (filterName: keyof typeof mobileFilters, value: string) => {
        setMobileFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: value,
        }));
    };

    const handleFilterClear = (filterName: keyof typeof desktopFilters) => {
        setDesktopFilters((prevFilters) => ({
            ...prevFilters,
            [filterName]: '',
        }));
        setCurrentPage(1);
    };

    const toggleCardExpansion = (storeId: number) => {
        setExpandedCards(prev =>
            prev.includes(storeId)
                ? prev.filter(id => id !== storeId)
                : [...prev, storeId]
        );
    };

    const handleDeleteConfirm = async () => {
        if (selectedCustomerId) {
            try {
                const response = await fetch(`http://ec2-51-20-32-8.eu-north-1.compute.amazonaws.com:8081/store/deleteById?id=${selectedCustomerId}`, {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    refetch();
                    closeDeleteModal();
                } else {
                    console.error('Failed to delete customer');
                }
            } catch (error) {
                console.error('Error deleting customer:', error);
            }
        }
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSelectColumn = (column: string) => {
        setSelectedColumns(prev =>
            prev.includes(column)
                ? prev.filter(col => col !== column)
                : [...prev, column]
        );
    };

    const handleChangeFieldOfficerConfirm = (selectedFieldOfficer: string) => {
        console.log('Changing field officer to:', selectedFieldOfficer);
        setIsChangeFieldOfficerDialogOpen(false);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleSort = (column: string) => {
        setSortColumn(column);
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const renderPagination = () => {
        const pageNumbers = [];
        const displayPages = 5;

        let startPage = Math.max(currentPage - Math.floor(displayPages / 2), 1);
        let endPage = startPage + displayPages - 1;

        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - displayPages + 1, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <Pagination>
                <PaginationContent>
                    {currentPage !== 1 && (
                        <PaginationPrevious
                            onClick={() => handlePageChange(currentPage - 1)}
                        />
                    )}
                    {startPage > 1 && (
                        <>
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(1)}>1</PaginationLink>
                            </PaginationItem>
                            {startPage > 2 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                        </>
                    )}
                    {pageNumbers.map((page) => (
                        <PaginationItem key={page}>
                            <PaginationLink
                                isActive={page === currentPage}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </PaginationLink>
                        </PaginationItem>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && (
                                <PaginationItem>
                                    <PaginationLink>...</PaginationLink>
                                </PaginationItem>
                            )}
                            <PaginationItem>
                                <PaginationLink onClick={() => handlePageChange(totalPages)}>{totalPages}</PaginationLink>
                            </PaginationItem>
                        </>
                    )}
                    {currentPage !== totalPages && (
                        <PaginationNext
                            onClick={() => handlePageChange(currentPage + 1)}
                        />
                    )}
                </PaginationContent>
            </Pagination>
        );
    };

    const renderFilterInput = (name: keyof typeof desktopFilters, label: string, icon: React.ReactNode, isMobile: boolean) => (
        <div className="space-y-2">
            <Label htmlFor={name}>{label}</Label>
            <div className="relative">
                <Input
                    id={name}
                    value={isMobile ? mobileFilters[name] : desktopFilters[name]}
                    onChange={(e) => isMobile ? handleMobileFilterChange(name, e.target.value) : handleDesktopFilterChange(name, e.target.value)}
                    className="pl-10"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                    {icon}
                </div>
                {!isMobile && desktopFilters[name] && (
                    <button
                        onClick={() => handleFilterClear(name)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                        <FiX className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div>
                <h1 className="text-4xl font-bold mb-6">Customer List</h1>
                <div className="flex justify-between items-center mb-6">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">Columns</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {['shopName', 'ownerName', 'city', 'state', 'phone', 'monthlySales', 'intentLevel', 'fieldOfficer', 'clientType', 'totalVisits', 'lastVisitDate', 'email'].map(
                                (column) => (
                                    <DropdownMenuCheckboxItem
                                        key={column}
                                        checked={selectedColumns.includes(column)}
                                        onCheckedChange={() => handleSelectColumn(column)}
                                    >
                                        {column}
                                    </DropdownMenuCheckboxItem>
                                )
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={openModal}>
                            Add Customer
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setIsDesktopFilterExpanded(!isDesktopFilterExpanded)}
                            className="hidden md:inline-flex"
                        >
                            <FiFilter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setIsMobileFilterExpanded(true)}
                            className="md:hidden"
                        >
                            <FiFilter className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isDesktopFilterExpanded && (
                    <Card className="mb-6 hidden md:block">
                        <CardHeader>
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {renderFilterInput('storeName', 'Shop Name', <FiUser className="h-4 w-4" />, false)}
                                {renderFilterInput('ownerName', 'Owner Name', <FiUser className="h-4 w-4" />, false)}
                                {renderFilterInput('city', 'City', <HomeOutlined className="h-4 w-4" />, false)}
                                {renderFilterInput('state', 'State', <HomeOutlined className="h-4 w-4" />, false)}
                                {renderFilterInput('primaryContact', 'Phone', <FiPhone className="h-4 w-4" />, false)}
                                {renderFilterInput('clientType', 'Client Type', <FiTarget className="h-4 w-4" />, false)}
                                {renderFilterInput('employeeName', 'Field Officer', <FiBriefcase className="h-4 w-4" />, false)}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <AddCustomerModal
                    isOpen={isModalOpen}
                    onClose={closeModal}
                    token={token || ''}
                    employeeId={employeeId ? Number(employeeId) : null}
                />

                {role === 'MANAGER' && (
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Team Customers</h2>
                    </div>
                )}

                <Sheet open={isMobileFilterExpanded} onOpenChange={setIsMobileFilterExpanded}>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-4">
                            {renderFilterInput('storeName', 'Shop Name', <FiUser className="h-4 w-4" />, true)}
                            {renderFilterInput('ownerName', 'Owner Name', <FiUser className="h-4 w-4" />, true)}
                            {renderFilterInput('city', 'City', <HomeOutlined className="h-4 w-4" />, true)}
                            {renderFilterInput('state', 'State', <HomeOutlined className="h-4 w-4" />, true)}
                            {renderFilterInput('primaryContact', 'Phone', <FiPhone className="h-4 w-4" />, true)}
                            {renderFilterInput('clientType', 'Client Type', <FiTarget className="h-4 w-4" />, true)}
                            {renderFilterInput('employeeName', 'Field Officer', <FiBriefcase className="h-4 w-4" />, true)}
                        </div>
                        <SheetFooter>
                            <Button onClick={() => setIsMobileFilterExpanded(false)}>Apply Filters</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>

                <div className="md:hidden space-y-4">
                    {customers.map((customer: Customer) => (
                        <Card key={customer.storeId} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Avatar>
                                            <AvatarImage src={`https://source.boringavatars.com/beam/120/${customer.clientFirstName}${customer.clientLastName}?colors=264653,2a9d8f,e9c46a,f4a261,e76f51`} />
                                            <AvatarFallback>{getInitials(customer.clientFirstName, customer.clientLastName)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <CardTitle className="text-lg">{customer.storeName}</CardTitle>
                                            <p className="text-sm text-gray-500">{customer.city}, {customer.state}</p>
                                        </div>
                                    </div>
                                    <Badge variant={customer.clientType ? "outline" : "secondary"}>
                                        {customer.clientType || "N/A"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FiUser className="text-blue-500" />
                                        <span className="font-medium">Owner:</span>
                                        <span>{customer.clientFirstName} {customer.clientLastName}</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleCardExpansion(customer.storeId)}
                                    >
                                        {expandedCards.includes(customer.storeId) ? (
                                            <ChevronUpIcon className="h-4 w-4" />
                                        ) : (
                                            <ChevronDownIcon className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>

                                {expandedCards.includes(customer.storeId) && (
                                    <div className="mt-4 space-y-3 text-sm">
                                        <div className="flex items-center space-x-2">
                                            <FiPhone className="text-green-500" />
                                            <span className="font-medium">Phone:</span>
                                            <span>{customer.primaryContact}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <FiDollarSign className="text-yellow-500" />
                                            <span className="font-medium">Monthly Sales:</span>
                                            <span>{customer.monthlySale ? `${customer.monthlySale.toLocaleString()} tonnes` : 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <FiTarget className="text-red-500" />
                                            <span className="font-medium">Intent:</span>
                                            <span>{customer.intent ?? 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <FiBriefcase className="text-purple-500" />
                                            <span className="font-medium">Field Officer:</span>
                                            <span>{customer.employeeName || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <FiUser className="text-indigo-500" />
                                            <span className="font-medium">Total Visits:</span>
                                            <span>{customer.totalVisitCount}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 flex justify-end items-center">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <AiFillCaretDown className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => router.push(`/CustomerDetailPage/${customer.storeId}`)}>
                                                View
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => openDeleteModal(customer.storeId.toString())}>
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="hidden md:block">
                    <Table className="text-sm font-poppins">
                        <TableHeader>
                            <TableRow>
                                {selectedColumns.includes('shopName') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('storeName')}>
                                        Shop Name
                                        {sortColumn === 'storeName' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('ownerName') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('ownerName')}>
                                        Owner Name
                                        {sortColumn === 'ownerName' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('city') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('city')}>
                                        City
                                        {sortColumn === 'city' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('state') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('state')}>
                                        State
                                        {sortColumn === 'state' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('phone') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('primaryContact')}>
                                        Phone
                                        {sortColumn === 'primaryContact' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('monthlySales') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('monthlySale')}>
                                        Monthly Sales
                                        {sortColumn === 'monthlySale' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('intentLevel') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('intent')}>
                                        Intent Level
                                        {sortColumn === 'intent' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('fieldOfficer') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('employeeName')}>
                                        Field Officer
                                        {sortColumn === 'employeeName' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('clientType') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('clientType')}>
                                        Client Type
                                        {sortColumn === 'clientType' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('totalVisits') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('totalVisitCount')}>
                                        Total Visits
                                        {sortColumn === 'totalVisitCount' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('lastVisitDate') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('lastVisitDate')}>
                                        Last Visit Date
                                        {sortColumn === 'lastVisitDate' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                {selectedColumns.includes('email') && (
                                    <TableHead className="cursor-pointer" onClick={() => handleSort('email')}>
                                        Email
                                        {sortColumn === 'email' && (
                                            <span className="text-black text-sm">{sortDirection === 'asc' ? ' ▲' : ' ▼'}</span>
                                        )}
                                    </TableHead>
                                )}
                                <TableHead className="w-20">Actions</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {customers.map((customer: Customer) => (
                                <TableRow key={customer.storeId}>
                                    {selectedColumns.includes('shopName') && <TableCell>{customer.storeName || ''}</TableCell>}
                                    {selectedColumns.includes('ownerName') && (
                                        <TableCell>
                                            {customer.clientFirstName || customer.clientLastName
                                                ? `${customer.clientFirstName || ''} ${customer.clientLastName || ''}`.trim()
                                                : ''}
                                        </TableCell>
                                    )}
                                    {selectedColumns.includes('city') && <TableCell>{customer.city || ''}</TableCell>}
                                    {selectedColumns.includes('state') && <TableCell>{customer.state || ''}</TableCell>}
                                    {selectedColumns.includes('phone') && <TableCell>{customer.primaryContact || ''}</TableCell>}
                                    {selectedColumns.includes('monthlySales') && (
                                        <TableCell>
                                            {customer.monthlySale !== null && customer.monthlySale !== undefined
                                                ? `${customer.monthlySale.toLocaleString()} tonnes`
                                                : ''}
                                        </TableCell>
                                    )}
                                    {selectedColumns.includes('intentLevel') && (
                                        <TableCell>{customer.intent !== null && customer.intent !== undefined ? customer.intent : ''}</TableCell>
                                    )}
                                    {selectedColumns.includes('fieldOfficer') && <TableCell>{customer.employeeName || ''}</TableCell>}
                                    {selectedColumns.includes('clientType') && (
                                        <TableCell>
                                            <Badge variant="outline">
                                                {customer.clientType || ''}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {selectedColumns.includes('totalVisits') && <TableCell>{customer.totalVisitCount}</TableCell>}
                                    {selectedColumns.includes('lastVisitDate') && (
                                        <TableCell>
                                            {customer.lastVisitDate
                                                ? new Date(customer.lastVisitDate).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                })
                                                : ''}
                                        </TableCell>
                                    )}
                                    {selectedColumns.includes('email') && <TableCell>{customer.email || ''}</TableCell>}
                                    <TableCell className="w-20">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <AiFillCaretDown className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onSelect={() => router.push(`/CustomerDetailPage/${customer.storeId}`)}>
                                                    View
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => openDeleteModal(customer.storeId.toString())}>
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {renderPagination()}

                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={closeDeleteModal}
                    onConfirm={handleDeleteConfirm}
                />

                <ChangeFieldOfficerDialog
                    isOpen={isChangeFieldOfficerDialogOpen}
                    onClose={() => setIsChangeFieldOfficerDialogOpen(false)}
                    onConfirm={handleChangeFieldOfficerConfirm}
                />
            </div>
        </div>
    );
}
