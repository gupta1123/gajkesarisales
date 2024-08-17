import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useQuery, QueryClient, QueryClientProvider, useQueryClient } from 'react-query';
import { useRouter } from 'next/router';
import { RootState } from '../store';
import VisitsTable from '../components/VisitList/VisitsTable';
import { Visit } from '../components/VisitList/types';
import { format, subDays } from 'date-fns';
import { stringify } from 'csv-stringify';
import { Pagination, PaginationContent, PaginationLink, PaginationItem, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import './VisitsList.css';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


const queryClient = new QueryClient();

const fetchVisits = async (
  token: string | null,
  startDate: Date | undefined,
  endDate: Date | undefined,
  purpose: string,
  storeName: string,
  employeeName: string,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc',
  currentPage: number,
  itemsPerPage: number
) => {
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  let url = `https://api.gajkesaristeels.in/visit/getByDateSorted?startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=${currentPage - 1}&size=${itemsPerPage}`;

  if (sortColumn) {
    url += `&sort=${sortColumn},${sortDirection}`;
  }

  if (purpose) {
    url += `&purpose=${encodeURIComponent(purpose)}`;
  }
  if (storeName) {
    url += `&storeName=${encodeURIComponent(storeName)}`;
  }
  if (employeeName) {
    url += `&employeeName=${encodeURIComponent(employeeName)}`;
  }

  const headers: { Authorization?: string } = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(url, {
    headers,
  });
  return response.data;
};

const fetchVisitsForTeam = async (
  token: string | null,
  teamId: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
  purpose: string,
  storeName: string,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc',
  currentPage: number,
  itemsPerPage: number
) => {
  const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : '';
  const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : '';
  let url = `https://api.gajkesaristeels.in/visit/getForTeam?teamId=${teamId}&startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=${currentPage - 1}&size=${itemsPerPage}`;

  if (sortColumn) {
    url += `&sort=${sortColumn},${sortDirection}`;
  }

  if (purpose) {
    url += `&purpose=${encodeURIComponent(purpose)}`;
  }
  if (storeName) {
    url += `&storeName=${encodeURIComponent(storeName)}`;
  }

  const headers: { Authorization?: string } = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await axios.get(url, { headers });
  return response.data;
};

const fetchAllVisitsForTeam = async (
  token: string | null,
  teamId: number,
  startDate: Date | undefined,
  endDate: Date | undefined,
  sortColumn: string | null,
  sortDirection: 'asc' | 'desc'
) => {
  let page = 0;
  const itemsPerPage = 100;
  const allVisits = [];

  while (true) {
    const response = await fetchVisitsForTeam(
      token,
      teamId,
      startDate,
      endDate,
      '',
      '',
      sortColumn,
      sortDirection,
      page + 1,
      itemsPerPage
    );

    allVisits.push(...response.content);

    if (response.last) {
      break;
    }

    page++;
  }

  return allVisits;
};

const VisitsList: React.FC = () => {
  const router = useRouter();
  const token = useSelector((state: RootState) => state.auth.token);
  const role = useSelector((state: RootState) => state.auth.role);
  const teamId = useSelector((state: RootState) => state.auth.teamId);
  const state = typeof window !== 'undefined' ? history.state : undefined;
  const { date, employeeName: stateEmployeeName } = state || {};
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [startDate, setStartDate] = useState<Date | undefined>(date ? new Date(date as string) : subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date | undefined>(date ? new Date(date as string) : new Date());
  const [sortColumn, setSortColumn] = useState<string | null>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [purpose, setPurpose] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('');
  const [employeeName, setEmployeeName] = useState<string>(stateEmployeeName ? stateEmployeeName as string : '');
  const [visitsNavigate, setVisitsNavigate] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([
    'storeName',
    'employeeName',
    'visit_date',
    'purpose',
    'outcome',
    'visitStart',
    'visitEnd',
    'intent',
    'city',
    'state',
    'storePrimaryContact',
    'district',
    'subDistrict',
  ]);

  const itemsPerPage = 10;

  const saveStateToLocalStorage = useCallback(() => {
    const state = {
      startDate,
      endDate,
      sortColumn,
      sortDirection,
      currentPage,
      purpose,
      storeName,
      employeeName,
    };
    localStorage.setItem('visitsListState', JSON.stringify(state));
  }, [startDate, endDate, sortColumn, sortDirection, currentPage, purpose, storeName, employeeName]);

  useEffect(() => {
    const selectedDate = localStorage.getItem('selectedDate');
    const storedEmployeeName = localStorage.getItem('employeeName');

    if (selectedDate) {
      setStartDate(new Date(selectedDate));
      setEndDate(new Date(selectedDate));
    }

    if (storedEmployeeName) {
      const cleanedEmployeeName = storedEmployeeName.trim().replace(/\s+/g, ' ');
      setEmployeeName(cleanedEmployeeName);
    }

    if (selectedDate && storedEmployeeName) {
      const encodedEmployeeName = encodeURIComponent(storedEmployeeName);

      const url = `https://api.gajkesaristeels.in/visit/getByDateSorted?startDate=${selectedDate}&endDate=${selectedDate}&page=0&size=10&sort=id,desc&employeeName=${encodedEmployeeName}`;

      const headers: { Authorization?: string } = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      axios.get(url, { headers })
        .then(response => {
          setVisitsNavigate(response.data.content);
        })
        .catch(error => {
          console.error('Error fetching data:', error);
        });
    }
  }, [token]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('selectedDate');
      localStorage.removeItem('employeeName');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      if (url !== '/VisitsList') {
        localStorage.removeItem('selectedDate');
        localStorage.removeItem('employeeName');
      }
    };

    router.events.on('routeChangeStart', handleRouteChange);
    return () => {
      router.events.off('routeChangeStart', handleRouteChange);
    };
  }, [router.events]);

  const loadStateFromLocalStorage = useCallback(() => {
    const state = localStorage.getItem('visitsListState');
    if (state) {
      const parsedState = JSON.parse(state);
      setStartDate(new Date(parsedState.startDate));
      setEndDate(new Date(parsedState.endDate));
      setSortColumn(parsedState.sortColumn);
      setSortDirection(parsedState.sortDirection);
      setCurrentPage(parsedState.currentPage);
      setPurpose(parsedState.purpose);
      setStoreName(parsedState.storeName);
      setEmployeeName(parsedState.employeeName);
    }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('selectedDate')) {
      setStartDate(subDays(new Date(), 7));
      setEndDate(new Date());
    } else {
      loadStateFromLocalStorage();
    }
  }, [loadStateFromLocalStorage]);

  useEffect(() => {
    saveStateToLocalStorage();
  }, [saveStateToLocalStorage]);

  const { data, error, isLoading } = useQuery(
    ['visits', token, role, teamId, startDate, endDate, purpose, storeName, employeeName, sortColumn, sortDirection, currentPage, itemsPerPage],
    () => {
      if (role === 'MANAGER' && teamId) {
        return fetchVisitsForTeam(
          token,
          teamId,
          startDate,
          endDate,
          purpose,
          storeName,
          sortColumn,
          sortDirection,
          currentPage,
          itemsPerPage
        );
      } else if (role === 'ADMIN' || role === 'OFFICE MANAGER') {
        return fetchVisits(
          token,
          startDate,
          endDate,
          purpose,
          storeName,
          employeeName,
          sortColumn,
          sortDirection,
          currentPage,
          itemsPerPage
        );
      }
    },
    {
      enabled: !!token && (role === 'MANAGER' ? !!teamId : (role === 'ADMIN' || role === 'OFFICE MANAGER')),
      keepPreviousData: true,
    }
  );

  const visits = data?.content || [];
  const totalPages = data ? data.totalPages : 1;

  const handleSort = useCallback((column: string) => {
    if (sortColumn === column) {
      setSortDirection((prevDirection) => (prevDirection === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  }, [sortColumn]);

  const handleFilter = useCallback(() => {
    setCurrentPage(1);
    queryClient.invalidateQueries(['visits']);
  }, [queryClient]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleExport = useCallback((allVisits: Visit[]) => {
    const headers = selectedColumns
      .filter(column => column !== 'outcome')
      .map((column) => {
        switch (column) {
          case 'storeName':
            return 'Customer Name';
          case 'employeeName':
            return 'Executive';
          case 'visit_date':
            return 'Date';
          case 'purpose':
            return 'Purpose';
          case 'visitStart':
            return 'Visit Start';
          case 'visitEnd':
            return 'Visit End';
          case 'intent':
            return 'Intent';
          case 'storePrimaryContact':
            return 'Phone Number';
          case 'district':
            return 'District';
          case 'subDistrict':
            return 'Sub District';
          default:
            return column;
        }
      });

    const data = allVisits.map((visit: Visit) => {
      const row: any = {};
      selectedColumns
        .filter(column => column !== 'outcome')
        .forEach((column) => {
          switch (column) {
            case 'visitStart':
              row[column] = formatDateTime(visit.checkinDate, visit.checkinTime);
              break;
            case 'visitEnd':
              row[column] = formatDateTime(visit.checkoutDate, visit.checkoutTime);
              break;
            case 'storePrimaryContact':
              row[column] = visit.storePrimaryContact;
              break;
            case 'district':
              row[column] = visit.district;
              break;
            case 'subDistrict':
              row[column] = visit.subDistrict;
              break;
            default:
              row[column] = visit[column as keyof Visit];
          }
        });
      return Object.values(row);
    });

    stringify(data, { header: true, columns: headers }, (err, output) => {
      if (err) {
        console.error('Error converting data to CSV:', err);
        return;
      }
      const blob = new Blob([output], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'visits.csv';
      link.click();
    });
  }, [selectedColumns]);

  const handleColumnSelect = useCallback((column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column) ? prev.filter((col) => col !== column) : [...prev, column]
    );
  }, []);

  const formatDateTime = useCallback((date: string | null | undefined, time: string | null | undefined) => {
    if (date && time) {
      const [hours, minutes] = time.split(':');
      const formattedTime = format(
        new Date(`${date}T${hours}:${minutes}`),
        'dd MMM h:mm a'
      );
      return formattedTime;
    }
    return '';
  }, []);

  const fetchAndExportAllVisits = useCallback(async () => {
    if (role === 'MANAGER' && !teamId) return;
    if (role === 'MANAGER') {
      const allVisits = await fetchAllVisitsForTeam(
        token,
        teamId!,
        startDate,
        endDate,
        sortColumn,
        sortDirection
      );
      handleExport(allVisits);
    } else if (role === 'ADMIN' || role === 'OFFICE MANAGER') {
      const allVisits = await fetchVisits(
        token,
        startDate,
        endDate,
        purpose,
        storeName,
        employeeName,
        sortColumn,
        sortDirection,
        1,
        1000 // Fetch a large number of visits for export
      );
      handleExport(allVisits.content);
    }
  }, [role, teamId, token, startDate, endDate, purpose, storeName, employeeName, sortColumn, sortDirection, handleExport]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error fetching visits: {(error as Error).message}</div>;
  }

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

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <h2 className="text-2xl font-bold mb-4">Visits List</h2>

      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <Label htmlFor="startDate">Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="endDate">End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="w-full sm:w-auto">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Enter purpose"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
            />
          </div>
          <div className="w-full sm:w-auto">
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input
              id="employeeName"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter employee name"
            />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Button onClick={handleFilter}>Apply Filters</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {['storeName', 'employeeName', 'visit_date', 'purpose', 'outcome', 'visitStart', 'visitEnd', 'intent'].map(column => (
                <DropdownMenuCheckboxItem
                  key={column}
                  checked={selectedColumns.includes(column)}
                  onCheckedChange={() => handleColumnSelect(column)}
                >
                  {column}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {role === 'ADMIN' && (
            <Button onClick={fetchAndExportAllVisits}>Export</Button>
          )}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <VisitsTable
          visits={visits.length > 0 ? visits : visitsNavigate}
          selectedColumns={selectedColumns}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onSort={handleSort}
          onBulkAction={() => { }}
        />
      </div>

      <div className="mt-8 flex justify-center">
        {renderPagination()}
      </div>
    </div>
  );
};

const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <VisitsList />
  </QueryClientProvider>
);

export default App;