import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Filter, X, ChevronDown } from 'lucide-react';
import AddVisits from '@/pages/AddVisits';

// Custom hook for debounced input
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

interface VisitsFilterProps {
    onFilter: (filters: { storeName: string; employeeName: string; purpose: string }, clearFilters: boolean) => void;
    onColumnSelect: (column: string) => void;
    onExport: () => void;
    selectedColumns: string[];
    viewMode: 'card' | 'table';
    startDate: Date | undefined;
    setStartDate: (date: Date | undefined) => void;
    endDate: Date | undefined;
    setEndDate: (date: Date | undefined) => void;
    purpose: string;
    setPurpose: (purpose: string) => void;
    storeName: string;
    setStoreName: (storeName: string) => void;
    employeeName: string;
    setEmployeeName: (employeeName: string) => void;
}

const VisitsFilter: React.FC<VisitsFilterProps> = ({
    onFilter,
    onColumnSelect,
    onExport,
    selectedColumns,
    viewMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    purpose,
    setPurpose,
    storeName,
    setStoreName,
    employeeName,
    setEmployeeName,
}) => {
    const role = useSelector((state: RootState) => state.auth.role);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [localStoreName, setLocalStoreName] = useState(storeName);
    const [localEmployeeName, setLocalEmployeeName] = useState(employeeName);
    const [localPurpose, setLocalPurpose] = useState(purpose);

    const debouncedStoreName = useDebounce(localStoreName, 300);
    const debouncedEmployeeName = useDebounce(localEmployeeName, 300);
    const debouncedPurpose = useDebounce(localPurpose, 300);

    useEffect(() => {
        onFilter({
            storeName: debouncedStoreName,
            employeeName: debouncedEmployeeName,
            purpose: debouncedPurpose
        }, false);
    }, [debouncedStoreName, debouncedEmployeeName, debouncedPurpose, onFilter]);

    const handleInputChange = (field: 'storeName' | 'employeeName' | 'purpose', value: string) => {
        switch (field) {
            case 'storeName':
                setLocalStoreName(value);
                break;
            case 'employeeName':
                setLocalEmployeeName(value);
                break;
            case 'purpose':
                setLocalPurpose(value);
                break;
        }
    };

    const handleClear = (field: 'storeName' | 'employeeName' | 'purpose') => {
        handleInputChange(field, '');
    };

    const columnMapping: Record<string, string> = {
        'Customer Name': 'storeName',
        'Executive': 'employeeName',
        'visit_date': 'visit_date',
        'Status': 'outcome',
        'purpose': 'purpose',
        'visitStart': 'visitStart',
        'visitEnd': 'visitEnd',
        'intent': 'intent',
    };

    const handleColumnSelect = (column: string) => {
        onColumnSelect(columnMapping[column]);
    };

    const formatDate = (date: Date | undefined) => {
        return date ? format(date, 'MMM d, yyyy') : '';
    };

    const FilterInput = ({ placeholder, value, onChange, onClear, field }: { placeholder: string; value: string; onChange: (value: string) => void; onClear: () => void; field: 'storeName' | 'employeeName' | 'purpose' }) => (
        <div className="relative w-full">
            <Input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full pr-8"
            />
            {value && (
                <button
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                    onClick={onClear}
                >
                    <X size={16} />
                </button>
            )}
        </div>
    );

    const DateFilter = ({ label, date, setDate }: { label: string; date: Date | undefined; setDate: (date: Date | undefined) => void }) => (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between text-left font-normal">
                    <span>{label}: {formatDate(date)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    showOutsideDays
                />
            </PopoverContent>
        </Popover>
    );

    const FilterContent = () => (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
                <AccordionTrigger>Customer & Executive</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <FilterInput
                            placeholder="Customer Name"
                            value={localStoreName}
                            onChange={(value) => handleInputChange('storeName', value)}
                            onClear={() => handleClear('storeName')}
                            field="storeName"
                        />
                        <FilterInput
                            placeholder="Sales Executive Name"
                            value={localEmployeeName}
                            onChange={(value) => handleInputChange('employeeName', value)}
                            onClear={() => handleClear('employeeName')}
                            field="employeeName"
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
                <AccordionTrigger>Purpose & Dates</AccordionTrigger>
                <AccordionContent>
                    <div className="space-y-4">
                        <FilterInput
                            placeholder="Purpose"
                            value={localPurpose}
                            onChange={(value) => handleInputChange('purpose', value)}
                            onClear={() => handleClear('purpose')}
                            field="purpose"
                        />
                        <DateFilter label="Start Date" date={startDate} setDate={setStartDate} />
                        <DateFilter label="End Date" date={endDate} setDate={setEndDate} />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );

    const ActionButtons = () => (
        <div className="flex flex-wrap gap-2">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => setIsModalOpen(true)} className="flex-1">Create Visits</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <AddVisits closeModal={() => setIsModalOpen(false)} />
                </DialogContent>
            </Dialog>
            {viewMode === 'table' && (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex-1">Columns</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {['Customer Name', 'Executive', 'visit_date', 'Status', 'purpose', 'visitStart', 'visitEnd', 'intent'].map(column => (
                                <DropdownMenuCheckboxItem
                                    key={column}
                                    checked={selectedColumns.includes(columnMapping[column])}
                                    onCheckedChange={() => handleColumnSelect(column)}
                                >
                                    {column}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {role === 'ADMIN' && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex-1">Bulk Actions</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onSelect={onExport}>Export</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </>
            )}
        </div>
    );

    return (
        <>
            <div className="md:hidden fixed top-4 right-4 z-50">
                <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                            <SheetTitle>Filters</SheetTitle>
                        </SheetHeader>
                        <div className="py-4 space-y-6">
                            <FilterContent />
                            <ActionButtons />
                        </div>
                        <SheetFooter>
                            <Button onClick={() => setIsDrawerOpen(false)} className="w-full">Apply Filters</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            <div className="hidden md:block pl-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-wrap gap-4 justify-between items-start">
                            <div className="grid grid-cols-3 gap-4">
                                <FilterInput
                                    placeholder="Customer Name"
                                    value={localStoreName}
                                    onChange={(value) => handleInputChange('storeName', value)}
                                    onClear={() => handleClear('storeName')}
                                    field="storeName"
                                />
                                <FilterInput
                                    placeholder="Sales Executive Name"
                                    value={localEmployeeName}
                                    onChange={(value) => handleInputChange('employeeName', value)}
                                    onClear={() => handleClear('employeeName')}
                                    field="employeeName"
                                />
                                <FilterInput
                                    placeholder="Purpose"
                                    value={localPurpose}
                                    onChange={(value) => handleInputChange('purpose', value)}
                                    onClear={() => handleClear('purpose')}
                                    field="purpose"
                                />
                                <DateFilter label="Start Date" date={startDate} setDate={setStartDate} />
                                <DateFilter label="End Date" date={endDate} setDate={setEndDate} />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <ActionButtons />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default VisitsFilter;