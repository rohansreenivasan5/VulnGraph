import React from 'react';
import { TableData } from '@/lib/graphTransform';

interface TableViewProps {
  data: TableData;
}

const TableView: React.FC<TableViewProps> = ({ data }) => {
  if (!data || data.rows.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">No data available</p>
          <p className="text-sm">Run a query to see the results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-zinc-900 border border-zinc-700 rounded p-4 overflow-auto">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-400 uppercase bg-zinc-800">
            <tr>
              {data.columns.map((column, index) => (
                <th key={index} className="px-4 py-3 whitespace-nowrap">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="bg-zinc-900 border-b border-zinc-700 hover:bg-zinc-800">
                {data.columns.map((column, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 whitespace-nowrap">
                    <div className="max-w-xs overflow-hidden text-ellipsis" title={String(row[column] || '')}>
                      {String(row[column] || '')}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
