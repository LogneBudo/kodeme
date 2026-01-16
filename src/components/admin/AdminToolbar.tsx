import React from "react";
import { Search, Filter, Trash2, RefreshCw } from "lucide-react";
import styles from "./AdminToolbar.module.css";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdminToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  filterOptions?: FilterOption[];
  filterLabel?: string;
  
  selectedCount?: number;
  onBulkDelete?: () => void;
  onRefresh?: () => void;
  
  showBulkActions?: boolean;
}

/**
 * Reusable admin toolbar with search, filters, and bulk actions
 * Provides consistent UX across admin pages
 */
const AdminToolbar = React.memo(function AdminToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  
  filterValue,
  onFilterChange,
  filterOptions,
  filterLabel = "Filter",
  
  selectedCount = 0,
  onBulkDelete,
  onRefresh,
  
  showBulkActions = false,
}: AdminToolbarProps) {
  const hasFilters = filterOptions && filterOptions.length > 0;
  
  return (
    <div className={styles.toolbar}>
      <div className={styles.leftSection}>
        {/* Search Input */}
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        {/* Filter Dropdown */}
        {hasFilters && onFilterChange && (
          <div className={styles.filterContainer}>
            <Filter size={16} className={styles.filterIcon} />
            <select
              value={filterValue || "all"}
              onChange={(e) => onFilterChange(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All {filterLabel}</option>
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                  {option.count !== undefined && ` (${option.count})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className={styles.rightSection}>
        {/* Bulk Actions */}
        {showBulkActions && selectedCount > 0 && onBulkDelete && (
          <button
            onClick={onBulkDelete}
            className={styles.bulkDeleteButton}
            title={`Delete ${selectedCount} selected item${selectedCount > 1 ? 's' : ''}`}
          >
            <Trash2 size={16} />
            Delete ({selectedCount})
          </button>
        )}
        
        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={styles.refreshButton}
            title="Refresh data"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  );
});

export default AdminToolbar;
