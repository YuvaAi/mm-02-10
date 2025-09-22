import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  className?: string;
  onRowClick?: (record: T, index: number) => void;
  hoverable?: boolean;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyText = 'No data available',
  className = '',
  onRowClick,
  hoverable = true
}: TableProps<T>) => {
  const handleRowClick = (record: T, index: number) => {
    if (onRowClick) {
      onRowClick(record, index);
    }
  };

  if (loading) {
    return (
      <div className={`table bg-bg-secondary rounded-lg shadow-sm overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`table bg-bg-secondary rounded-lg shadow-sm overflow-hidden ${className}`}>
        <div className="p-8 text-center">
          <p className="text-text-secondary">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`table bg-bg-secondary rounded-lg shadow-sm overflow-hidden ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="bg-bg-tertiary">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-4 py-3 text-left text-sm font-semibold text-text border-b border-border ${
                  column.align === 'center' ? 'text-center' : 
                  column.align === 'right' ? 'text-right' : 'text-left'
                }`}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((record, index) => (
            <tr
              key={index}
              className={`border-b border-border-light ${
                hoverable ? 'hover:bg-bg-tertiary transition-colors duration-fast' : ''
              } ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => handleRowClick(record, index)}
            >
              {columns.map((column) => {
                const value = column.dataIndex ? record[column.dataIndex] : record[column.key];
                const renderedValue = column.render ? column.render(value, record, index) : value;

                return (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm text-text ${
                      column.align === 'center' ? 'text-center' : 
                      column.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {renderedValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;

